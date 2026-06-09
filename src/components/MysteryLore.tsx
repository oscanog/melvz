import { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";

/* ──────────────────────────────────────────
   MysteryTooltip — rendered via Portal at document.body
   Uses position:fixed with raw clientX/clientY so
   coordinate system is always viewport-relative.
────────────────────────────────────────── */

interface MysteryTooltipProps {
  lore: string;
  onClose: () => void;
  clickX: number; // raw e.clientX (viewport px)
  clickY: number; // raw e.clientY (viewport px)
}

function MysteryTooltip({ lore, onClose, clickX, clickY }: MysteryTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Compute placement once the tooltip has rendered and we know its size
  useEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = el.getBoundingClientRect();
    const gap = 14; // px between cursor and tooltip edge

    let top = clickY + gap;
    let left = clickX + gap;

    // Flip above cursor if overflows bottom
    if (top + rect.height > vh - gap) {
      top = clickY - rect.height - gap;
    }
    // Flip left if overflows right
    if (left + rect.width > vw - gap) {
      left = clickX - rect.width - gap;
    }
    // Clamp to viewport edges
    if (top < gap) top = gap;
    if (left < gap) left = gap;

    setCoords({ top, left });
    setPlaced(true);
  }, [clickX, clickY]);

  // Dismiss handlers: click outside, Escape, scroll
  const stableOnClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        stableOnClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stableOnClose();
    };
    const handleScroll = () => stableOnClose();

    // Use a rAF so the click that opened the tooltip doesn't immediately close it
    requestAnimationFrame(() => {
      document.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("keydown", handleKey);
      document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    });

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [stableOnClose]);

  return createPortal(
    <div
      ref={tooltipRef}
      className="mystery-tooltip"
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        opacity: placed ? 1 : 0,
        transform: placed ? "scale(1)" : "scale(0.92)",
        pointerEvents: placed ? "auto" : "none",
      }}
    >
      <div className="mystery-tooltip__header">
        <span className="mystery-tooltip__icon">🔍</span>
        <span className="mystery-tooltip__label">MYSTERY LORE</span>
      </div>
      <div className="mystery-tooltip__body">{lore}</div>
    </div>,
    document.body,
  );
}

/* ──────────────────────────────────────────
   MysteryHotspot — wraps resume items
   If lore is undefined, renders children unchanged.
────────────────────────────────────────── */

interface MysteryHotspotProps {
  lore?: string;
  children: ReactNode;
}

export function MysteryHotspot({ lore, children }: MysteryHotspotProps) {
  const [click, setClick] = useState<{ x: number; y: number } | null>(null);

  if (!lore) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setClick({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        className="mystery-hotspot"
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>

      {click && (
        <MysteryTooltip
          lore={lore}
          clickX={click.x}
          clickY={click.y}
          onClose={() => setClick(null)}
        />
      )}
    </>
  );
}
