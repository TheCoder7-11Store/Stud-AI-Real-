import { useEffect, useRef, useState } from "react";
import { RotateCcw, Square, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import lumiCharacter from "@/assets/lumi-reference.png";

const CHEERS = [
  "You've got this! 💪",
  "Ask me anything — no question is too small!",
  "Tip: explain it back to me to really lock it in 📝",
  "Small steps every day beat cramming 🎯",
  "Stuck? Tell me what you've tried so far 💡",
  "Want a quick quiz? Just ask!",
];

const VOICE_KEY = "studai.lumi-voice";

type Mode = "idle" | "thinking" | "writing" | "speaking";

/** Turn Markdown notes into a short, speakable script (skips references & answer keys). */
export function toSpeech(text: string) {
  const main = text.split(/📚|Answer key|📝 Exam-style/i)[0];
  const clean = main
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$([^$]*)\$/g, "$1")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_>`|~]+/g, " ")
    .replace(/^\s*[-•]\s+/gm, ". ")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > 700 ? clean.slice(0, 700).replace(/\s\S*$/, "") + "." : clean;
}

function summarize(text: string) {
  const parts = toSpeech(text).split(/\s*\.\s+|(?<=[!?])\s/).map((x) => x.trim());
  const first = parts.find((x) => x.length > 25) ?? parts[0] ?? "";
  return first.length > 120 ? first.slice(0, 117) + "…" : first;
}

export function StudyBuddy({
  status,
  lastAssistantText,
  onExplainMore,
}: {
  status: string;
  lastAssistantText?: string;
  onExplainMore?: () => void;
}) {
  const [say, setSay] = useState<string | null>("Hello! 👋 Hi, I'm Lumi!");
  const [hidden, setHidden] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [voiceOn, setVoiceOn] = useState(false);
  const [mouth, setMouth] = useState(false);
  const lastRef = useRef<string | undefined>(undefined);
  const spokenRef = useRef<string>("");
  const prevStatus = useRef(status);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    setVoiceOn(localStorage.getItem(VOICE_KEY) === "on");
    lastRef.current = lastAssistantText;
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopSpeech = () => {
    if (canSpeak) window.speechSynthesis.cancel();
    setMouth(false);
    setMode((m) => (m === "speaking" ? "idle" : m));
  };

  const speak = (text: string) => {
    if (!canSpeak || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const v =
      voices.find((x) => /en/i.test(x.lang) && /natural|neural|google|samantha|aria/i.test(x.name)) ??
      voices.find((x) => /^en/i.test(x.lang));
    if (v) u.voice = v;
    u.rate = 1;
    u.onstart = () => setMode("speaking");
    u.onboundary = () => {
      setMouth(true);
      setTimeout(() => setMouth(false), 160);
    };
    u.onend = u.onerror = () => {
      setMouth(false);
      setMode("idle");
    };
    window.speechSynthesis.speak(u);
  };

  // React to the chat lifecycle: thinking → writing → speaking → idle.
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;
    if (status === "submitted") {
      stopSpeech();
      setMode("thinking");
      setSay("Hmm, let me think about that… 🤔");
    } else if (status === "streaming") {
      setMode("writing");
      setSay("Writing your notes… ✍️");
    } else if (status === "error") {
      setMode("idle");
      setSay("Oops, something went wrong. Try asking again? 🙏");
    } else if (status === "ready" && (prev === "streaming" || prev === "submitted")) {
      if (lastAssistantText && lastAssistantText !== lastRef.current) {
        lastRef.current = lastAssistantText;
        spokenRef.current = toSpeech(lastAssistantText);
        setSay(summarize(lastAssistantText) || "Here you go! 🎉");
        if (voiceOn) speak(spokenRef.current);
        else setMode("idle");
      } else setMode("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, lastAssistantText]);

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    localStorage.setItem(VOICE_KEY, next ? "on" : "off");
    if (!next) stopSpeech();
  };

  const replay = () => {
    const text = spokenRef.current || (lastAssistantText ? toSpeech(lastAssistantText) : "");
    spokenRef.current = text;
    speak(text);
  };

  const busy = mode === "thinking" || mode === "writing";
  const controls = (
    <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/95 p-1 shadow-md backdrop-blur">
      {canSpeak && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full"
            onClick={toggleVoice}
            aria-label={voiceOn ? "Mute Lumi" : "Let Lumi read answers aloud"}
            title={voiceOn ? "Mute Lumi" : "Let Lumi read answers aloud"}
          >
            {voiceOn ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full"
            onClick={replay}
            disabled={!lastAssistantText || busy}
            aria-label="Replay answer"
            title="Replay answer"
          >
            <RotateCcw className="size-3.5" />
          </Button>
          {mode === "speaking" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-full"
              onClick={stopSpeech}
              aria-label="Stop speaking"
              title="Stop speaking"
            >
              <Square className="size-3.5" />
            </Button>
          )}
        </>
      )}
      {onExplainMore && lastAssistantText && !busy && (
        <Button
          variant="ghost"
          className="h-7 rounded-full px-2.5 text-xs"
          onClick={onExplainMore}
        >
          Explain more
        </Button>
      )}
    </div>
  );

  if (hidden) {
    return (
      <div className="fixed bottom-28 right-4 z-40 flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => setHidden(false)}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground shadow-md"
        >
          Bring Lumi back ✨
        </Button>
      </div>
    );
  }

  // Purposeful positions: rests in the corner, steps up beside the notes while working.
  const pose: Record<Mode, string> = {
    idle: "translate-y-0 rotate-0",
    thinking: "-translate-y-6 -rotate-3",
    writing: "-translate-y-24 rotate-2",
    speaking: "-translate-y-12 rotate-0",
  };
  const anim: Record<Mode, string> = {
    idle: "lumi-idle 4s ease-in-out infinite",
    thinking: "lumi-think 1.6s ease-in-out infinite",
    writing: "lumi-write 0.6s ease-in-out infinite",
    speaking: mouth ? "none" : "lumi-talk 0.9s ease-in-out infinite",
  };

  return (
    <>
      {/* Mobile: compact controls only, so Lumi never covers the chat. */}
      <div className="fixed right-3 top-16 z-40 sm:hidden">{controls}</div>

      <div className="pointer-events-none fixed bottom-[200px] right-2 z-40 hidden lg:block">
        <style>{`
          @keyframes lumi-idle{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
          @keyframes lumi-think{0%,100%{transform:rotate(0)}50%{transform:rotate(-4deg) translateY(-4px)}}
          @keyframes lumi-write{0%,100%{transform:translateX(0) rotate(0)}50%{transform:translateX(-3px) rotate(1.5deg)}}
          @keyframes lumi-talk{0%,100%{transform:scale(1)}50%{transform:scale(1.025) translateY(-2px)}}
          @media (prefers-reduced-motion: reduce){.lumi-anim,.lumi-pos{animation:none !important;transition:none !important}}
        `}</style>
        <div className={`lumi-pos transition-transform duration-700 ease-out ${pose[mode]}`}>
          {say && (
            <div className="pointer-events-auto absolute bottom-[70%] right-[78%] w-60 rounded-2xl rounded-br-sm border border-border bg-card/95 px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-lg backdrop-blur">
              {say}
              <Button
                variant="ghost"
                onClick={() => setSay(null)}
                className="absolute -right-2 -top-2 h-auto rounded-full border border-border bg-background p-0.5 text-muted-foreground"
                aria-label="Close bubble"
              >
                <X className="size-3" />
              </Button>
            </div>
          )}
          <div className="absolute -top-4 right-4 z-10">{controls}</div>
          <Button
            variant="ghost"
            className="lumi-anim pointer-events-auto block h-auto w-[220px] origin-bottom rounded-none p-0 hover:bg-transparent"
            style={{ animation: anim[mode] }}
            onClick={() => {
              setSay(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
            }}
            onDoubleClick={() => setHidden(true)}
            aria-label="Lumi, your study buddy (double-click to hide)"
            title="Click to chat · double-click to hide"
          >
            <img
              src={lumiCharacter}
              alt="Lumi, a smiling person pointing upward"
              width={805}
              height={846}
              className="block h-auto w-full -scale-x-100 select-none"
              draggable={false}
            />
          </Button>
        </div>
      </div>
      {/* Tablet width: controls only */}
      <div className="fixed right-3 top-16 z-40 hidden sm:block lg:hidden">{controls}</div>
    </>
  );
}
