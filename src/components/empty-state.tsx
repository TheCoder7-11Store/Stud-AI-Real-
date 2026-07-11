import { BookOpen, GraduationCap, PenLine, Sigma } from "lucide-react";
import logo from "@/assets/logo.png";

const icons = [Sigma, BookOpen, GraduationCap, PenLine];

export function EmptyState({
  prompts,
  onPick,
}: {
  prompts: string[];
  onPick: (p: string) => void;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <img src={logo} alt="" width={64} height={64} className="mb-5 rounded-2xl shadow-sm" />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        What are we studying today?
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Homework help, exam prep, and revision plans for middle school, high school, SAT, IELTS,
        TOEFL, and beyond.
      </p>
      <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {prompts.map((p, i) => {
          const Icon = icons[i % icons.length];
          return (
            <button
              key={p}
              onClick={() => onPick(p)}
              className="group flex items-start gap-3 rounded-xl border bg-card p-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-foreground/90 group-hover:text-foreground">{p}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}