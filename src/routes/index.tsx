import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ChatWindow } from "@/components/chat-window";
import { useAuth } from "@/lib/use-auth";
import { createLocalThread, updateLocalThread } from "@/lib/threads-store";
import { createThread, saveMessages } from "@/lib/threads.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleFirstMessage = async (text: string) => {
    const id = crypto.randomUUID();
    const title = text.slice(0, 60);
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

  return (
    <AppShell>
      <ChatWindow
        threadId="draft"
        initialMessages={[]}
        onMessagesChange={() => {}}
        onFirstUserMessage={handleFirstMessage}
      />
    </AppShell>
  );
}
