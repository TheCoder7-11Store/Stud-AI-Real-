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
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {isEmpty ? (
            <EmptyState onPick={(p) => sendMessage({ text: p })} prompts={quickPrompts} />
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent>
                  {m.parts.map((part, i) => {
                    if (part.type === "text") {
                      return m.role === "assistant" ? (
                        <MessageResponse key={i}>{part.text}</MessageResponse>
                      ) : (
                        <div key={i} className="whitespace-pre-wrap">
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
            <div className="pl-1 pt-2 text-sm">
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