import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  FileJson,
  GitBranch,
  Loader2,
  LogOut,
  RotateCcw,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AdminGate } from "./AdminGate";

type HistoryRevisionKind = "save" | "image" | "rollback";
type HistoryRevision = {
  _id: Id<"portfolioRevisions">;
  shortHash: string;
  message: string;
  kind: HistoryRevisionKind;
  createdAt: number;
  createdBy: string;
  parentShortHash?: string;
  restoredFromShortHash?: string;
};
type DetailFile = {
  name: string;
  oldText: string;
  newText: string;
  additions: number;
  deletions: number;
};
type DiffLine = {
  kind: "context" | "added" | "removed";
  oldLine?: number;
  newLine?: number;
  text: string;
};

export function HistoryPage(): ReactElement {
  return (
    <AdminGate loginMessage="Login to view resume history.">
      {({ sessionToken, logout }) => (
        <HistoryList sessionToken={sessionToken} logout={logout} />
      )}
    </AdminGate>
  );
}

export function HistoryDetailPage({
  revisionId,
}: {
  revisionId: string;
}): ReactElement {
  return (
    <AdminGate loginMessage="Login to view resume history.">
      {({ sessionToken, logout }) => (
        <HistoryDetail
          sessionToken={sessionToken}
          logout={logout}
          revisionId={revisionId as Id<"portfolioRevisions">}
        />
      )}
    </AdminGate>
  );
}

