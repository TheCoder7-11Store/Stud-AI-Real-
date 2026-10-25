import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
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
      <Button variant="ghost"
        onClick={() => setHidden(false)}
        className="fixed bottom-28 right-4 z-40 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground shadow-md"
      >
        Bring Lumi back ✨
      </Button>
    );
  }

  const pos = SPOTS[spot];
  return (
    <div
      className="lumi-character pointer-events-none fixed z-40 hidden transition-all duration-[2500ms] ease-in-out sm:block"
      style={{ right: pos.right, bottom: pos.bottom }}
    >
      <style>{`
        @keyframes lumi-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        
        
        @media (prefers-reduced-motion: reduce){.lumi-character{animation:none !important;transition:none !important}}
      `}</style>
      {say && (
        <div className="pointer-events-auto absolute bottom-full right-0 mb-2 w-72 rounded-2xl rounded-br-sm border border-border bg-card/95 px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-lg backdrop-blur">
          {say}
          <Button variant="ghost"
            onClick={() => setSay(null)}
            className="absolute -right-2 -top-2 rounded-full border border-border bg-background p-0.5 text-muted-foreground"
            aria-label="Close bubble"
          >
            <X className="size-3" />
          </Button>
        </div>
      )}
      <Button variant="ghost"
        className="lumi-character pointer-events-auto block h-auto w-[220px] rounded-none p-0 hover:bg-transparent motion-reduce:animate-none"
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
        <img
          src={lumiCharacter}
          alt="Lumi, a smiling person pointing upward"
          width={805}
          height={846}
          className="block h-auto w-full select-none"
          draggable={false}
        />
      </Button>
    </div>
  );
}
