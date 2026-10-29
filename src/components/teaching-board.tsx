import { MessageResponse } from "@/components/ai-elements/message";
import type { BoardAction } from "@/lib/lumi/lesson";

export function TeachingBoard({ actions, writing }: { actions: BoardAction[]; writing: boolean }) {
  const notes = actions.filter(a => a.kind === "note" || a.kind === "equation");
  const diagram = actions.filter(a => ["rect", "ellipse", "line", "arrow", "label"].includes(a.kind));
  const emphasized = new Set(actions.filter(a => a.kind === "highlight").map(a => a.target));
  return <div className="lumi-board min-h-72 px-4 py-6 sm:px-8" aria-label="Lumi teaching board" aria-busy={writing}>
    <div className="space-y-3">
      {notes.map(a => <div key={`${a.id}-${a.text}`} className={`lumi-board-entry ${emphasized.has(a.id) ? "lumi-board-highlight" : ""}`}>
        {a.kind === "equation" ? <MessageResponse>{`$$${a.text}$$`}</MessageResponse> : <div className="flex gap-3 text-base leading-relaxed"><span className="text-chart-2">•</span><MessageResponse>{a.text}</MessageResponse></div>}
      </div>)}
    </div>
    {diagram.length > 0 && <svg viewBox="0 0 800 380" role="img" aria-label={diagram.map(a => a.text).filter(Boolean).join(", ") || "Lesson diagram"} className="mt-5 w-full text-foreground">
      <defs><marker id="lumi-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
      {diagram.map(a => <g key={`${a.id}-${a.text}`} className="lumi-drawing" stroke="currentColor" strokeWidth="2.5" fill="none">
        {a.kind === "rect" && <rect x={a.x} y={a.y} width={Math.max(1,a.x2-a.x)} height={Math.max(1,a.y2-a.y)} rx="6" />}
        {a.kind === "ellipse" && <ellipse cx={(a.x+a.x2)/2} cy={(a.y+a.y2)/2} rx={Math.abs(a.x2-a.x)/2} ry={Math.abs(a.y2-a.y)/2} />}
        {(a.kind === "arrow" || a.kind === "line") && <line x1={a.x} y1={a.y} x2={a.x2} y2={a.y2} markerEnd={a.kind === "arrow" ? "url(#lumi-arrow)" : undefined} />}
        {a.text && <text x={a.kind === "label" ? a.x : (a.x+a.x2)/2} y={a.kind === "label" ? a.y : (a.y+a.y2)/2} fill="currentColor" stroke="none" fontSize="18" textAnchor={a.kind === "label" ? "start" : "middle"} dominantBaseline="middle">{a.text}</text>}
      </g>)}
    </svg>}
    {!actions.length && <div className="flex min-h-60 items-center justify-center font-display text-2xl text-muted-foreground">Lumi’s teaching board</div>}
  </div>;
}