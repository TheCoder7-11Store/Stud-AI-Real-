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
  { right: 10, bottom: 110 },
  { right: 10, bottom: 240 },
  { right: 10, bottom: 370 },
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
        <div className="pointer-events-auto absolute bottom-full right-0 mb-2 w-72 rounded-2xl rounded-br-sm border border-border bg-card/95 px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-lg backdrop-blur">
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
        <svg
          width="164"
          height="174"
          viewBox="0 0 160 170"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="var(--brand)"
          strokeWidth="2.6"
        >
          {/* neck */}
          <path d="M66 60h20v20H66z" fill="var(--card)" />
          <path d="M66 60v18M86 60v18" />
          {/* stocky torso, cropped at the waist */}
          <path d="M30 166V104q0-26 30-28h32q30 2 30 28v62z" fill="var(--accent-warm)" fillOpacity=".9" />
          <path d="M62 77q14 11 28-1" />
          <path d="M28 166h104" strokeWidth="3" />
          {/* arm relaxed across the chest */}
          <path d="M42 98c-14 14 2 32 24 30" stroke="var(--brand)" strokeWidth="17" />
          <path d="M42 98c-14 14 2 32 24 30" stroke="var(--card)" strokeWidth="12" />
          <ellipse cx="74" cy="127" rx="9" ry="7" fill="var(--card)" transform="rotate(-8 74 127)" />
          <path d="M81 122q8 0 10 4M82 129q7 2 8 6" strokeWidth="2.2" />
          {/* raised arm, index finger pointing up */}
          <g style={{ transformOrigin: "114px 94px", animation: talking ? "lumi-wave .6s ease-in-out infinite" : undefined }}>
            <path d="M114 94c16-6 20-28 16-50" stroke="var(--brand)" strokeWidth="17" />
            <path d="M114 94c16-6 20-28 16-50" stroke="var(--card)" strokeWidth="12" />
            <path d="M130 30V14" stroke="var(--brand)" strokeWidth="12" />
            <path d="M130 30V14" stroke="var(--card)" strokeWidth="7" />
            <circle cx="130" cy="38" r="9" fill="var(--card)" />
          </g>
          {/* head, tipped slightly upward */}
          <g transform="rotate(-5 76 46)">
            <ellipse cx="76" cy="46" rx="28" ry="27" fill="var(--card)" />
            <path d="M102 40q11 5 1 14" />
            <path
              d="M49 44C48 18 104 12 105 38c-9-12-23-16-33-13-12 3-19 9-23 19z"
              style={{ fill: "color-mix(in oklab, var(--foreground) 78%, var(--brand))" }}
            />
            <circle cx="47" cy="45" r="6" style={{ fill: "color-mix(in oklab, var(--foreground) 78%, var(--brand))" }} />
            <g style={{ transformOrigin: "76px 44px", animation: "lumi-blink 4s infinite" }} stroke="none" fill="var(--brand)">
              <circle cx="66" cy="44" r="2.8" />
              <circle cx="84" cy="43" r="2.8" />
            </g>
            <path d="M59 35q7-5 14-2M77 33q7-4 14 0" strokeWidth="2.2" />
            <path d="M74 48q7 7-2 9" strokeWidth="2.2" />
            {talking ? (
              <ellipse cx="75" cy="61" rx="4" ry="3" fill="var(--brand)" stroke="none" style={{ animation: "lumi-talk .3s infinite" }} />
            ) : (
              <path d="M62 60q12 10 26-2" />
            )}
          </g>
        </svg>
      </button>
    </div>
  );
}
