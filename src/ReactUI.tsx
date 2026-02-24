import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useState, useEffect, useRef } from "react";
import {
  gameStateAtom,
  isModalOpenAtom,
  modalDataAtom,
  mobileInputAtom,
  appPhaseAtom,
  autoWalkAtom,
  zonePhaseAtom,
  currentZoneIdAtom,
} from "./stores/gameStore";
import LandingPage from "./components/LandingPage";
import { SV_ZONE_MAP } from "./game/data/svZones";
import type { ZoneConfig } from "./game/data/svZones";
import initGame, { getGameInstance } from "./initGame";

/** Detect touch capability once at mount */
function useIsMobile(): boolean {
  return useState(
    () => "ontouchstart" in window || navigator.maxTouchPoints > 0
  )[0];
}

export default function ReactUI(): React.ReactElement {
  const [gameState]    = useAtom(gameStateAtom);
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);
  const [modalData]    = useAtom(modalDataAtom);
  const appPhase       = useAtomValue(appPhaseAtom);
  const isMobile       = useIsMobile();
  const setZonePhase   = useSetAtom(zonePhaseAtom);

  useEffect(() => {
    if (appPhase !== "game") return;
    if (getGameInstance()) return;

    void initGame();
  }, [appPhase]);

  // Show landing page until game phase is active
  if (appPhase !== "game") {
    return <LandingPage />;
  }

  // Fallback loading screen (rarely shown)
  if (gameState === "loading") {
    return <LoadingScreen />;
  }

  const handleModalClose = () => {
    setIsModalOpen(false);
    setZonePhase("paused");
  };

  return (
    <>
      {/* Game HUD */}
      <div className="game-hud">
        {/* Zone year + role badge — top center */}
        <ZoneBadge />

        {/* Auto / Manual toggle — top right */}
        <AutoWalkToggle />

        {/* Back to Portfolio button */}
        <button
          className="hud-back-btn"
          onClick={() => { window.location.href = "/"; }}
          title="Return to CV Resume"
        >
          ⬅ CV Resume
        </button>

        {/* Controls hint — bottom center */}
        <div className="hud-bottom">
          <p className="controls-hint">
            {isMobile
              ? "Tap D-pad to take control • 🌀 Walk into portals to travel zones"
              : "SPACE — take control · then WASD/Arrows to walk · 🌀 portals = next zone"}
          </p>
        </div>
      </div>

      {/* Virtual D-pad (touch devices only) */}
      {isMobile && <MobileDPad />}

      {/* Auto-walk "press SPACE to stop" hint — pulsing, disappears once manual */}
      <AutoWalkHint />

      {/* SV Projects Modal — triggered by sitting sequence */}
      {isModalOpen && modalData?.type === "sv-projects" && (
        <SVMonitorModal zone={modalData.zone as ZoneConfig} onClose={handleModalClose} />
      )}
    </>
  );
}

/* ──────────────────────────────────────────
   Zone Badge — shows year + role above game
────────────────────────────────────────── */
function ZoneBadge() {
  const zoneId = useAtomValue(currentZoneIdAtom);
  const config = SV_ZONE_MAP[zoneId];
  if (!config) return null;

  return (
    <div className="hud-zone-badge">
      <span className="hud-zone-badge__year">{config.year}</span>
      <span className="hud-zone-badge__role">{config.role}</span>
      <span className="hud-zone-badge__kiss">{config.kiss}</span>
    </div>
  );
}

/* ──────────────────────────────────────────
   Auto / Manual toggle button
────────────────────────────────────────── */
function AutoWalkToggle() {
  const [autoWalk, setAutoWalk] = useAtom(autoWalkAtom);
  const [zonePhase, setZonePhase] = useAtom(zonePhaseAtom);
  const zoneId = useAtomValue(currentZoneIdAtom);

  const handleClick = () => {
    if (zonePhase === "paused") {
      // Continue → load next zone
      const config = SV_ZONE_MAP[zoneId];
      if (config?.right) {
        // Trigger zone change via atom — Game.ts listens
        setAutoWalk(true);
        setZonePhase("auto-walking");
        // The portal walk will be triggered via manual zone transition
        // For simplicity: set a flag that Game.ts can pick up via the atom change
        // Actually the cleanest: emit via a custom event
        window.dispatchEvent(new CustomEvent("sv-next-zone", { detail: { zoneId: config.right } }));
      } else {
        // Last zone — just go manual
        setAutoWalk(false);
        setZonePhase("manual");
      }
      return;
    }

    if (autoWalk) {
      // Switch to manual
      setAutoWalk(false);
      setZonePhase("manual");
    } else {
      // Resume auto — restart walk toward desk
      setAutoWalk(true);
      setZonePhase("auto-walking");
    }
  };

  let label = "🤖 Auto";
  if (zonePhase === "paused") label = "▶ Continue";
  else if (!autoWalk) label = "🕹️ Manual";

  return (
    <button className="hud-control-toggle" onClick={handleClick}>
      {label}
    </button>
  );
}

