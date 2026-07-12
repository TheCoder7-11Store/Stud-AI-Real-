import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LogOut, Mail, MessageSquare, Calendar, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { listThreads } from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Stud AI" },
      { name: "description", content: "Manage your Stud AI account, view stats, and sign out." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const threads = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: () => listThreads(),
    enabled: !!user,
    staleTime: 10_000,
  });

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const email = user.email ?? "";
  const initial = (email[0] ?? "?").toUpperCase();
  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
  const provider =
    (user.app_metadata?.provider as string | undefined) ?? "email";
  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
  const threadCount = threads.data?.length ?? 0;

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

        <div className="glass-panel overflow-hidden rounded-3xl border border-border/60 shadow-xl">
          <div className="relative h-32 bg-gradient-to-br from-brand via-brand/80 to-accent-warm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
          </div>

          <div className="relative px-6 pb-8 sm:px-8">
            <div className="-mt-12 flex items-end gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-background bg-gradient-to-br from-brand to-accent-warm text-3xl font-semibold text-brand-foreground shadow-lg">
                {initial}
              </div>
              <div className="mb-2 min-w-0 flex-1">
                <h1 className="truncate font-display text-2xl font-semibold tracking-tight">
                  {email.split("@")[0]}
                </h1>
                <p className="truncate text-sm text-muted-foreground">{email}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <InfoTile icon={<Mail className="h-4 w-4" />} label="Email" value={email} />
              <InfoTile
                icon={<Shield className="h-4 w-4" />}
                label="Sign-in method"
                value={providerLabel}
              />
              <InfoTile
                icon={<Calendar className="h-4 w-4" />}
                label="Member since"
                value={joined}
              />
              <InfoTile
                icon={<MessageSquare className="h-4 w-4" />}
                label="Study chats"
                value={threads.isLoading ? "…" : String(threadCount)}
              />
            </div>

            <div className="mt-8 rounded-2xl border border-border/60 bg-card/60 p-4">
              <h2 className="font-display text-base font-semibold">Sync</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your chats are safely synced across every device you sign in on.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Link to="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  Continue studying
                </Button>
              </Link>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-brand/10 text-brand">
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-medium">{value}</p>
    </div>
  );
}