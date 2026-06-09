import domtoimage from "dom-to-image-more";
import { jsPDF } from "jspdf";

/* ──────────────────────────────────────────
   PDF Export Service
   Renders the resume DOM to a high-res PNG
   via the browser's own renderer, then
   assembles a multi-page A4 PDF.
────────────────────────────────────────── */

// Long Bond paper dimensions in mm (8.5" × 13")
const PAGE_W_MM = 215.9;
const PAGE_H_MM = 330.2;

// CSS px per mm at 96 DPI
const PX_PER_MM = 96 / 25.4;

// Page size in CSS px
const PAGE_W_PX = PAGE_W_MM * PX_PER_MM; // ~816
const PAGE_H_PX = PAGE_H_MM * PX_PER_MM; // ~1249

export type PdfQuality = "2x" | "3x" | "4x";

const SCALE_MAP: Record<PdfQuality, number> = {
  "2x": 2.083,
  "3x": 3.125,
  "4x": 4.167,
};

interface ExportOptions {
  /** The DOM element to capture (the resume paper) */
  element: HTMLElement;
  /** Quality preset. Default: "3x" (300 DPI) */
  quality?: PdfQuality;
  /** Output filename. Default: "Melvin_Nogoy_Resume.pdf" */
  filename?: string;
}

/**
 * Pre-fetch any cross-origin images inside the element
 * and replace their src with blob URLs so the canvas
 * doesn't get tainted.
 */
async function fixCorsImages(el: HTMLElement): Promise<() => void> {
  const images = el.querySelectorAll<HTMLImageElement>("img[src]");
  const originals: { img: HTMLImageElement; src: string }[] = [];

  await Promise.all(
    Array.from(images).map(async (img) => {
      // Skip data URIs and same-origin images
      if (img.src.startsWith("data:") || img.src.startsWith("blob:")) return;
      try {
        const url = new URL(img.src);
        if (url.origin === window.location.origin) return;
      } catch {
        return;
      }

      try {
        const resp = await fetch(img.src, { mode: "cors" });
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        originals.push({ img, src: img.src });
        img.src = blobUrl;
        // Wait for the new src to load
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      } catch {
        // If fetch fails, leave the original src — best effort
      }
    }),
  );

  // Return a cleanup function to restore originals and revoke blobs
  return () => {
    for (const { img, src } of originals) {
      const blobUrl = img.src;
      img.src = src;
      URL.revokeObjectURL(blobUrl);
    }
  };
}

/**
 * Main export function.
 */
export async function exportResumePdf(options: ExportOptions): Promise<void> {
  const { element, quality = "3x", filename = "Melvin_Nogoy_Resume.pdf" } = options;
  const scale = SCALE_MAP[quality];

  // 1. Wait for fonts
  await document.fonts.ready;

  // 2. Fix CORS images
  const restoreImages = await fixCorsImages(element);

  // 3. Apply export class (hides buttons, cursors, etc.)
  element.classList.add("pdf-exporting");

  try {
    // 4. Capture DOM as PNG data URL
    const dataUrl = await domtoimage.toPng(element, {
      width: element.scrollWidth * scale,
      height: element.scrollHeight * scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      },
    });

    // 5. Load PNG into an Image to get a canvas
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = dataUrl;
    });

    const fullCanvas = document.createElement("canvas");
    fullCanvas.width = img.width;
    fullCanvas.height = img.height;
    const ctx = fullCanvas.getContext("2d");
    if (!ctx) throw new Error("Failed to create canvas context");
    ctx.drawImage(img, 0, 0);

    const pageDataUrl = fullCanvas.toDataURL("image/png");

    // 6. Build 1-page PDF
    // Calculate custom page height based on the canvas aspect ratio so there are no empty margins
    // and no letterboxing. The width is locked to PAGE_W_MM (Long Bond).
    const aspectRatio = fullCanvas.height / fullCanvas.width;
    const pdfPageWidth = PAGE_W_MM;
    const customPdfPageHeight = pdfPageWidth * aspectRatio;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      // Custom format size based on the actual height of the resume
      format: [pdfPageWidth, customPdfPageHeight],
    });

    pdf.addImage(pageDataUrl, "PNG", 0, 0, pdfPageWidth, customPdfPageHeight);

    // 7. Download
    pdf.save(filename);
  } finally {
    // Cleanup
    element.classList.remove("pdf-exporting");
    restoreImages();
  }
}
