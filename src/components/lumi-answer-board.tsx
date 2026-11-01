import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MessageResponse } from "@/components/ai-elements/message";
import { boardNotes } from "@/lib/lumi/board-notes";
import lumi from "@/assets/lumi-reference.png";

export function LumiAnswerBoard({ text, live = false }: { text: string; live?: boolean }) {
  const notes = boardNotes(text);
  const total = notes.reduce((n, note) => n + note.length, 0);
  const [written, setWritten] = useState(live ? 0 : total);
  const [tip, setTip] = useState({ x: 30, y: 50, width: 600, height: 320 });
  const boardRef = useRef<HTMLDivElement>(null);
  const penRef = useRef<HTMLSpanElement>(null);
  const latestTotal = useRef(total);
  latestTotal.current = total;
  useEffect(() => {
    if (!live) { setWritten(total); return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setInterval(() => setWritten(n => Math.min(latestTotal.current, n + (reduced ? latestTotal.current : 3))), 24);
    return () => window.clearInterval(timer);
  }, [live, total]);
  const writing = written < total;
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const measure = () => {
      const b = board.getBoundingClientRect();
      const active = penRef.current?.parentElement;
      let p = penRef.current?.getBoundingClientRect();
      if (active) {
        const walker = document.createTreeWalker(active, NodeFilter.SHOW_TEXT);
        let last: Node | null = null;
        while (walker.nextNode()) if (walker.currentNode.textContent?.trim()) last = walker.currentNode;
        if (last?.textContent) {
          const range = document.createRange();
          range.setStart(last, last.textContent.length - 1); range.setEnd(last, last.textContent.length);
          p = range.getBoundingClientRect();
        }
      }
      setTip({ x: p ? p.right - b.left + 4 : 30, y: p ? p.bottom - b.top - 3 : 50, width: b.width, height: b.height });
    };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(board);
    return () => observer.disconnect();
  }, [written, total]);
  let remaining = written;
  const shoulderX = tip.width - (tip.width < 500 ? 47 : 87);
  const writerTop = Math.max(65, Math.min(tip.height - (tip.width < 500 ? 110 : 185), tip.y - (tip.width < 500 ? 55 : 100)));
  const shoulderY = writerTop + (tip.width < 500 ? 55 : 100);
  return <div ref={boardRef} className="lumi-answer-board" aria-label="Lumi’s summarized notes board" aria-busy={writing}>
    <div className="lumi-board-label">Lumi’s notes</div>
    <div className="lumi-written-notes">
      {notes.map((note, index) => {
        const count = Math.max(0, Math.min(note.length, remaining));
        remaining -= note.length;
        if (!count) return null;
        const active = writing && count < note.length;
        return <div key={index} className="lumi-written-point">
          <span className="lumi-point-mark">•</span>
          <div className="min-w-0"><MessageResponse>{note.slice(0, count)}</MessageResponse>{active && <span ref={penRef} className="lumi-pen-anchor" />}</div>
        </div>;
      })}
      {!total && <div className="font-display text-xl text-muted-foreground">{live ? "Lumi is thinking…" : ""}</div>}
    </div>
    <img src={lumi} alt="Lumi writing your notes" className={`lumi-board-writer ${writing ? "is-writing" : ""}`} style={writing ? { top: writerTop, bottom: "auto" } : undefined} />
    {writing && <svg className="lumi-writing-arm" viewBox={`0 0 ${tip.width} ${tip.height}`} aria-label="Lumi’s hand writing with a pen">
      <path className="lumi-arm-outline" d={`M ${shoulderX} ${shoulderY} Q ${shoulderX - 30} ${tip.y + 55} ${tip.x + 14} ${tip.y + 8}`} />
      <path className="lumi-arm-sleeve" d={`M ${shoulderX} ${shoulderY} Q ${shoulderX - 30} ${tip.y + 55} ${tip.x + 14} ${tip.y + 8}`} />
      <g className="lumi-pen-hand" transform={`translate(${tip.x + 5} ${tip.y})`}>
        <path className="lumi-hand" d="M 3 3 Q 10 -7 16 -2 L 22 6 Q 23 13 17 14 L 7 12 Z" />
        <path className="lumi-pen" d="M 0 8 L 13 -15" />
        <path className="lumi-pen-tip" d="M 0 8 L -3 13" />
      </g>
    </svg>}
  </div>;
}