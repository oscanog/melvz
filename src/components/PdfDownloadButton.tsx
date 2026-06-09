import { useState, useCallback } from "react";
import { exportResumePdf } from "../services/pdfExport";

/* ──────────────────────────────────────────
   PdfDownloadButton
   Sits top-right inside the .lp-paper container.
   Hidden during PDF capture via .pdf-exporting.
────────────────────────────────────────── */

type ButtonState = "idle" | "generating" | "done" | "error";

interface PdfDownloadButtonProps {
  paperId: string; // ID of the resume container element
}

export function PdfDownloadButton({ paperId }: PdfDownloadButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");

  const handleClick = useCallback(async () => {
    if (state === "generating") return;

    const element = document.getElementById(paperId);
    if (!element) {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
      return;
    }

    setState("generating");

    try {
      await exportResumePdf({ element, quality: "3x" });
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch (err) {
      console.error("PDF export failed:", err);
      setState("error");
      // Fallback: window.print()
      window.print();
      setTimeout(() => setState("idle"), 2000);
    }
  }, [paperId, state]);

  return (
    <button
      className={`pdf-dl-btn pdf-dl-btn--${state}`}
      onClick={handleClick}
      disabled={state === "generating"}
      title={
        state === "generating"
          ? "Generating HD PDF…"
          : state === "done"
            ? "Downloaded!"
            : state === "error"
              ? "Export failed"
              : "Download HD Resume (PDF)"
      }
      aria-label="Download HD Resume as PDF"
    >
      {state === "idle" && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
      {state === "generating" && (
        <svg className="pdf-dl-btn__spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeDashoffset="10" />
        </svg>
      )}
      {state === "done" && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {state === "error" && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )}
    </button>
  );
}
