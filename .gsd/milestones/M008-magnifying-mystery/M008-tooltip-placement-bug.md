# M008 Bug Report: Cursor Tooltip Placement Issue

## Issue Description
The `MysteryTooltip` component was modified to spawn exactly at the mouse click coordinates (`e.clientX`, `e.clientY`) rather than anchoring to the center of the hovered element. However, the implementation failed, resulting in the tooltip flying far off-screen or appearing in completely incorrect locations, rendering the feature unusable.

## Root Cause Analysis (Mistakes)

1. **CSS Coordinate Mismatch:** 
   - The React component calculated absolute document coordinates using `e.clientY + window.scrollY`.
   - However, the `<MysteryTooltip>` was rendered inside the `<div className="mystery-hotspot">`.
   - In `style.css`, `.mystery-hotspot` is styled with `position: relative`.
   - When an element has `position: absolute` (the tooltip), its `top` and `left` properties are relative to its closest positioned ancestor (the hotspot), **not** the document body. 
   - Because we fed absolute document coordinates into an element expecting relative local coordinates, the tooltip's position was offset by the hotspot's position *plus* the scroll amount, effectively doubling the offset and launching it off-screen.

2. **Missing React Portal:**
   - Popups, modals, and absolute-positioned tooltips that rely on viewport/document coordinates should **always** be rendered at the root level of the DOM using `ReactDOM.createPortal()`. By keeping the tooltip inline within the nested resume structure, it remained trapped by parent stacking contexts, `overflow: hidden` rules, and relative positioning bounds.

## Learnings for the Next Agent

1. **Never mix absolute math with relative DOM trees:** If you calculate `x/y` coordinates based on the viewport (`clientX/clientY`), you MUST render the tooltip using a React Portal directly into `document.body` to guarantee the coordinate system matches.
2. **Alternatively, use fixed positioning:** If you don't use a Portal, you can use `position: fixed` and just apply `e.clientX` and `e.clientY` directly (since fixed is relative to the viewport). However, this can fail if a parent element has `transform`, `filter`, or `perspective` applied (which breaks fixed positioning context in CSS).
3. **The Portal + Absolute approach is the most robust:** 
   - Extract the tooltip rendering to a Portal attached to `document.body`.
   - Apply `position: absolute`.
   - Calculate coordinates: `left: e.clientX + window.scrollX` and `top: e.clientY + window.scrollY`.

## Next Action Required
The next AI agent must:
1. Re-factor `<MysteryTooltip>` to use `ReactDOM.createPortal`.
2. Strip out the relative positioning conflicts.
3. Ensure boundary detection (preventing the tooltip from overflowing the right or bottom edge) works smoothly with the new Portal coordinate system.