function HistoryList({
  sessionToken,
  logout,
}: {
  sessionToken: string;
  logout: () => void;
}): ReactElement {
  const rollbackPortfolio = useMutation(api.admin.rollbackPortfolio);
  const [busyRevisionId, setBusyRevisionId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");
  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.listHistory,
    { sessionToken },
    { initialNumItems: 30 }
  );
  const groups = groupHistory(results as HistoryRevision[]);

  const rollback = async (revision: HistoryRevision) => {
    const confirmed = window.confirm(`Restore ${revision.shortHash}?`);
    if (!confirmed) return;

    setBusyRevisionId(revision._id);
    setStatusText(`Restoring ${revision.shortHash}...`);
    try {
      await rollbackPortfolio({ sessionToken, revisionId: revision._id });
      setStatusText(`Restored ${revision.shortHash}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Rollback failed");
    } finally {
      setBusyRevisionId(null);
    }
  };

  return (
    <main className="inline-admin-root admin-history-root">
      <HistoryTopBar title="Commits" logout={logout}>
        {statusText && <StatusPill text={statusText} />}
      </HistoryTopBar>

      <div className="admin-history-scroll">
        <section className="admin-history-page">
          <div className="admin-history-heading">
            <div>
              <p className="admin-eyebrow">Resume History</p>
              <h2>Commits</h2>
            </div>
            <span className="admin-history-branch">
              <GitBranch size={16} />
              main
            </span>
          </div>

          {status === "LoadingFirstPage" && (
            <HistoryEmpty label="Loading history..." />
          )}

          {status !== "LoadingFirstPage" && results.length === 0 && (
            <div className="admin-history-empty">No resume commits yet.</div>
          )}

          {groups.map((group) => (
            <section className="admin-history-group" key={group.label}>
              <div className="admin-history-date">
                <span className="admin-history-node" />
                <span>Commits on {group.label}</span>
              </div>
              <div className="admin-history-card">
                {group.revisions.map((revision) => (
                  <article className="admin-history-row" key={revision._id}>
                    <div className="admin-history-main">
                      <h3>
                        <button
                          className="admin-history-title-button"
                          type="button"
                          onClick={() => navigateToRevision(revision._id)}
                        >
                          {revision.message}
                        </button>
                      </h3>
                      <RevisionMeta revision={revision} />
                    </div>
                    <div className="admin-history-actions">
                      <button
                        className="admin-history-hash"
                        type="button"
                        onClick={() => navigateToRevision(revision._id)}
                      >
                        {revision.shortHash}
                      </button>
                      <button
                        className="admin-icon-button"
                        type="button"
                        aria-label={`Copy revision ${revision.shortHash}`}
                        onClick={() => copyRevisionId(revision._id)}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className="admin-secondary-button admin-history-rollback"
                        type="button"
                        disabled={busyRevisionId === revision._id}
                        onClick={() => rollback(revision)}
                      >
                        {busyRevisionId === revision._id ? (
                          <Loader2 size={16} />
                        ) : (
                          <RotateCcw size={16} />
                        )}
                        Rollback
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          {status === "CanLoadMore" && (
            <button className="admin-secondary-button admin-history-load" type="button" onClick={() => loadMore(30)}>
              Load more
            </button>
          )}
          {status === "LoadingMore" && <HistoryEmpty label="Loading more..." />}
        </section>
      </div>
    </main>
  );
}

function HistoryDetail({
  sessionToken,
  logout,
  revisionId,
}: {
  sessionToken: string;
  logout: () => void;
  revisionId: Id<"portfolioRevisions">;
}): ReactElement {
  const rollbackPortfolio = useMutation(api.admin.rollbackPortfolio);
  const detail = useQuery(api.admin.getRevisionDetail, { sessionToken, revisionId });
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState("");

  const rollback = async () => {
    if (!detail) return;
    const confirmed = window.confirm(`Restore ${detail.revision.shortHash}?`);
    if (!confirmed) return;

    setBusy(true);
    setStatusText(`Restoring ${detail.revision.shortHash}...`);
    try {
      await rollbackPortfolio({ sessionToken, revisionId });
      setStatusText(`Restored ${detail.revision.shortHash}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Rollback failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="inline-admin-root admin-history-root">
      <HistoryTopBar title="Commit detail" logout={logout}>
        {statusText && <StatusPill text={statusText} />}
      </HistoryTopBar>

      <div className="admin-history-scroll">
        {!detail ? (
          <HistoryEmpty label="Loading revision..." />
        ) : (
          <section className="admin-history-page admin-history-detail-page">
            <a className="admin-history-back" href="/#admin/history">
              <ArrowLeft size={16} />
              History
            </a>

            <div className="admin-commit-header">
              <div>
                <p className="admin-eyebrow">Commit</p>
                <h2>{detail.revision.message}</h2>
                <RevisionMeta revision={detail.revision as HistoryRevision} />
              </div>
              <button
                className="admin-secondary-button admin-history-rollback"
                type="button"
                disabled={busy}
                onClick={rollback}
              >
                {busy ? <Loader2 size={16} /> : <RotateCcw size={16} />}
                Rollback
              </button>
            </div>

            <div className="admin-commit-meta-card">
              <span className="admin-history-branch">
                <GitBranch size={16} />
                main
              </span>
              <span>parent <code>{detail.parent?.shortHash ?? "root"}</code></span>
              <span>commit <code>{detail.revision.shortHash}</code></span>
              <span>
                {detail.changedFileCount} changed file{detail.changedFileCount === 1 ? "" : "s"}
              </span>
              <span className="admin-diff-stat admin-diff-stat--add">+{detail.totalAdditions}</span>
              <span className="admin-diff-stat admin-diff-stat--remove">-{detail.totalDeletions}</span>
            </div>

            <div className="admin-changed-files-card">
              <h3>Changed files</h3>
              {detail.files.length === 0 ? (
                <p>No file changes recorded.</p>
              ) : (
                <ul>
                  {detail.files.map((file: DetailFile) => (
                    <li key={file.name}>
                      <FileJson size={16} />
                      <span>{file.name}</span>
                      <span className="admin-diff-stat admin-diff-stat--add">+{file.additions}</span>
                      <span className="admin-diff-stat admin-diff-stat--remove">-{file.deletions}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {detail.files.map((file: DetailFile) => (
              <FileDiff key={file.name} file={file} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function HistoryTopBar({
  title,
  logout,
  children,
}: {
  title: string;
  logout: () => void;
  children?: ReactNode;
}) {
  return (
    <header className="inline-admin-bar admin-history-topbar">
      <div>
        <p className="admin-eyebrow">Resume History</p>
        <h1>{title}</h1>
      </div>
      <div className="inline-admin-actions">
        {children}
        <a className="admin-secondary-button" href="/#admin">
          Editor
        </a>
        <button className="admin-secondary-button" type="button" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}

function RevisionMeta({ revision }: { revision: HistoryRevision }): ReactElement {
  return (
    <p>
      <span className="admin-history-avatar">M</span>
      {revision.createdBy} committed {formatRelativeTime(revision.createdAt)}
      <span className={`admin-history-kind admin-history-kind--${revision.kind}`}>
        {revision.kind}
      </span>
      {revision.restoredFromShortHash && (
        <span className="admin-history-restore-source">
          from {revision.restoredFromShortHash}
        </span>
      )}
    </p>
  );
}

function FileDiff({ file }: { file: DetailFile }): ReactElement {
  const lines = useMemo(() => buildLineDiff(file.oldText, file.newText), [file]);

  return (
    <section className="admin-file-diff">
      <header>
        <div>
          <FileJson size={16} />
          <h3>{file.name}</h3>
        </div>
        <p>
          <span className="admin-diff-stat admin-diff-stat--add">+{file.additions}</span>
          <span className="admin-diff-stat admin-diff-stat--remove">-{file.deletions}</span>
        </p>
      </header>
      <div className="admin-diff-lines">
        {lines.map((line, index) => (
          <div className={`admin-diff-line admin-diff-line--${line.kind}`} key={`${line.kind}-${index}`}>
            <span>{line.oldLine ?? ""}</span>
            <span>{line.newLine ?? ""}</span>
            <code>{line.kind === "added" ? "+" : line.kind === "removed" ? "-" : " "} {line.text}</code>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const matrix = Array.from({ length: oldLines.length + 1 }, () =>
    Array.from({ length: newLines.length + 1 }, () => 0)
  );

  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      matrix[oldIndex][newIndex] =
        oldLines[oldIndex] === newLines[newIndex]
          ? matrix[oldIndex + 1][newIndex + 1] + 1
          : Math.max(matrix[oldIndex + 1][newIndex], matrix[oldIndex][newIndex + 1]);
    }
  }

  const lines: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  while (oldIndex < oldLines.length && newIndex < newLines.length) {
    if (oldLines[oldIndex] === newLines[newIndex]) {
      lines.push({
        kind: "context",
        oldLine: oldIndex + 1,
        newLine: newIndex + 1,
        text: oldLines[oldIndex],
      });
      oldIndex += 1;
      newIndex += 1;
    } else if (matrix[oldIndex + 1][newIndex] >= matrix[oldIndex][newIndex + 1]) {
      lines.push({
        kind: "removed",
        oldLine: oldIndex + 1,
        text: oldLines[oldIndex],
      });
      oldIndex += 1;
    } else {
      lines.push({
        kind: "added",
        newLine: newIndex + 1,
        text: newLines[newIndex],
      });
      newIndex += 1;
    }
  }

  while (oldIndex < oldLines.length) {
    lines.push({ kind: "removed", oldLine: oldIndex + 1, text: oldLines[oldIndex] });
    oldIndex += 1;
  }
  while (newIndex < newLines.length) {
    lines.push({ kind: "added", newLine: newIndex + 1, text: newLines[newIndex] });
    newIndex += 1;
  }

  return lines;
}

function groupHistory(revisions: HistoryRevision[]) {
  const groups: { label: string; revisions: HistoryRevision[] }[] = [];
  for (const revision of revisions) {
    const label = new Date(revision.createdAt).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const existing = groups.find((group) => group.label === label);
    if (existing) {
      existing.revisions.push(revision);
    } else {
      groups.push({ label, revisions: [revision] });
    }
  }
  return groups;
}

function formatRelativeTime(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(1, Math.round(diffMs / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

function navigateToRevision(revisionId: string) {
  window.location.hash = `#admin/history/${revisionId}`;
}

function copyRevisionId(revisionId: string) {
  void navigator.clipboard?.writeText(revisionId);
}

function HistoryEmpty({ label }: { label: string }): ReactElement {
  return (
    <div className="admin-history-empty">
      <Loader2 size={18} />
      {label}
    </div>
  );
}

function StatusPill({ text }: { text: string }): ReactElement {
  return (
    <span className="admin-status-badge admin-status-badge--saved">
      <CheckCircle2 size={16} />
      {text}
    </span>
  );
}
