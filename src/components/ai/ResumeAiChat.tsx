import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAction, useQuery } from "convex/react";
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  Loader2,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const CLIENT_THREAD_KEY = "melvz-ai-thread-key";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
};

type ChatError = {
  title: string;
  message: string;
  detail?: string;
};

function getClientThreadKey() {
  const existing = window.localStorage.getItem(CLIENT_THREAD_KEY);
  if (existing && existing.length >= 12) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(CLIENT_THREAD_KEY, next);
  return next;
}

function cleanError(error: unknown): ChatError {
  const raw = error instanceof Error ? error.message : "AI request failed.";
  const clean = raw
    .replace(/^Uncaught Error:\s*/i, "")
    .replace(/^Error:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/missing provider key|disabled|not configured/i.test(clean)) {
    return {
      title: "AI unavailable",
      message: clean,
    };
  }
  if (/daily ai message limit/i.test(clean)) {
    return {
      title: "Daily limit reached",
      message: clean,
    };
  }
  if (/provider request failed/i.test(clean)) {
    return {
      title: "Provider error",
      message: "AI provider request failed. Try again later.",
      detail: clean,
    };
  }
  return {
    title: "Request failed",
    message: clean || "AI request failed.",
  };
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${match.index}`;

    if (token.startsWith("`")) {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (link) {
        parts.push(
          <a key={key} href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>,
        );
      } else {
        parts.push(token);
      }
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function MarkdownMessage({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  const lines = content.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `ul-${index}-${itemIndex}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^[-*]\s+/.test(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`p-${index}`}>
        {renderInline(paragraph.join(" "), `p-${index}`)}
      </p>,
    );
  }

  return <div className="resume-ai-markdown">{blocks}</div>;
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="resume-ai-message resume-ai-message--user">
      <p>{message.content}</p>
    </div>
  );
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="resume-ai-message resume-ai-message--assistant">
      <div className="resume-ai-avatar">
        <Bot size={16} />
      </div>
      <div className="resume-ai-bubble">
        <MarkdownMessage content={message.content} />
        <div className="resume-ai-message-meta">
          <span>{message.model ?? "Melvin AI"}</span>
          <button type="button" onClick={copy} title="Copy answer">
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorPanel({
  error,
  retry,
}: {
  error: ChatError;
  retry: (() => void) | null;
}) {
  return (
    <div className="resume-ai-error">
      <AlertTriangle size={16} />
      <div>
        <strong>{error.title}</strong>
        <p>{error.message}</p>
        {error.detail ? <small>{error.detail}</small> : null}
      </div>
      {retry ? (
        <button type="button" onClick={retry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function ResumeAiChat() {
  const settings = useQuery(api.aiSettings.getPublicSettings);
  const sendMessage = useAction(api.aiAgent.sendMessage);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<Id<"aiChatThreads"> | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [failedInput, setFailedInput] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const clientThreadKey = useMemo(getClientThreadKey, []);

  const unavailable =
    settings === undefined ||
    settings.isEnabled === false ||
    settings.hasApiKey === false;

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  if (settings?.showPublicChat === false) return null;

  const submit = async (event?: FormEvent<HTMLFormElement>, retryText?: string) => {
    event?.preventDefault();
    const content = (retryText ?? input).trim();
    if (!content || busy || unavailable) return;

    setInput("");
    setError(null);
    setFailedInput(null);
    setBusy(true);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content },
    ]);

    try {
      const result = await sendMessage({
        threadId,
        clientThreadKey,
        message: content,
      });
      setThreadId(result.threadId);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.content,
          model: result.model,
        },
      ]);
    } catch (err) {
      setError(cleanError(err));
      setFailedInput(content);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="resume-ai">
      {open ? (
        <section className="resume-ai-panel" aria-label="Melvin AI chat">
          <header className="resume-ai-header">
            <div>
              <span className="resume-ai-icon">
                <Bot size={17} />
              </span>
              <div>
                <h2>Ask Melvin AI</h2>
                <p>{settings?.defaultModel ?? "Resume assistant"}</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close AI chat">
              <X size={18} />
            </button>
          </header>

          <div ref={listRef} className="resume-ai-list">
            {messages.length === 0 ? (
              <div className="resume-ai-empty">
                <MessageCircle size={28} />
                <h3>Ask about the resume.</h3>
                <p>Projects, skills, work history, contact links, or game zones.</p>
              </div>
            ) : (
              messages.map((message) =>
                message.role === "user" ? (
                  <UserMessage key={message.id} message={message} />
                ) : (
                  <AssistantMessage key={message.id} message={message} />
                ),
              )
            )}

            {busy ? (
              <div className="resume-ai-thinking">
                <Loader2 size={16} />
                Reading portfolio context...
              </div>
            ) : null}
          </div>

          {error ? (
            <ErrorPanel
              error={error}
              retry={
                failedInput
                  ? () => {
                      void submit(undefined, failedInput);
                    }
                  : null
              }
            />
          ) : null}

          <form className="resume-ai-form" onSubmit={(event) => void submit(event)}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              disabled={busy || unavailable}
              placeholder={
                unavailable
                  ? "AI not configured yet."
                  : "Ask about skills, projects, work history..."
              }
            />
            <button type="submit" disabled={!input.trim() || busy || unavailable} aria-label="Send AI message">
              {busy ? <Loader2 size={16} /> : <Send size={16} />}
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="resume-ai-button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open AI chat"
        title="Ask Melvin AI"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
