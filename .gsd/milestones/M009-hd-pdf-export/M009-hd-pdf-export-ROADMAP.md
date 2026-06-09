# M009: High-Definition WYSIWYG PDF Export

## Objective
One-click download of the live resume as a pixel-perfect, high-definition PDF — matching the exact on-screen rendering. No `window.print()`. No broken layouts. Canva-grade output at configurable DPI.

---

## Button Placement
The download button sits in the **top-right corner** of the `.lp-paper` bond paper element, positioned just inside the paper border. It uses `position: absolute` relative to the paper container.

```
┌─────────────────────────────────┐
│                           [📥]  │  ← subtle icon button, top-right inside paper
│  MELVIN NOGOY                   │
│  Full Stack Developer           │
│  ...                            │
└─────────────────────────────────┘
```

### Button States
| State        | Visual                                           |
|--------------|--------------------------------------------------|
| **Idle**     | Small download icon, 50% opacity, scales on hover |
| **Hover**    | Full opacity, tooltip: "Download HD Resume (PDF)" |
| **Generating** | Spinner replaces icon, paper dims slightly      |
| **Done**     | Brief checkmark flash → reverts to idle           |
| **Error**    | Red flash + toast: "Export failed, try again"     |

The button is **hidden** during PDF capture (via a `.pdf-exporting` class).

---

## Rendering Strategy

### Why NOT `html2canvas`
`html2canvas` is a CSS reimplementation in JavaScript. It does NOT screenshot the DOM — it repaints it by parsing CSS manually. Known failures:
- `backdrop-filter`, `clamp()`, `min()`, `max()`
- Complex `box-shadow`, pseudo-elements (`::before`, `::after`)
- Web fonts not inlined as base64
- Inconsistent cross-browser output

### Chosen Approach: `dom-to-image-more` + `jspdf`
`dom-to-image-more` uses the browser's own rendering engine via **SVG `<foreignObject>`**. It embeds the actual DOM into an SVG, rasterizes it via the browser's native renderer, and produces a pixel-perfect PNG. This is fundamentally more accurate than html2canvas because the browser itself does the painting.

**Fallback:** If canvas rendering fails (e.g., tainted canvas from CORS), fall back to `window.print()` with a dedicated `@media print` stylesheet. Ugly but functional.

---

## DPI Math

Target: A4 paper (210mm × 297mm).

| Quality | Scale Factor | Resolution (px)   | DPI | Use Case              |
|---------|--------------|-------------------|-----|-----------------------|
| 1x      | 1            | 794 × 1123        | 96  | Screen preview only   |
| 2x      | 2.083        | 1654 × 2339       | 200 | Standard print quality|
| 3x      | 3.125        | 2480 × 3508       | 300 | Professional print    |
| 4x      | 4.167        | 3308 × 4677       | 400 | Ultra HD / portfolio  |

Default export: **3x (300 DPI)** — professional print standard.
Optional: expose a small dropdown (2x / 3x / 4x) for power users, but default to 3x without asking.

---

## Smart Page Breaks
Do NOT naively slice the image mid-text. Instead:

1. Before capture, measure each `.rp-section` element's `offsetTop` and `offsetHeight`.
2. Calculate A4 page boundaries at the chosen scale.
3. Find the nearest `.rp-section` boundary that fits within each page.
4. Slice the canvas at those clean section seams.
5. Each page gets consistent top/bottom margins.

If a single section is taller than a full page, fall back to slicing at the nearest `.rp-job` boundary within that section.

---

## Implementation Slices

### Slice 1: Dependencies & Button UI
- Install `dom-to-image-more` and `jspdf`.
- Add the download icon button to `LandingPage.tsx`, positioned top-right inside `.lp-paper`.
- Implement all button states (idle, hover, generating, done, error).
- Add `.pdf-exporting` CSS class that hides the button + AI chat + mystery hotspot cursors.
- **Bundle cost:** `dom-to-image-more` ~8KB gzip, `jspdf` ~25KB gzip. Total ~33KB. Acceptable.

### Slice 2: Capture Service (`pdfExport.ts`)
- Create `src/services/pdfExport.ts`.
- Await `document.fonts.ready` before capture.
- Handle Convex storage CORS: pre-fetch profile image as blob, replace `<img>` src with blob URL before capture.
- Apply `.pdf-exporting` class to container.
- Call `dom-to-image-more`'s `toPng()` with the computed scale factor.
- Remove `.pdf-exporting` class after capture.

### Slice 3: PDF Assembly with Smart Page Breaks
- Measure section boundaries pre-capture.
- After getting the full-height PNG, slice it at section seams using an offscreen `<canvas>`.
- Create `jspdf` document (A4), insert each slice as a page.
- Trigger download: `Melvin_Nogoy_Resume.pdf`.

### Slice 4: Fallback & Error Handling
- Wrap the entire pipeline in try/catch.
- On failure: show error toast, fall back to `window.print()` with `@media print` styles.
- On Safari iOS: detect via user agent, skip high scales (cap at 2x) to avoid memory crashes.
- On Firefox: test canvas memory limits, degrade gracefully.

---

## Considerations
- **CORS:** Convex storage URLs must be fetched as blobs before capture to avoid tainted canvas. The `useCORS` flag alone is not reliable.
- **Fonts:** `document.fonts.ready` must resolve before capture. If Google Fonts fail to load, the PDF will use fallback fonts — acceptable degradation.
- **Performance:** 3x scale on a long resume (~3000px CSS height) produces a ~9400px tall canvas. This is ~35MB uncompressed in memory. Fine on desktop, may need 2x cap on mobile.
- **Mystery Lore:** The magnifying glass cursor and hotspot hover effects are purely interactive. They should be stripped during capture via the `.pdf-exporting` class so the PDF looks like a clean, professional resume.
