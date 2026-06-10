import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "../../convex/_generated/api";

export function ProjectShowcasePage({ slug }: { slug: string }): React.ReactElement {
  const project = useQuery(api.showcases.getBySlug, { slug });

  if (project === undefined) {
    return (
      <div className="showcase-not-found">
        <Loader2 className="pdf-dl-btn__spinner" size={32} />
        <p style={{ marginTop: "1rem" }}>Loading project showcase...</p>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="showcase-not-found">
        <h1>Project Not Found</h1>
        <p>The project "{slug}" does not exist or is inactive.</p>
        <button onClick={() => (window.location.hash = "")}>← Back to Portfolio</button>
      </div>
    );
  }

  return (
    <div className="showcase-container">
      <header className="showcase-header">
        <button
          className="showcase-back-btn"
          onClick={() => (window.location.hash = "")}
        >
          ← Back to Portfolio
        </button>
        <div className="showcase-title">
          Live Demo: <strong>{project.name}</strong>
        </div>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="showcase-external-btn"
        >
          Open in New Tab ↗
        </a>
      </header>
      {project.description && (
        <div style={{ padding: "0.5rem 1.5rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "0.875rem", color: "#475569" }}>
          {project.description}
        </div>
      )}
      <iframe
        src={project.url}
        className="showcase-iframe"
        title={project.name}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