/* ──────────────────────────────────────────
   SV Monitor Modal — project cards
────────────────────────────────────────── */
function SVMonitorModal({ zone, onClose }: { zone: ZoneConfig; onClose: () => void }) {
  return (
    <div className="sv-monitor-modal" onClick={onClose}>
      <div className="sv-modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="sv-modal__header">
          <span className="sv-modal__year">{zone.year}</span>
          <h2 className="sv-modal__role">{zone.role}</h2>
          <p className="sv-modal__kiss">{zone.kiss}</p>
        </div>

        {zone.projects.length > 0 && (
          <div className="sv-modal__projects">
            {zone.projects.map((p, i) => (
              <div
                key={i}
                className="sv-project-card"
                style={{ borderColor: `rgb(${p.color[0]},${p.color[1]},${p.color[2]})` }}
              >
                <div
                  className="sv-project-card__thumb"
                  style={{ background: `rgb(${p.color[0]},${p.color[1]},${p.color[2]})` }}
                />
                <div className="sv-project-card__name">{p.name}</div>
                <div className="sv-project-card__stack">{p.stack}</div>
              </div>
            ))}
          </div>
        )}

        <button className="sv-modal__close" onClick={onClose}>
          Take Control →
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Auto-walk "SPACE to take control" hint
────────────────────────────────────────── */
function AutoWalkHint() {
  const autoWalk   = useAtomValue(autoWalkAtom);
  const zonePhase  = useAtomValue(zonePhaseAtom);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Show hint 1.5s after auto-walk starts; hide immediately on manual
  useEffect(() => {
    if (autoWalk && zonePhase === "auto-walking") {
      timerRef.current = setTimeout(() => setVisible(true), 1500);
    } else {
      clearTimeout(timerRef.current);
      setVisible(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [autoWalk, zonePhase]);

  if (!visible) return null;

  return (
    <div className="sv-autowalk-hint">
      <kbd className="sv-autowalk-hint__key">SPACE</kbd>
      <span className="sv-autowalk-hint__text">to take control</span>
    </div>
  );
}

/* ──────────────────────────────────────────
   Virtual D-pad component
────────────────────────────────────────── */
function MobileDPad(): React.ReactElement {
  const setMobileInput = useSetAtom(mobileInputAtom);

  const press = (x: number, y: number) => setMobileInput({ x, y });
  const release = () => setMobileInput({ x: 0, y: 0 });

  const btnProps = (x: number, y: number) => ({
    className: "dpad-btn",
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      press(x, y);
    },
    onPointerUp: release,
    onPointerLeave: release,
    onPointerCancel: release,
  });

  return (
    <div className="dpad">
      <div className="dpad-empty" />
      <button {...btnProps(0, -1)}>▲</button>
      <div className="dpad-empty" />

      <button {...btnProps(-1, 0)}>◀</button>
      <div
        style={{
          background: "rgba(0,200,100,0.1)",
          border: "2px solid rgba(0,200,100,0.2)",
          borderRadius: "8px",
        }}
      />
      <button {...btnProps(1, 0)}>▶</button>

      <div className="dpad-empty" />
      <button {...btnProps(0, 1)}>▼</button>
      <div className="dpad-empty" />
    </div>
  );
}

/* ──────────────────────────────────────────
   Loading Screen (fallback)
────────────────────────────────────────── */
function LoadingScreen(): React.ReactElement {
  return (
    <div className="loading-screen">
      <h1>Initializing Portfolio...</h1>
      <div className="loading-bar">
        <div className="loading-progress" />
      </div>
    </div>
  );
}
