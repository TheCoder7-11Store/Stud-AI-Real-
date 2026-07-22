import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Sparkles, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/study-plans")({
  head: () => ({
    meta: [
      { title: "Study plans — Stud AI" },
      { name: "description", content: "Build personalized revision schedules for your exams." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudyPlansPage,
});

function StudyPlansPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-16">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-accent-warm/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chats
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" width={22} height={22} className="rounded" />
            <span className="font-display text-base font-semibold">
              Stud <span className="text-gradient-brand">AI</span>
            </span>
          </Link>
        </div>

        <div className="glass-panel rounded-3xl border border-border/60 p-8 text-center shadow-xl sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/15 to-accent-warm/20 text-brand">
            <Calendar className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Study plans
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            Tell Stud AI your exam date and topics, and it will map out a day-by-day revision plan you can actually follow.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent-warm" />
            Coming soon — generate a plan from any chat
          </div>
          <div className="mt-8 flex justify-center">
            <Link to="/start">
              <Button className="gap-2 rounded-full bg-gradient-to-r from-brand to-accent-warm px-6 text-brand-foreground shadow-md transition hover:brightness-110">
                <MessageSquarePlus className="h-4 w-4" />
                Start a chat
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
