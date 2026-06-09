import {
  type FormEvent,
  type ReactNode,
  useCallback,
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
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  FilePlus2,
  Loader2,
  MessageCircle,
  Plus,
  Save,
  Send,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { usePortfolioContent } from "../../content/PortfolioContentProvider";
import type { PortfolioContent } from "../../content/portfolioTypes";

const CLIENT_THREAD_KEY = "melvz-ai-thread-key";

type ProposalPayload = {
  toolName: string;
  action: string;
  section: string;
  description: string;
  data: Record<string, unknown>;
};

type ProposalState = "pending" | "applied" | "rejected" | "applying" | "failed";

type ProposalCard = ProposalPayload & {
  id: string;
  state: ProposalState;
  error?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  proposals?: ProposalCard[];
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

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
  if (/daily ai message limit|daily admin/i.test(clean)) {
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

function AssistantMessage({
  message,
  onApplyProposal,
  onRejectProposal,
}: {
  message: ChatMessage;
  onApplyProposal?: (proposalId: string) => void;
  onRejectProposal?: (proposalId: string) => void;
}) {
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
        {message.proposals?.map((proposal) => (
          <ProposalConfirmCard
            key={proposal.id}
            proposal={proposal}
            onApply={() => onApplyProposal?.(proposal.id)}
            onReject={() => onRejectProposal?.(proposal.id)}
          />
        ))}
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

/* ── Proposal confirmation card ── */

const ACTION_ICONS: Record<string, ReactNode> = {
  add: <Plus size={14} />,
  edit: <Edit3 size={14} />,
  delete: <Trash2 size={14} />,
};

const ACTION_LABELS: Record<string, string> = {
  add: "Add",
  edit: "Edit",
  delete: "Delete",
};

const SECTION_LABELS: Record<string, string> = {
  profile: "Profile",
  skills: "Skills",
  education: "Education",
  experiences: "Experience",
  projects: "Projects",
  socials: "Social Links",
  "game.zones": "Game Zones",
};

function countProposalItems(proposal: ProposalCard): number {
  const d = proposal.data;
  if (Array.isArray(d.skills)) return d.skills.length;
  if (Array.isArray(d.education)) return d.education.length;
  if (Array.isArray(d.experiences)) return d.experiences.length;
  if (Array.isArray(d.featured) || Array.isArray(d.compact)) {
    return (Array.isArray(d.featured) ? d.featured.length : 0) +
      (Array.isArray(d.compact) ? d.compact.length : 0);
  }
  if (Array.isArray(d.socials)) return d.socials.length;
  if (Array.isArray(d.zones)) return d.zones.length;
  return 0;
}

function ProposalConfirmCard({
  proposal,
  onApply,
  onReject,
}: {
  proposal: ProposalCard;
  onApply: () => void;
  onReject: () => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const isBulkDelete = proposal.action === "delete" && countProposalItems(proposal) > 1;
  const isResolved = proposal.state !== "pending";

  return (
    <div
      className={`ai-proposal-card ai-proposal-card--${proposal.state} ai-proposal-card--${proposal.action}`}
    >
      <div className="ai-proposal-card__header">
        <span className="ai-proposal-card__icon">
          {ACTION_ICONS[proposal.action] ?? <Edit3 size={14} />}
        </span>
        <span className="ai-proposal-card__action">
          {ACTION_LABELS[proposal.action] ?? "Edit"}{" "}
          {SECTION_LABELS[proposal.section] ?? proposal.section}
        </span>
        {proposal.state === "applied" && (
          <span className="ai-proposal-card__badge ai-proposal-card__badge--applied">
            <CheckCircle2 size={12} /> Applied
          </span>
        )}
        {proposal.state === "rejected" && (
          <span className="ai-proposal-card__badge ai-proposal-card__badge--rejected">
            <XCircle size={12} /> Rejected
          </span>
        )}
        {proposal.state === "failed" && (
          <span className="ai-proposal-card__badge ai-proposal-card__badge--failed">
            <AlertTriangle size={12} /> Failed
          </span>
        )}
      </div>
      <p className="ai-proposal-card__desc">{proposal.description}</p>
      {proposal.action === "delete" && (
        <p className="ai-proposal-card__warn">
          <AlertTriangle size={13} />
          {isBulkDelete
            ? `This will replace the entire section with ${countProposalItems(proposal)} items.`
            : "This change removes items from the portfolio."}
        </p>
      )}
      {proposal.error && (
        <p className="ai-proposal-card__error">{proposal.error}</p>
      )}
      {!isResolved && (
        <div className="ai-proposal-card__actions">
          {isBulkDelete && (
            <input
              className="ai-proposal-card__confirm-input"
              type="text"
              placeholder='Type DELETE to confirm'
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
          )}
          <button
            type="button"
            className="ai-proposal-card__reject"
            onClick={onReject}
            disabled={proposal.state === "applying"}
          >
            <X size={14} /> Reject
          </button>
          <button
            type="button"
            className="ai-proposal-card__apply"
            onClick={onApply}
            disabled={
              proposal.state === "applying" ||
              (isBulkDelete && deleteConfirm !== "DELETE")
            }
          >
            {proposal.state === "applying" ? (
              <Loader2 size={14} />
            ) : (
              <Check size={14} />
            )}{" "}
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Portfolio patching ── */

function applyProposalToContent(
  content: PortfolioContent,
  proposal: ProposalPayload,
): PortfolioContent {
  const d = proposal.data;
  switch (proposal.section) {
    case "profile": {
      const fields = (d.fields ?? {}) as Record<string, unknown>;
      return {
        ...content,
        profile: {
          ...content.profile,
          ...(typeof fields.name === "string" ? { name: fields.name } : {}),
          ...(typeof fields.title === "string" ? { title: fields.title } : {}),
          ...(typeof fields.summary === "string" ? { summary: fields.summary } : {}),
          ...(Array.isArray(fields.contacts)
            ? { contacts: fields.contacts as string[] }
            : {}),
        },
      };
    }
    case "skills":
      return {
        ...content,
        skills: Array.isArray(d.skills)
          ? (d.skills as { label: string; items: string[] }[])
          : content.skills,
      };
    case "education":
      return {
        ...content,
        education: Array.isArray(d.education)
          ? (d.education as PortfolioContent["education"])
          : content.education,
      };
    case "experiences":
      return {
        ...content,
        experiences: Array.isArray(d.experiences)
          ? (d.experiences as PortfolioContent["experiences"])
          : content.experiences,
      };
    case "projects":
      return {
        ...content,
        projects: {
          featured: Array.isArray(d.featured)
            ? (d.featured as PortfolioContent["projects"]["featured"])
            : content.projects.featured,
          compact: Array.isArray(d.compact)
            ? (d.compact as PortfolioContent["projects"]["compact"])
            : content.projects.compact,
        },
      };
    case "socials":
      return {
        ...content,
        socials: Array.isArray(d.socials)
          ? (d.socials as PortfolioContent["socials"])
          : content.socials,
      };
    case "game.zones":
      return {
        ...content,
        game: {
          ...content.game,
          zones: Array.isArray(d.zones)
            ? (d.zones as PortfolioContent["game"]["zones"])
            : content.game.zones,
        },
      };
    default:
      return content;
  }
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

/* ── Main component ── */

export function ResumeAiChat({
  adminSessionToken,
  onApplyDraft,
  onSaveDraft,
  hasPendingSave,
}: {
  adminSessionToken?: string;
  /** When provided, Apply pushes the patched content into AdminPage draft instead of saving to DB directly. */
  onApplyDraft?: (patched: PortfolioContent, revisionHint: string) => void;
  /** When provided, Save button appears in chat after AI changes. Calls AdminPage save with auto-generated message. */
  onSaveDraft?: (message: string) => Promise<void>;
  /** Whether AdminPage draft is dirty (has unsaved AI changes). Controls save bar visibility. */
  hasPendingSave?: boolean;
} = {}) {
  const settings = useQuery(api.aiSettings.getPublicSettings);
  const sendMessage = useAction(api.aiAgent.sendMessage);
  const sendAdminMessage = useAction(api.aiAgent.sendAdminMessage);
  const listSessions = useAction(api.aiAgent.listChatSessions);
  const loadSession = useAction(api.aiAgent.loadChatSession);
  const { content } = usePortfolioContent();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<Id<"aiChatThreads"> | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [failedInput, setFailedInput] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<{ _id: Id<"aiChatThreads">; title: string; createdAt: number; updatedAt: number }[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [pendingSaveHint, setPendingSaveHint] = useState("");
  const [saving, setSaving] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const clientThreadKey = useMemo(getClientThreadKey, []);

  const isAdminMode = Boolean(adminSessionToken);

  const unavailable =
    settings === undefined ||
    settings.isEnabled === false ||
    settings.hasApiKey === false;

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  const openHistory = async () => {
    setShowHistory(true);
    setLoadingSessions(true);
    try {
      const result = await listSessions({ clientThreadKey });
      setSessions(result as typeof sessions);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const switchToThread = async (id: Id<"aiChatThreads">) => {
    setShowHistory(false);
    setError(null);
    try {
      const result = await loadSession({ clientThreadKey, threadId: id });
      const loaded: ChatMessage[] = (result as { role: "user" | "assistant"; content: string; model?: string; createdAt: number }[]).map((m) => ({
        id: crypto.randomUUID(),
        role: m.role,
        content: m.content,
        model: m.model,
      }));
      setMessages(loaded);
      setThreadId(id);
    } catch {
      setError({ title: "Load failed", message: "Could not load chat session." });
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setThreadId(undefined);
    setError(null);
    setFailedInput(null);
    setShowHistory(false);
  };

  if (settings?.showPublicChat === false && !isAdminMode) return null;

  const submit = async (event?: FormEvent<HTMLFormElement>, retryText?: string) => {
    event?.preventDefault();
    const chatContent = (retryText ?? input).trim();
    if (!chatContent || busy || unavailable) return;

    setInput("");
    setError(null);
    setFailedInput(null);
    setBusy(true);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: chatContent },
    ]);

    try {
      if (isAdminMode && adminSessionToken) {
        // Admin mode with tool-calling
        const result = await sendAdminMessage({
          sessionToken: adminSessionToken,
          threadId,
          clientThreadKey,
          message: chatContent,
        });
        setThreadId(result.threadId);

        const proposalCards: ProposalCard[] = (result.proposals as ProposalPayload[]).map((p) => ({
          ...p,
          id: crypto.randomUUID(),
          state: "pending" as const,
        }));

        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.content,
            model: result.model,
            proposals: proposalCards.length > 0 ? proposalCards : undefined,
          },
        ]);
      } else {
        // Public read-only mode
        const result = await sendMessage({
          threadId,
          clientThreadKey,
          message: chatContent,
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
      }
    } catch (err) {
      setError(cleanError(err));
      setFailedInput(chatContent);
    } finally {
      setBusy(false);
    }
  };

  const handleApplyProposal = useCallback(
    (proposalId: string) => {
      if (!adminSessionToken || !onApplyDraft) return;

      // Find proposal synchronously from current messages
      let targetProposal: ProposalCard | undefined;
      for (const msg of messages) {
        if (msg.proposals) {
          const found = msg.proposals.find((p) => p.id === proposalId);
          if (found) {
            targetProposal = found;
            break;
          }
        }
      }
      if (!targetProposal) return;

      try {
        const patched = applyProposalToContent(content, targetProposal);
        const revisionHint = `AI: ${targetProposal.action} ${SECTION_LABELS[targetProposal.section] ?? targetProposal.section} — ${targetProposal.description}`.slice(0, 120);

        // Push patched content into AdminPage draft — no direct DB write
        onApplyDraft(patched, revisionHint);
        setPendingSaveHint((prev) => prev ? `${prev}; ${revisionHint}` : revisionHint);

        setMessages((current) =>
          current.map((msg) => {
            if (!msg.proposals) return msg;
            return {
              ...msg,
              proposals: msg.proposals.map((p) =>
                p.id === proposalId ? { ...p, state: "applied" as const } : p,
              ),
            };
          }),
        );
      } catch (err) {
        setMessages((current) =>
          current.map((msg) => {
            if (!msg.proposals) return msg;
            return {
              ...msg,
              proposals: msg.proposals.map((p) =>
                p.id === proposalId
                  ? {
                      ...p,
                      state: "failed" as const,
                      error: err instanceof Error ? err.message : "Apply failed",
                    }
                  : p,
              ),
            };
          }),
        );
      }
    },
    [adminSessionToken, content, onApplyDraft, messages],
  );

  const handleRejectProposal = useCallback((proposalId: string) => {
    setMessages((current) =>
      current.map((msg) => {
        if (!msg.proposals) return msg;
        return {
          ...msg,
          proposals: msg.proposals.map((p) =>
            p.id === proposalId ? { ...p, state: "rejected" as const } : p,
          ),
        };
      }),
    );
  }, []);

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
                <h2>
                  {isAdminMode ? "Admin Portfolio Editor" : "Ask Melvin AI"}
                </h2>
                <p>
                  {isAdminMode
                    ? "Ask me to edit your resume"
                    : (settings?.defaultModel ?? "Resume assistant")}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button type="button" onClick={openHistory} aria-label="Chat history" title="Chat history">
                <Clock size={18} />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close AI chat">
                <X size={18} />
              </button>
            </div>
          </header>

          {showHistory ? (
            <div className="resume-ai-sessions">
              <div className="resume-ai-sessions__header">
                <h3>Chat Sessions</h3>
                <button type="button" onClick={startNewChat} className="resume-ai-sessions__new">
                  <FilePlus2 size={14} /> New Chat
                </button>
              </div>
              {loadingSessions ? (
                <div className="resume-ai-sessions__loading">
                  <Loader2 size={18} /> Loading sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div className="resume-ai-sessions__empty">
                  <Clock size={24} />
                  <p>No past sessions yet.</p>
                </div>
              ) : (
                <div className="resume-ai-sessions__list">
                  {sessions.map((s) => (
                    <button
                      key={s._id}
                      type="button"
                      className={`resume-ai-sessions__item${s._id === threadId ? " resume-ai-sessions__item--active" : ""}`}
                      onClick={() => void switchToThread(s._id)}
                    >
                      <span className="resume-ai-sessions__title">{s.title}</span>
                      <span className="resume-ai-sessions__time">{relativeTime(s.updatedAt)}</span>
                    </button>
                  ))}
                </div>
              )}
              <button type="button" className="resume-ai-sessions__back" onClick={() => setShowHistory(false)}>
                ← Back to chat
              </button>
            </div>
          ) : (
            <>
          <div ref={listRef} className="resume-ai-list">
            {messages.length === 0 ? (
              <div className="resume-ai-empty">
                <MessageCircle size={28} />
                <h3>
                  {isAdminMode
                    ? "Edit your portfolio with AI."
                    : "Ask about the resume."}
                </h3>
                <p>
                  {isAdminMode
                    ? "\"Add a new project\", \"Update my title\", \"Remove the Desktop skills group\""
                    : "Projects, skills, work history, contact links, or game zones."}
                </p>
              </div>
            ) : (
              messages.map((message) =>
                message.role === "user" ? (
                  <UserMessage key={message.id} message={message} />
                ) : (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    onApplyProposal={
                      isAdminMode ? (id) => void handleApplyProposal(id) : undefined
                    }
                    onRejectProposal={isAdminMode ? handleRejectProposal : undefined}
                  />
                ),
              )
            )}

            {busy ? (
              <div className="resume-ai-thinking">
                <Loader2 size={16} />
                {isAdminMode ? "Analyzing portfolio..." : "Reading portfolio context..."}
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

          {isAdminMode && hasPendingSave && onSaveDraft && pendingSaveHint ? (
            <div className="resume-ai-save-bar">
              <div className="resume-ai-save-bar__hint">
                <CheckCircle2 size={14} /> Changes applied — ready to save
              </div>
              <button
                type="button"
                className="resume-ai-save-bar__btn"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onSaveDraft(pendingSaveHint.slice(0, 120));
                    setPendingSaveHint("");
                  } catch {
                    // AdminPage handles error display
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? <Loader2 size={14} /> : <Save size={14} />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
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
                  : isAdminMode
                    ? "Tell me what to edit..."
                    : "Ask about skills, projects, work history..."
              }
            />
            <button type="submit" disabled={!input.trim() || busy || unavailable} aria-label="Send AI message">
              {busy ? <Loader2 size={16} /> : <Send size={16} />}
            </button>
          </form>
          </>
          )}
        </section>
      ) : null}

      <button
        type="button"
        className={`resume-ai-button${isAdminMode ? " resume-ai-button--admin" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={isAdminMode ? "Open AI portfolio editor" : "Open AI chat"}
        title={isAdminMode ? "AI Portfolio Editor" : "Ask Melvin AI"}
      >
        {isAdminMode ? <Bot size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
