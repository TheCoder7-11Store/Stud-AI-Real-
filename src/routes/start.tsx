import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";
import { createLocalThread } from "@/lib/threads-store";
import { createThread, listThreads } from "@/lib/threads.functions";

export const Route = createFileRoute("/start")({
  component: StartChat,
});

function StartChat() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (loading) return;

    const go = async () => {
      if (user) {
        try {
          const existing = await qc.fetchQuery({
            queryKey: ["threads", user.id],
            queryFn: () => listThreads(),
          });
          if (existing && existing.length > 0) {
            navigate({ to: "/chat/$threadId", params: { threadId: existing[0].id }, replace: true });
            return;
          }
          const id = crypto.randomUUID();
          await createThread({ data: { id, title: "New chat" } });
          qc.invalidateQueries({ queryKey: ["threads", user.id] });
          navigate({ to: "/chat/$threadId", params: { threadId: id }, replace: true });
        } catch (e) {
          console.error(e);
        }
      } else {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem("studai.threads.v1") : null;
        try {
          const list = raw ? JSON.parse(raw) : [];
          if (Array.isArray(list) && list.length > 0) {
            navigate({ to: "/chat/$threadId", params: { threadId: list[0].id }, replace: true });
            return;
          }
        } catch {
          /* ignore */
        }
        const id = crypto.randomUUID();
        createLocalThread(id, "New chat");
        navigate({ to: "/chat/$threadId", params: { threadId: id }, replace: true });
      }
    };

    go();
  }, [loading, user?.id, navigate, qc]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
      Starting a new chat…
    </div>
  );
}
