import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const CHEERS = [
  "You've got this! 💪",
  "Ask me anything — no question is too small!",
  "Tip: explain it back to me to really lock it in 📝",
  "Small steps every day beat cramming 🎯",
  "Stuck? Tell me what you've tried so far 💡",
  "Want a quick quiz? Just ask!",
];

const SPOTS = [
  { right: 24, bottom: 140 },
  { right: 120, bottom: 200 },
  { right: 40, bottom: 300 },
  { right: 200, bottom: 150 },
];

function summarize(text: string) {
  const clean = text
    .replace(/\$\$[\s\S]*?\$\$|\$[^$]*\$/g, "")
    .replace(/[#*_>`|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const first = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
  return first.length > 120 ? first.slice(0, 117) + "…" : first;
}

export function StudyBuddy({
  status,
  lastAssistantText,
}: {
  status: string;
  lastAssistantText?: string;
}) {
  const [spot, setSpot] = useState(0);
  const [say, setSay] = useState<string | null>("Hi! I'm Lumi ✨ Click me anytime!");
  const [hidden, setHidden] = useState(false);
  const [talking, setTalking] = useState(false);
  const lastRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const t = setInterval(() => setSpot((s) => (s + 1) % SPOTS.length), 9000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (status === "submitted" || status === "streaming") {
      setSay("Hmm, let me think about that… 🤔");
      setTalking(true);
    } else if (status === "ready" && lastAssistantText && lastAssistantText !== lastRef.current) {
      lastRef.current = lastAssistantText;
      setSay(summarize(lastAssistantText) || "Here you go! 🎉");
      setTalking(true);
    }
  }, [status, lastAssistantText]);

  useEffect(() => {
    if (!talking) return;
    const t = setTimeout(() => setTalking(false), 2500);
    return () => clearTimeout(t);
  }, [talking, say]);

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        className="fixed bottom-28 right-4 z-40 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground shadow-md"
      >
        Bring Lumi back ✨
      </button>
    );
  }

  const pos = SPOTS[spot];
  return (
    <div
      className="pointer-events-none fixed z-40 hidden transition-all duration-[2500ms] ease-in-out sm:block"
      style={{ right: pos.right, bottom: pos.bottom }}
    >
      <style>{`
        @keyframes lumi-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes lumi-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
        @keyframes lumi-talk{0%,100%{ry:1.5}50%{ry:4}}
      `}</style>
      {say && (
        <div className="pointer-events-auto absolute bottom-full right-0 mb-2 w-60 rounded-2xl rounded-br-sm border border-border bg-card/95 px-3 py-2 text-xs leading-relaxed text-foreground shadow-lg backdrop-blur">
          {say}
          <button
            onClick={() => setSay(null)}
            className="absolute -right-2 -top-2 rounded-full border border-border bg-background p-0.5 text-muted-foreground"
            aria-label="Close bubble"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
      <button
        className="pointer-events-auto block"
        style={{ animation: "lumi-float 3s ease-in-out infinite" }}
        onClick={() => {
          setSay(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
          setTalking(true);
          setSpot((s) => (s + 1) % SPOTS.length);
        }}
        onDoubleClick={() => setHidden(true)}
        aria-label="Lumi, your study buddy (double-click to hide)"
        title="Click to chat · double-click to hide"
      >
        <svg width="72" height="80" viewBox="0 0 72 80" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="36" y1="12" x2="36" y2="4" stroke="var(--brand)" strokeWidth="2.5" />
          <circle cx="36" cy="4" r="3" fill="var(--accent-warm)" />
          <path
            d="M10 44c0-18 11-32 26-32s26 14 26 32-11 28-26 28S10 62 10 44z"
            fill="var(--card)"
            stroke="var(--brand)"
            strokeWidth="2.5"
          />
          <g style={{ transformOrigin: "36px 40px", animation: "lumi-blink 4s infinite" }}>
            <circle cx="27" cy="40" r="3" fill="var(--brand)" />
            <circle cx="45" cy="40" r="3" fill="var(--brand)" />
          </g>
          <circle cx="20" cy="50" r="3" fill="var(--accent-warm)" opacity=".4" />
          <circle cx="52" cy="50" r="3" fill="var(--accent-warm)" opacity=".4" />
          {talking ? (
            <ellipse
              cx="36" cy="53" rx="4" ry="3" fill="var(--brand)"
              style={{ animation: "lumi-talk .3s infinite" }}
            />
          ) : (
            <path d="M30 52q6 5 12 0" stroke="var(--brand)" strokeWidth="2.5" />
          )}
          <path d="M8 46q-6 4-4 10M64 46q6 4 4 10" stroke="var(--brand)" strokeWidth="2.5" />
        </svg>
      </button>
    </div>
  );
}
