import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { EmptyState } from "@/components/empty-state";

export type ChatWindowProps = {
  threadId: string;
  initialMessages: UIMessage[];
  onMessagesChange: (messages: UIMessage[]) => void;
  onFirstUserMessage?: (text: string) => void;
};

export function ChatWindow({
  threadId,
  initialMessages,
  onMessagesChange,
  onFirstUserMessage,
}: ChatWindowProps) {
  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err) => {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    },
  });

  const persistRef = useRef(onMessagesChange);
  persistRef.current = onMessagesChange;
  useEffect(() => {
    if (status === "ready" || status === "streaming" || status === "submitted") {
      persistRef.current(messages);
    }
  }, [messages, status]);

  const isLoading = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;

  const handleSubmit = (msg: PromptInputMessage) => {
    const text = (msg.text ?? "").trim();
    if (!text) return;
    if (isEmpty && onFirstUserMessage) onFirstUserMessage(text);
    sendMessage({ text });
  };

  const quickPrompts = [
    "Explain photosynthesis for a 7th grader",
    "Give me 5 SAT reading practice questions",
    "Make a 2-week IELTS writing revision plan",
    "Quiz me on quadratic equations",
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl space-y-6 px-3 py-6 sm:px-4">
          {isEmpty ? (
            <EmptyState onPick={(p) => sendMessage({ text: p })} prompts={quickPrompts} />
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role} className="gap-1.5">
                {m.role === "assistant" && (
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent-warm text-[10px] font-bold text-brand-foreground shadow-sm">
                      S
                    </span>
                    Stud AI
                  </div>
                )}
                <MessageContent
                  className={
                    m.role === "user"
                      ? "group-[.is-user]:rounded-2xl group-[.is-user]:rounded-tr-md group-[.is-user]:bg-gradient-to-br group-[.is-user]:from-brand group-[.is-user]:to-[color-mix(in_oklab,var(--brand)_78%,var(--accent-warm))] group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-brand-foreground group-[.is-user]:shadow-md group-[.is-user]:shadow-brand/20 group-[.is-user]:ring-1 group-[.is-user]:ring-brand/20"
                      : "leading-relaxed"
                  }
                >
                  {m.parts.map((part, i) => {
                    if (part.type === "text") {
                      return m.role === "assistant" ? (
                        <MessageResponse key={i} className="chat-prose">
                          {part.text}
                        </MessageResponse>
                      ) : (
                        <div key={i} className="whitespace-pre-wrap leading-relaxed">
                          {part.text}
                        </div>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <div className="flex items-center gap-2 pl-1 pt-2 text-sm">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent-warm text-[10px] font-bold text-brand-foreground shadow-sm">
                S
              </span>
              <Shimmer>Thinking…</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-3xl p-3 sm:p-4">
          <PromptInput
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border/70 bg-card/80 shadow-lg shadow-brand/5 backdrop-blur"
          >
            <PromptInputTextarea
              placeholder="Ask Stud AI anything — a concept, a practice question, a study plan…"
              autoFocus
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                status={status}
                onClick={isLoading ? () => stop() : undefined}
                className="bg-gradient-to-br from-brand to-accent-warm text-brand-foreground shadow-md hover:opacity-90"
              />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Stud AI can make mistakes. Double-check anything important.
          </p>
        </div>
      </div>
    </div>
  );
}