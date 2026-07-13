import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Brain, GraduationCap, Sparkles, Target, Users } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Stud AI — Your personal exam tutor" },
      {
        name: "description",
        content:
          "Stud AI helps middle and high schoolers learn concepts, revise smarter, and prep for SAT, IELTS, and TOEFL with a friendly AI tutor.",
      },
      { property: "og:title", content: "About Stud AI" },
      {
        property: "og:description",
        content:
          "Learn how Stud AI helps students master concepts and ace exams with personalized, step-by-step tutoring.",
      },
    ],
  }),
  component: AboutPage,
});

const features = [
  {
    icon: Brain,
    title: "Learn any concept",
    body: "Break down tricky topics in math, science, English, and history with clear, step-by-step explanations tailored to your level.",
  },
  {
    icon: BookOpen,
    title: "Smart revision",
    body: "Turn any topic into flashcards, summaries, and practice questions so you walk into your exam feeling ready.",
  },
  {
    icon: GraduationCap,
    title: "Exam prep, on demand",
    body: "Dedicated coaching for SAT, IELTS, TOEFL and school finals — with strategies for each section and question type.",
  },
  {
    icon: Target,
    title: "Personalized guidance",
    body: "Stud AI adapts to how you learn — nudging you with hints instead of just handing over answers.",
  },
  {
    icon: Sparkles,
    title: "Friendly & encouraging",
    body: "A patient study buddy that celebrates progress, keeps things light, and never makes you feel silly for asking.",
  },
  {
    icon: Users,
    title: "Built for students",
    body: "Made for middle schoolers, high schoolers, and international exam takers who want a tutor available 24/7.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="" width={32} height={32} className="rounded-lg" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Stud <span className="text-gradient-brand">AI</span>
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to chat
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section className="pt-10 text-center sm:pt-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Your personal exam tutor
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Helping students <span className="text-gradient-brand">learn</span> and love it.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Stud AI is a friendly AI tutor built for middle and high schoolers — and for anyone
            prepping for the SAT, IELTS, or TOEFL. It explains concepts in plain language, quizzes
            you at just the right level, and helps you revise so exam day feels less scary.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand to-accent-warm px-6 py-2.5 text-sm font-medium text-brand-foreground shadow-md transition hover:brightness-110"
            >
              Start learning
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-full border border-border/70 bg-card/60 px-6 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur transition hover:bg-card"
            >
              Create an account
            </Link>
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur transition hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand/15 to-accent-warm/15 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 rounded-3xl border border-border/60 bg-card/60 p-8 shadow-sm backdrop-blur sm:p-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Why we built Stud AI
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              Great tutoring shouldn't be a luxury. We wanted every student — whether they're
              tackling algebra homework, writing their first essay, or prepping for the SAT — to
              have a patient, encouraging guide available any time they need one.
            </p>
            <p>
              Stud AI focuses on <em>understanding</em>, not shortcuts. It walks you through
              problems, asks questions back, and helps you build the intuition that makes exams
              feel manageable. Ask anything, revise anything, and grow more confident with every
              chat.
            </p>
          </div>
        </section>

        <section className="mt-16 text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to study smarter?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Jump into a chat — no account needed to get started. Sign in whenever you want to sync
            your revision across devices.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand to-accent-warm px-6 py-2.5 text-sm font-medium text-brand-foreground shadow-md transition hover:brightness-110"
            >
              Open Stud AI
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-full border border-border/70 bg-card/60 px-6 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur transition hover:bg-card"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}