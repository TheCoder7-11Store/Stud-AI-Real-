import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";
import { createLocalThread } from "@/lib/threads-store";
import { createThread } from "@/lib/threads.functions";

export const Route = createFileRoute("/start")({
  component: StartChat,
});

function StartChat() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (loading) return;

    const id = crypto.randomUUID();
    const title = "New chat";

    const go = async () => {
      if (user) {
        try {
          await createThread({ data: { id, title } });
          qc.invalidateQueries({ queryKey: ["threads", user.id] });
        } catch (e) {
          console.error(e);
        }
      } else {
        createLocalThread(id, title);
      }
      navigate({ to: "/chat/$threadId", params: { threadId: id }, replace: true });
    };

    go();
  }, [loading, user?.id, navigate, qc]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
      Starting a new chat…
    </div>
  );
}
