import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Stud AI" },
      { name: "description", content: "Sign in or create a Stud AI account to sync your study chats across devices." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const credentialsSchema = z.object({
    email: z
      .string()
      .trim()
      .email({ message: "Enter a valid email address" })
      .max(255, { message: "Email is too long" }),
    password:
      mode === "signup"
        ? z
            .string()
            .min(8, { message: "Password must be at least 8 characters" })
            .max(72, { message: "Password must be less than 72 characters" })
            .regex(/[A-Z]/, { message: "Include an uppercase letter" })
            .regex(/[a-z]/, { message: "Include a lowercase letter" })
            .regex(/[0-9]/, { message: "Include a number" })
        : z.string().min(1, { message: "Enter your password" }).max(72),
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid credentials");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) toast.error(res.error.message ?? "Google sign-in failed");
    if (!res.redirected && !res.error) navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background via-background to-muted/40 px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <img src={logo} alt="" width={40} height={40} className="rounded-lg" />
          <span className="text-xl font-semibold tracking-tight">Stud AI</span>
        </Link>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save your chats and sync progress across devices.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-5 w-full"
            onClick={google}
          >
            Continue with Google
          </Button>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "signup" ? 8 : 1}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground">
                  At least 8 characters, with upper, lower, and a number. We block
                  passwords found in known data breaches.
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          >
            {mode === "signin"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            Continue without an account →
          </Link>
        </p>
      </div>
    </div>
  );
}