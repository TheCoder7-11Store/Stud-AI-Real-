import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, MicOff, Pause, Play, RotateCcw, SkipForward, Square, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeachingBoard } from "@/components/teaching-board";
import { applyBoardAction, lessonTranscript, type BoardAction, type Lesson, type LessonStep } from "@/lib/lumi/lesson";
import { LUMI_VOICES, VOICE_PREFERENCE_KEY } from "@/lib/lumi/voices";
import { recognitionConstructor, type Recognition } from "@/lib/lumi/recognition";
import { streamSpeech } from "@/lib/lumi/stream-speech";

export type LessonMode = "visual" | "talk";
export type LessonActivity = "idle" | "listening" | "thinking" | "writing" | "speaking";
type Turn = { role: "user" | "assistant"; content: string };

const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  signal.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Stopped", "AbortError")); }, { once: true });
});

export function LumiLesson({ mode, history, onClose, onActivity, onLessonComplete }: {
  mode: LessonMode; history: Turn[]; onClose: () => void;
  onActivity: (activity: LessonActivity, caption?: string) => void;
  onLessonComplete: (question: string, lesson: Lesson) => void;
}) {
  const [question, setQuestion] = useState("");
  const [steps, setSteps] = useState<LessonStep[]>([]);
  const [board, setBoard] = useState<BoardAction[]>([]);
  const [current, setCurrent] = useState(-1);
  const [activity, setActivity] = useState<LessonActivity>("idle");
  const [paused, setPaused] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [language, setLanguage] = useState("en-US");
  const [caption, setCaption] = useState("");
  const [micSupported, setMicSupported] = useState(false);
  const [micConsent, setMicConsent] = useState(false);
  const [listening, setListening] = useState(false);
  const [title, setTitle] = useState("");
  const conversation = useRef<Turn[]>([]);
  const stepsRef = useRef<LessonStep[]>([]);
  const runRef = useRef<AbortController | null>(null);
  const fetchRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);
  const skipRef = useRef<AbortController | null>(null);
  const doneRef = useRef(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const autoListenRef = useRef(false);

  useEffect(() => {
    setLanguage(localStorage.getItem(VOICE_PREFERENCE_KEY) ?? "en-US");
    setMicSupported(!!recognitionConstructor());
    return () => { runRef.current?.abort(); fetchRef.current?.abort(); recognitionRef.current?.abort(); void audioContextRef.current?.close(); };
  }, []);
  useEffect(() => { conversation.current = history.slice(-12); }, [history]);

  const report = (next: LessonActivity, text = "") => { setActivity(next); if (text) setCaption(text); onActivity(next, text); };
  const audioContext = async () => {
    const context = audioContextRef.current ?? new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = context;
    if (context.state === "suspended") await context.resume();
    return context;
  };

  const waitWhilePaused = async (signal: AbortSignal) => { while (pausedRef.current) await sleep(150, signal); };
  const playStep = async (step: LessonStep, index: number, signal: AbortSignal) => {
    setCurrent(index); await waitWhilePaused(signal);
    report("writing", step.title);
    const skip = new AbortController(); skipRef.current = skip;
    const stepSignal = AbortSignal.any([signal, skip.signal]);
    try {
      // Board writes happen as discrete teaching moves while the narration starts.
      const writing = (async () => {
        for (const action of step.actions) {
          await waitWhilePaused(stepSignal);
          setBoard(b => applyBoardAction(b, action));
          await sleep(action.kind === "equation" ? 900 : 550, stepSignal);
        }
      })();
      await sleep(250, stepSignal);
      await waitWhilePaused(stepSignal);
      setCaption(step.narration);
      if (voiceOn) {
        const context = await audioContext();
        await streamSpeech("/api/speech", step.narration, stepSignal, { language, context, onAudio: () => report("speaking", step.narration) });
      } else {
        report("speaking", step.narration);
        await sleep(Math.min(9000, 1800 + step.narration.length * 45), stepSignal);
      }
      await writing;
      if (step.question) {
        report("idle", step.question);
        setPaused(true); pausedRef.current = true;
        if (mode === "talk") autoListenRef.current = true;
        await waitWhilePaused(stepSignal);
      }
    } catch (e) {
      if (skip.signal.aborted && !signal.aborted) { step.actions.forEach(a => setBoard(b => applyBoardAction(b, a))); return; }
      if ((e as Error).name !== "AbortError") {
        // Audio problems must not stop the lesson; captions and board remain.
        setVoiceOn(false); toast.error("Lumi’s voice is unavailable right now, so captions will continue.");
        step.actions.forEach(a => setBoard(b => applyBoardAction(b, a)));
        return;
      }
      throw e;
    }
  };

  const ask = async (raw?: string) => {
    const text = (raw ?? question).trim();
    if (!text || activity === "thinking") return;
    runRef.current?.abort(); fetchRef.current?.abort(); recognitionRef.current?.abort();
    if (voiceOn) await audioContext().catch(() => setVoiceOn(false));
    const run = new AbortController(); runRef.current = run;
    const fetchCtrl = new AbortController(); fetchRef.current = fetchCtrl;
    setQuestion(""); setSteps([]); stepsRef.current = []; setCurrent(-1); setPaused(false); pausedRef.current = false; doneRef.current = false;
    report("thinking", "Planning the lesson…");
    const messages = [...conversation.current, { role: "user" as const, content: text }];
    try {
      const res = await fetch("/api/lesson", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, language }), signal: fetchCtrl.signal });
      if (!res.ok || !res.body) throw new Error((await res.text()) || "Lumi couldn’t start the lesson.");
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "", played = 0, finished: Lesson | null = null;
      const queue: Promise<void>[] = [];
      let player = Promise.resolve();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines.filter(Boolean)) {
          const event = JSON.parse(line) as { type: string; step?: LessonStep; lesson?: Lesson; title?: string; message?: string };
          if (event.type === "error") throw new Error(event.message);
          if (event.type === "done" && event.lesson) finished = event.lesson;
          if (event.type === "step" && event.step) {
            const step = event.step, index = played++;
            if (event.title) setTitle(event.title);
            stepsRef.current = [...stepsRef.current, step]; setSteps(stepsRef.current);
            player = player.then(() => playStep(step, index, run.signal)); queue.push(player);
          }
        }
      }
      await Promise.all(queue);
      if (!finished) throw new Error("The lesson ended before Lumi finished.");
      conversation.current = [...messages, { role: "assistant" as const, content: lessonTranscript(finished) }].slice(-12);
      doneRef.current = true;
      onLessonComplete(text, finished);
      report("idle", "Lesson complete. Ask a follow-up or replay any step.");
      if (mode === "talk" && micConsent) startListening();
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      report("idle", "I couldn’t finish that. Try again or type your question.");
      toast.error((e as Error).message || "Lumi couldn’t finish the lesson.");
    }
  };

  const endLesson = () => { runRef.current?.abort(); fetchRef.current?.abort(); recognitionRef.current?.abort(); setPaused(false); pausedRef.current = false; report("idle", "Lesson ended."); };
  const togglePause = () => { const next = !pausedRef.current; pausedRef.current = next; setPaused(next); if (next) { void audioContextRef.current?.suspend(); report("idle", "Paused"); } else void audioContextRef.current?.resume(); };
  const replay = async (index = Math.max(0, current)) => {
    const step = stepsRef.current[index]; if (!step) return;
    runRef.current?.abort(); const run = new AbortController(); runRef.current = run;
    pausedRef.current = false; setPaused(false);
    try { await playStep(step, index, run.signal); report("idle", "Replayed. Ask about it or continue the lesson."); } catch { /* stopped */ }
  };
  const previewVoice = async () => {
    const ctrl = new AbortController(); runRef.current?.abort(); runRef.current = ctrl;
    try { report("speaking", "Hello, I’m Lumi."); await streamSpeech("/api/speech", "Hello, I’m Lumi. Let’s learn this together.", ctrl.signal, { language, context: await audioContext() }); report("idle"); }
    catch (e) { if ((e as Error).name !== "AbortError") toast.error("This voice is unavailable. Captions still work."); report("idle"); }
  };

  function startListening() {
    const Ctor = recognitionConstructor();
    if (!Ctor) { toast.error("Speech recognition isn’t supported here. Type to Lumi instead."); return; }
    if (!micConsent && !window.confirm("Lumi needs microphone access to hear your question. Your voice is converted to text and not saved as a recording. Allow?")) return;
    setMicConsent(true);
    if (activity === "speaking" || activity === "writing") { runRef.current?.abort(); report("idle", "Go ahead, I’m listening."); }
    recognitionRef.current?.abort();
    const recognition = new Ctor(); recognitionRef.current = recognition;
    recognition.lang = language; recognition.continuous = false; recognition.interimResults = true;
    let finalText = "";
    recognition.onresult = event => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript; else interim += transcript;
      }
      setQuestion(finalText + interim); setCaption(finalText + interim || "Listening…");
    };
    recognition.onerror = event => {
      setListening(false); report("idle");
      const reason = event.error === "not-allowed" || event.error === "service-not-allowed" ? "Microphone access was blocked. You can type instead." : event.error === "no-speech" ? "I didn’t hear anything. Try again closer to the mic." : event.error === "network" ? "Speech recognition lost its connection. You can type instead." : "I couldn’t understand that. Please try again or type.";
      if (event.error !== "aborted") toast.error(reason);
    };
    recognition.onend = () => { setListening(false); if (finalText.trim()) void ask(finalText); else report("idle"); };
    setListening(true); report("listening", "Listening…");
    try { recognition.start(); } catch { setListening(false); report("idle"); toast.error("The microphone couldn’t start. Type instead."); }
  }
  useEffect(() => { if (paused && autoListenRef.current && micConsent) { autoListenRef.current = false; startListening(); } });

  const answerCheck = (answer: string) => {
    const step = stepsRef.current[current];
    pausedRef.current = false; setPaused(false);
    if (step?.question) { conversation.current = [...conversation.current, { role: "assistant" as const, content: step.question }].slice(-12); }
    void ask(`My answer to “${step?.question ?? "your question"}”: ${answer}. Please give me feedback and continue teaching from here.`);
  };

  const checkPending = paused && !!steps[current]?.question && activity === "idle";
  return <section className="mx-auto mb-4 w-full max-w-5xl rounded-2xl border border-border bg-card/95 shadow-xl" aria-label={mode === "visual" ? "Interactive visual lesson" : "Talk to Lumi"}>
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
      <div className="mr-auto"><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{mode === "visual" ? "Interactive visual lesson" : "Talk to Lumi"}</p><h2 className="font-display text-xl">{title || "What should Lumi teach?"}</h2></div>
      <Select value={language} onValueChange={v => { setLanguage(v); localStorage.setItem(VOICE_PREFERENCE_KEY, v); }}><SelectTrigger className="h-8 w-48" aria-label="Voice and lesson language"><SelectValue /></SelectTrigger><SelectContent>{LUMI_VOICES.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}</SelectContent></Select>
      <Button variant="outline" size="sm" onClick={previewVoice}><Volume2 className="size-4" /> Preview</Button>
      <Button variant="ghost" size="icon" onClick={() => setVoiceOn(v => !v)} aria-label={voiceOn ? "Use captions only" : "Turn Lumi’s voice on"}>{voiceOn ? <Volume2 className="size-4" /> : <Volume2 className="size-4 opacity-40" />}</Button>
      <Button variant="ghost" size="icon" onClick={() => { endLesson(); onClose(); }} aria-label="Close lesson"><X className="size-4" /></Button>
    </div>
    <TeachingBoard actions={board} writing={activity === "writing"} />
    <div className="border-t border-border px-4 py-3" aria-live="polite">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize">{activity === "idle" && paused ? "paused" : activity}</span>
        {steps.length > 0 && <span className="text-xs text-muted-foreground">Step {Math.max(1,current+1)} of {steps.length}{!doneRef.current && activity !== "idle" ? "+" : ""}</span>}
        <p className="min-w-0 flex-1 text-sm leading-relaxed">{caption || (mode === "talk" ? "Press the microphone and ask Lumi a question." : "Type a topic and Lumi will teach it step by step.")}</p>
        <Button size="icon" variant="outline" onClick={togglePause} disabled={!steps.length} aria-label={paused ? "Resume lesson" : "Pause lesson"}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</Button>
        <Button size="icon" variant="outline" onClick={() => void replay()} disabled={!steps.length || activity === "thinking"} aria-label="Replay current step"><RotateCcw className="size-4" /></Button>
        <Button size="icon" variant="outline" onClick={() => skipRef.current?.abort()} disabled={!steps.length || activity === "idle"} aria-label="Skip step"><SkipForward className="size-4" /></Button>
        <Button size="icon" variant="outline" onClick={endLesson} disabled={activity === "idle" && !paused} aria-label="End lesson"><Square className="size-4" /></Button>
      </div>
      <form className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); checkPending ? answerCheck(question) : void ask(); }}>
        {mode === "talk" && <Button type="button" size="icon" className="size-11 shrink-0 rounded-full" variant={listening ? "destructive" : "default"} onClick={() => listening ? recognitionRef.current?.stop() : startListening()} disabled={!micSupported} aria-label={listening ? "Stop listening" : "Talk to Lumi"}>{listening ? <MicOff /> : <Mic />}</Button>}
        <Textarea value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} rows={1} className="min-h-11 resize-none" placeholder={checkPending ? "Type your answer…" : mode === "talk" && !micSupported ? "Voice isn’t supported here — type to Lumi" : "Ask a question or interrupt Lumi…"} />
        <Button type="submit" disabled={!question.trim() || activity === "thinking"}>{checkPending ? "Answer" : steps.length ? "Ask" : "Teach me"}</Button>
      </form>
      {checkPending && <div className="mt-2 flex gap-2"><Button variant="ghost" size="sm" onClick={togglePause}>Continue without answering</Button><Button variant="ghost" size="sm" onClick={() => void ask(`Please explain step ${current + 1} again more simply with another example.`)}>Explain differently</Button></div>}
    </div>
  </section>;
}