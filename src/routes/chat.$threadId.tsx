import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import type { UIMessage } from "ai";
import { AppShell } from "@/components/app-shell";
import { ChatWindow } from "@/components/chat-window";
import { useAuth } from "@/lib/use-auth";
import {
  getLocalThread,
  updateLocalThread,
  useHydrated,
  useLocalThreads,
} from "@/lib/threads-store";
import { getThread, saveMessages } from "@/lib/threads.functions";

export const Route = createFileRoute("/chat/$threadId")({
  component: ChatRoute,
});

function ChatRoute() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  const { user, loading } = useAuth();
  const hydrated = useHydrated();
  const qc = useQueryClient();
  useLocalThreads(); // subscribe for updates

  const cloudQ = useQuery({
    queryKey: ["thread", threadId, user?.id],
    queryFn: () => getThread({ data: { id: threadId } }),
    enabled: !!user,
  });

  const initialMessages: UIMessage[] = useMemo(() => {
    if (user) {
      const rows = cloudQ.data?.messages ?? [];
      return rows.map((r) => ({
        id: r.id,
        role: r.role as UIMessage["role"],
        parts: r.parts as UIMessage["parts"],
      }));
    }
    if (!hydrated) return [];
    return getLocalThread(threadId)?.messages ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, cloudQ.data, hydrated, threadId]);

  const saveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMessagesChange = (messages: UIMessage[]) => {
    if (user) {
      if (saveDebounce.current) clearTimeout(saveDebounce.current);
      saveDebounce.current = setTimeout(() => {
        saveMessages({
          data: {
            threadId,
            messages: messages.map((m) => ({
              id: m.id,
              role: m.role,
              parts: m.parts as unknown,
            })),
          },
        })
          .then(() => qc.invalidateQueries({ queryKey: ["threads", user.id] }))
          .catch(console.error);
      }, 600);
    } else {
      updateLocalThread(threadId, { messages });
    }
  };

  if (user && cloudQ.isLoading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Loading conversation…
        </div>
      </AppShell>
    );
  }

  if (loading || (!user && !hydrated)) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ChatWindow
        key={threadId}
        threadId={threadId}
        initialMessages={initialMessages}
        onMessagesChange={handleMessagesChange}
      />
    </AppShell>
  );
}