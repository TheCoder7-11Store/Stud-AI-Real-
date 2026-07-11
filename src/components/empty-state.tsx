import { BookOpen, GraduationCap, PenLine, Sigma, Sparkles } from "lucide-react";
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
    <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center sm:py-24">
      {/* Decorative gradient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 right-10 h-56 w-56 rounded-full bg-accent-warm/30 blur-3xl"
      />

      <div className="relative mb-6 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
        <Sparkles className="h-3 w-3 text-accent-warm" />
        <span>Your personal exam tutor</span>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-brand/40 to-accent-warm/40 blur-xl" />
        <img
          src={logo}
          alt=""
          width={72}
          height={72}
          className="rounded-3xl border border-border/40 shadow-lg"
        />
      </div>

      <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
        What are we <em className="not-italic text-gradient-brand">studying</em> today?
      </h1>
      <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
        Homework help, deep concept explanations, and revision plans for middle school, high
        school, SAT, IELTS, TOEFL, and beyond.
      </p>

      <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {prompts.map((p, i) => {
          const Icon = icons[i % icons.length];
          return (
            <button
              key={p}
              onClick={() => onPick(p)}
              className="group relative flex items-start gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4 text-left text-sm shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand/15 to-accent-warm/20 text-brand ring-1 ring-inset ring-border/60">
                <Icon className="h-4 w-4" />
              </span>
              <span className="pt-1 text-foreground/90 group-hover:text-foreground">{p}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}