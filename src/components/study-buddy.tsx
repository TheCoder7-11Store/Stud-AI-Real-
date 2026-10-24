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
  { right: 12, bottom: 130 },
  { right: 12, bottom: 260 },
  { right: 12, bottom: 380 },
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
        @keyframes lumi-wave{0%,100%{transform:rotate(0)}50%{transform:rotate(-15deg)}}
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
        style={{ animation: "lumi-float 4s ease-in-out infinite" }}
        onClick={() => {
          setSay(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
          setTalking(true);
          setSpot((s) => (s + 1) % SPOTS.length);
        }}
        onDoubleClick={() => setHidden(true)}
        aria-label="Lumi, your study buddy (double-click to hide)"
        title="Click to chat · double-click to hide"
      >
        <svg width="80" height="130" viewBox="0 0 80 130" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke="var(--brand)" strokeWidth="2.5">
          <path d="M22 26q2-16 18-16t18 16q-8-6-18-6t-18 6z" fill="var(--brand)" />
          <circle cx="40" cy="30" r="16" fill="var(--card)" />
          <g style={{ transformOrigin: "40px 30px", animation: "lumi-blink 4s infinite" }} stroke="none" fill="var(--brand)">
            <circle cx="34" cy="29" r="2" />
            <circle cx="46" cy="29" r="2" />
          </g>
          {talking ? (
            <ellipse cx="40" cy="38" rx="3" ry="2" fill="var(--brand)" stroke="none" style={{ animation: "lumi-talk .3s infinite" }} />
          ) : (
            <path d="M35 37q5 4 10 0" />
          )}
          <path d="M40 46v4" />
          <path d="M24 92V62q0-12 16-12t16 12v30z" fill="var(--accent-warm)" fillOpacity=".25" />
          <path d="M24 62q-10 10-6 24" />
          <path d="M56 62q12 -4 14 -18" style={{ transformOrigin: "56px 62px", animation: talking ? "lumi-wave .6s ease-in-out infinite" : undefined }} />
          <path d="M33 92v28M47 92v28M33 120h-6M47 120h6" />
        </svg>
      </button>
    </div>
  );
}
