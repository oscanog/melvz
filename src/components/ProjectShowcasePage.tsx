import React from "react";

interface ProjectRegistryEntry {
  slug: string;
  name: string;
  url: string;
}

const PROJECT_REGISTRY: Record<string, ProjectRegistryEntry> = {
  luxurious: {
    slug: "luxurious",
    name: "Luxurious Workspace Portal",
    url: "https://luxurious-demo.vercel.app", // Adjust if there's a specific deployed URL
  },
};

export function ProjectShowcasePage({ slug }: { slug: string }): React.ReactElement {
  const project = PROJECT_REGISTRY[slug];

  if (!project) {
    return (
      <div className="showcase-not-found">
        <h1>Project Not Found</h1>
        <p>The project "{slug}" does not exist in the registry.</p>
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
      <iframe
        src={project.url}
        className="showcase-iframe"
        title={project.name}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
