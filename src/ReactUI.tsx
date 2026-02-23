import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  gameStateAtom,
  isModalOpenAtom,
  modalDataAtom,
  currentWorldAtom,
  mobileInputAtom,
  appPhaseAtom,
} from "./stores/gameStore";
import LandingPage from "./components/LandingPage";

// Portfolio data
const PORTFOLIO_DATA: Record<string, any> = {
  welcome: {
    title: "Welcome!",
    content: `Welcome to my interactive portfolio!

I'm Melvin E. Nogoy (the blue character you control), a Full Stack Developer from the Philippines.

🎮 How to explore:
• TAP anywhere to move
• Use the D-pad to walk
• Walk into buildings to view content
• Enter purple portals to travel
• Press E or SPACE to interact`,
  },
  skills: {
    title: "Skills & Technologies",
    content: `Frontend: React, TypeScript, Next.js, Tailwind CSS, Framer Motion

Backend: Node.js, Express, Python, PostgreSQL, MongoDB

DevOps: Docker, GitHub Actions, Vercel, AWS

Game Dev: Kaplay, Phaser, Unity (learning)`,
  },
  projects: {
    title: "Projects",
    content: `My projects are hosted on GitHub. Here are some highlights:

• Sonic Runner - JavaScript infinite runner game
• Kirby Platformer - TypeScript game experiment
• This Portfolio! - Warcraft-inspired interactive portfolio

Click below to view my GitHub repositories.`,
    links: [{ name: "View GitHub", url: "https://github.com/mviner000" }],
  },
  contact: {
    title: "Get In Touch",
    content: `I'm always open to new opportunities and collaborations.

📧 Email: m.viner001@gmail.com
💼 LinkedIn: linkedin.com/in/melvinnogoy
🐦 Twitter/X: @mviner000

Feel free to reach out!`,
    links: [{ name: "Send Email", url: "mailto:m.viner001@gmail.com" }],
  },
};

const WORLD_NAMES: Record<string, string> = {
  town: "🏘️ Town of Origin",
  about: "🧙 About Me",
  skills: "❄️ Hall of Mastery",
  experience: "🔥 Hall of Chronicles",
  projects: "🌲 Sentinel Forest",
};

/** Detect touch capability once at mount */
function useIsMobile(): boolean {
  return useState(
    () => "ontouchstart" in window || navigator.maxTouchPoints > 0
  )[0];
}

export default function ReactUI(): React.ReactElement {
  const [gameState] = useAtom(gameStateAtom);
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);
  const [modalData, setModalData] = useAtom(modalDataAtom);
  const currentWorld = useAtomValue(currentWorldAtom);
  const appPhase = useAtomValue(appPhaseAtom);
  const isMobile = useIsMobile();

  // Handle modal data from game
  useEffect(() => {
    if (modalData && modalData.type) {
      if (PORTFOLIO_DATA[modalData.type]) {
        setModalData({
          ...modalData,
          ...PORTFOLIO_DATA[modalData.type],
        });
      }
    }
  }, [modalData?.type, setModalData]);

  // Show landing page until game phase is active
  if (appPhase !== "game") {
    return <LandingPage />;
  }

  // Fallback loading screen (rarely shown)
  if (gameState === "loading") {
    return <LoadingScreen />;
  }

  const controlsHint = isMobile
    ? "👆 Tap to move • 🕹️ D-pad to walk • 🚪 Enter buildings • 🌀 Portals"
    : "🖱️ Left Click to move • ⌨️ Arrow Keys/WASD to walk • 🚪 Walk into buildings • 🌀 Enter portals";

  return (
    <>
      {/* Game HUD */}
      <div className="game-hud">
        <div className="hud-top">
          <div
            className="world-indicator"
            style={{
              position: "fixed",
              top: "calc(16px + env(safe-area-inset-top, 0px))",
              left: "calc(12px + env(safe-area-inset-left, 0px))",
              padding: "6px 12px",
              background: "linear-gradient(180deg, #3d2817, #2a1b0f)",
              border: "2px solid #8b6914",
              borderRadius: "4px",
              color: "#d4af37",
              fontSize: "0.8rem",
              zIndex: 5,
            }}
          >
            {WORLD_NAMES[currentWorld] || "Unknown Realm"}
          </div>

          <div
            className="player-name"
            style={{
              position: "fixed",
              top: "calc(16px + env(safe-area-inset-top, 0px))",
              right: "calc(12px + env(safe-area-inset-right, 0px))",
              padding: "6px 12px",
              background: "linear-gradient(180deg, #1a3a5c, #0d2137)",
              border: "2px solid #4a90d9",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "0.8rem",
              zIndex: 5,
            }}
          >
            👤 You are: <strong>Melvin</strong>
          </div>
        </div>

        {/* Back to Portfolio button */}
        <button
          className="hud-back-btn"
          onClick={() => { window.location.href = "/"; }}
          title="Return to CV Resume"
        >
          ⬅ CV Resume: Melvin Nogoy
        </button>

        <div className="hud-bottom">
          <p className="controls-hint">{controlsHint}</p>
        </div>
      </div>

      {/* Virtual D-pad (touch devices only) */}
      {isMobile && <MobileDPad />}

      {/* Building/Content Modal */}
      {isModalOpen && modalData && modalData.type !== "skilltree" && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalData.title}</h2>
            <p style={{ whiteSpace: "pre-line" }}>{modalData.content}</p>

            {modalData.links && (
              <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {modalData.links.map((link: any, i: number) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      padding: "10px 20px",
                      background: "linear-gradient(180deg, #3d2817, #2a1b0f)",
                      border: "2px solid #8b6914",
                      color: "#d4af37",
                      textDecoration: "none",
                      borderRadius: 4,
                    }}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            )}

            <p style={{ marginTop: 14, fontSize: "0.7rem", color: "#666", letterSpacing: "0.06em" }}>
              tap outside to close
            </p>
          </div>
        </div>
      )}
    </>
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
      {/* Row 1: [empty] [up] [empty] */}
      <div className="dpad-empty" />
      <button {...btnProps(0, -1)}>▲</button>
      <div className="dpad-empty" />

      {/* Row 2: [left] [center] [right] */}
      <button {...btnProps(-1, 0)}>◀</button>
      <div
        style={{
          background: "rgba(139,105,20,0.15)",
          border: "2px solid rgba(139,105,20,0.3)",
          borderRadius: "8px",
        }}
      />
      <button {...btnProps(1, 0)}>▶</button>

      {/* Row 3: [empty] [down] [empty] */}
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
