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
import type { ZoneConfig } from "./game/data/svZones";
import initGame, { getGameInstance } from "./initGame";
import AdminPage from "./components/AdminPage";
import { HistoryDetailPage, HistoryPage } from "./components/HistoryPage";
import { usePortfolioContent } from "./content/PortfolioContentProvider";
import { getZoneMap } from "./content/portfolioSelectors";

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
  const zoneId         = useAtomValue(currentZoneIdAtom);
  const isMobile       = useIsMobile();
  const setZonePhase   = useSetAtom(zonePhaseAtom);
  const [zoneTransitionZoneId, setZoneTransitionZoneId] = useState<string | null>(null);
  const prevZoneRef = useRef<string | null>(null);
  const { content } = usePortfolioContent();
  const zoneMap = getZoneMap(content);
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (appPhase !== "game") return;
    if (getGameInstance()) return;

    void initGame();
  }, [appPhase]);

  useEffect(() => {
    if (appPhase !== "game") return;

    const prev = prevZoneRef.current;
    prevZoneRef.current = zoneId;

    if (!prev || prev === zoneId || zoneId === "zone1") return;

    setZoneTransitionZoneId(zoneId);
    const t = setTimeout(() => setZoneTransitionZoneId(null), 1050);
    return () => clearTimeout(t);
  }, [appPhase, zoneId]);

  const lowerHash = hash.toLowerCase();
  if (lowerHash === "#admin") {
    return <AdminPage />;
  }
  if (lowerHash === "#admin/history") {
    return <HistoryPage />;
  }
  if (lowerHash.startsWith("#admin/history/")) {
    const revisionId = hash.slice("#admin/history/".length);
    return <HistoryDetailPage revisionId={revisionId} />;
  }

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
        <ZoneBadge zoneMap={zoneMap} />

        {/* Auto / Manual toggle — top right */}
        <AutoWalkToggle zoneMap={zoneMap} />

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
              ? "Use < > buttons to jump career zones - SPACE to take control/jump"
              : "Use < > buttons to jump zones - SPACE to take control/jump, then A/D or arrows"}
          </p>
        </div>
      </div>

      {/* Zone navigator (all devices) */}
      <ZoneNavigator zoneMap={zoneMap} />

      {zoneTransitionZoneId && (
        <ZoneTransitionOverlay zoneId={zoneTransitionZoneId} />
      )}

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
function ZoneBadge({ zoneMap }: { zoneMap: Record<string, ZoneConfig> }) {
  const zoneId = useAtomValue(currentZoneIdAtom);
  const config = zoneMap[zoneId];
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
function AutoWalkToggle({ zoneMap }: { zoneMap: Record<string, ZoneConfig> }) {
  const [autoWalk, setAutoWalk] = useAtom(autoWalkAtom);
  const [zonePhase, setZonePhase] = useAtom(zonePhaseAtom);
  const zoneId = useAtomValue(currentZoneIdAtom);

  const handleClick = () => {
    if (zonePhase === "paused") {
      // Continue → load next zone
      const config = zoneMap[zoneId];
      if (config?.right) {
        // Trigger zone change via atom — Game.ts listens
        setAutoWalk(true);
        setZonePhase("auto-walking");
        // The portal walk will be triggered via manual zone transition
        // For simplicity: set a flag that Game.ts can pick up via the atom change
        // Actually the cleanest: emit via a custom event
        window.dispatchEvent(new CustomEvent("sv-load-zone", { detail: { zoneId: config.right } }));
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
  if (!autoWalk) label = "🕹️ Manual";

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
   Zone navigator component
────────────────────────────────────────── */
function ZoneNavigator({
  zoneMap,
}: {
  zoneMap: Record<string, ZoneConfig>;
}): React.ReactElement {
  const zoneId = useAtomValue(currentZoneIdAtom);
  const config = zoneMap[zoneId];
  const setMobileInput = useSetAtom(mobileInputAtom);

  const goToZone = (targetZoneId?: string) => {
    if (!targetZoneId) return;
    setMobileInput({ x: 0, y: 0 });
    window.dispatchEvent(new CustomEvent("sv-load-zone", { detail: { zoneId: targetZoneId } }));
  };

  return (
    <div className="zone-nav" aria-label="Career timeline navigation">
      <button
        className="zone-nav__btn"
        onClick={() => goToZone(config?.left)}
        disabled={!config?.left}
        aria-label="Previous zone"
        title={config?.left ? "Previous zone" : "No previous zone"}
      >
        {"<"}
      </button>
      <button
        className="zone-nav__btn"
        onClick={() => goToZone(config?.right)}
        disabled={!config?.right}
        aria-label="Next zone"
        title={config?.right ? "Next zone" : "No next zone"}
      >
        {">"}
      </button>
    </div>
  );
}

function ZoneTransitionOverlay({ zoneId }: { zoneId: string }): React.ReactElement {
  const themes: Record<string, { title: string; className: string; accent: string }> = {
    zone2: { title: "PROJECT MODE", className: "zone-fx--teal", accent: "Deploying systems..." },
    zone3: { title: "QA MODE", className: "zone-fx--amber", accent: "Stress-testing reality..." },
    zone4: { title: "GOVTECH MODE", className: "zone-fx--cyan", accent: "Scaling public platforms..." },
  };
  const theme = themes[zoneId] ?? themes.zone2;
  const rows = Array.from({ length: 14 }, (_, i) => i);
  const chips = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className={`zone-fx ${theme.className}`} aria-hidden="true">
      <div className="zone-fx__bg" />
      <div className="zone-fx__grid" />
      <div className="zone-fx__scan" />
      <div className="zone-fx__rows">
        {rows.map((i) => (
          <div
            key={i}
            className="zone-fx__row"
            style={{ animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
      <div className="zone-fx__chips">
        {chips.map((i) => (
          <span
            key={i}
            className="zone-fx__chip"
            style={{
              left: `${6 + (i % 4) * 23}%`,
              top: `${10 + Math.floor(i / 4) * 24}%`,
              animationDelay: `${i * 55}ms`,
            }}
          />
        ))}
      </div>
      <div className="zone-fx__content">
        <p className="zone-fx__wow">WOW</p>
        <p className="zone-fx__title">{theme.title}</p>
        <p className="zone-fx__accent">{theme.accent}</p>
      </div>
    </div>
  );
}

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
