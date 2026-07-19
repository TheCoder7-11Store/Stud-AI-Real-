import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link2, Paperclip, X } from "lucide-react";
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
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputActionMenuItem,
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

  const [pendingLinks, setPendingLinks] = useState<string[]>([]);

  const persistRef = useRef(onMessagesChange);
  persistRef.current = onMessagesChange;
  const lastPersistedRef = useRef<string>("");
  useEffect(() => {
    // Only persist when a turn finishes (status "ready") to avoid
    // thrashing localStorage / DB writes on every streamed token,
    // which triggers global re-renders and makes streaming feel laggy.
    if (status !== "ready") return;
    if (messages.length === 0) return;
    const sig = messages.length + ":" + (messages[messages.length - 1]?.id ?? "");
    if (sig === lastPersistedRef.current) return;
    lastPersistedRef.current = sig;
    persistRef.current(messages);
  }, [messages, status]);

  const isLoading = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;

  const handleSubmit = (msg: PromptInputMessage) => {
    const text = (msg.text ?? "").trim();
    const files = msg.files ?? [];
    if (!text && files.length === 0 && pendingLinks.length === 0) return;

    const linkBlock =
      pendingLinks.length > 0
        ? (text ? "\n\n" : "") +
          "Please help me create notes / study material from these link(s):\n" +
          pendingLinks.map((u) => `- ${u}`).join("\n")
        : "";
    const finalText = (text + linkBlock).trim() || "Please generate study notes from the attached material.";

    if (isEmpty && onFirstUserMessage) onFirstUserMessage(finalText.slice(0, 80));

    const parts: UIMessage["parts"] = [
      { type: "text", text: finalText },
      ...files.map((f) => ({
        type: "file" as const,
        url: f.url,
        mediaType: f.mediaType,
        filename: f.filename,
      })),
    ];

    sendMessage({ role: "user", parts });
    setPendingLinks([]);
  };

  const handleAddLink = () => {
    const url = window.prompt("Paste a link (article, video, notes, etc.) — Stud AI will use it as context:");
    if (!url) return;
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      setPendingLinks((prev) => [...prev, u.toString()]);
    } catch {
      toast.error("That doesn't look like a valid link.");
    }
  };

  const quickPrompts = [
    "Explain photosynthesis like I'm in 7th grade ✨",
    "Give me 5 SAT reading practice questions 🎯",
    "Make a 2-week IELTS writing revision plan 📝",
    "Quiz me on quadratic equations 💡",
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
                    if (part.type === "file") {
                      const isImage = part.mediaType?.startsWith("image/");
                      return isImage ? (
                        <img
                          key={i}
                          src={part.url}
                          alt={part.filename ?? "attachment"}
                          className="mt-2 max-h-64 rounded-lg border border-border/50"
                        />
                      ) : (
                        <a
                          key={i}
                          href={part.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-xs text-foreground hover:bg-muted/60"
                        >
                          <Paperclip className="size-3" />
                          {part.filename ?? "attachment"}
                        </a>
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
            accept="image/*,application/pdf,.ppt,.pptx,.doc,.docx,.txt,.md"
            multiple
          >
            <PromptInputTextarea
              placeholder="Ask me anything — a concept, a practice question, or a study plan! I'm here to help. 💬"
              autoFocus
            />
            {pendingLinks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-1 pt-2">
                {pendingLinks.map((l, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 text-xs text-foreground"
                  >
                    <Link2 className="size-3" />
                    <span className="max-w-[220px] truncate">{l}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingLinks((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="rounded-full p-0.5 hover:bg-background/70"
                      aria-label="Remove link"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger
                    tooltip="Attach photos, PDFs, slides, or links to generate notes"
                  >
                    <Paperclip className="size-4" />
                  </PromptInputActionMenuTrigger>
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments label="Upload photo, PDF or slides" />
                    <PromptInputActionMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleAddLink();
                      }}
                    >
                      <Link2 className="mr-2 size-4" /> Add a link
                    </PromptInputActionMenuItem>
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>
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