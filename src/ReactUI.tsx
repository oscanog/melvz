import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { 
  gameStateAtom, 
  isModalOpenAtom, 
  modalDataAtom,
  currentWorldAtom,
} from "./stores/gameStore";
import { SkillTreeButton, SkillTreeModal } from "./components/react/SkillTree";

// Portfolio data
const PORTFOLIO_DATA: Record<string, any> = {
  welcome: {
    title: "Welcome!",
    content: `Welcome to my interactive portfolio!

I'm Melvin E. Nogoy (the blue character you control), a Full Stack Developer from the Philippines.

🎮 How to explore:
• LEFT CLICK anywhere to move
• ARROW KEYS or WASD to walk
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
    links: [
      { name: "View GitHub", url: "https://github.com/mviner000" }
    ]
  },
  contact: {
    title: "Get In Touch",
    content: `I'm always open to new opportunities and collaborations.

📧 Email: melvin.nogoy@example.com
💼 LinkedIn: linkedin.com/in/melvinnogoy
🐦 Twitter/X: @mviner000

Feel free to reach out!`,
    links: [
      { name: "Send Email", url: "mailto:melvin.nogoy@example.com" }
    ]
  }
};

const WORLD_NAMES: Record<string, string> = {
  town: "🏘️ Town of Origin",
  forest: "🌲 Sentinel Forest",
  frozen: "❄️ Frozen Throne",
  mountain: "⛰️ Contact Peaks",
};

export default function ReactUI(): React.ReactElement {
  const [gameState] = useAtom(gameStateAtom);
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);
  const [modalData, setModalData] = useAtom(modalDataAtom);
  const currentWorld = useAtomValue(currentWorldAtom);

  // Handle modal data from game
  useEffect(() => {
    if (modalData && modalData.type) {
      // If it's a building we know about, ensure we have full data
      if (PORTFOLIO_DATA[modalData.type]) {
        setModalData({
          ...modalData,
          ...PORTFOLIO_DATA[modalData.type]
        });
      }
    }
  }, [modalData?.type, setModalData]);

  if (gameState === "loading") {
    return <LoadingScreen />;
  }

  return (
    <>
      {/* Game HUD */}
      <div className="game-hud">
        <div className="hud-top">
          <div className="world-indicator" style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            padding: "10px 20px",
            background: "linear-gradient(180deg, #3d2817, #2a1b0f)",
            border: "2px solid #8b6914",
            borderRadius: "4px",
            color: "#d4af37",
            fontSize: "1rem",
            zIndex: 5,
          }}>
            {WORLD_NAMES[currentWorld] || "Unknown Realm"}
          </div>

          <div className="player-name" style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "10px 20px",
            background: "linear-gradient(180deg, #1a3a5c, #0d2137)",
            border: "2px solid #4a90d9",
            borderRadius: "4px",
            color: "#fff",
            fontSize: "1rem",
            zIndex: 5,
          }}>
            👤 You are: <strong>Melvin</strong>
          </div>
        </div>

        <div className="hud-bottom">
          <p className="controls-hint">
            🖱️ Left Click to move • ⌨️ Arrow Keys/WASD to walk • 🚪 Walk into buildings • 🌀 Enter portals
          </p>
        </div>
      </div>

      {/* Skill Tree Button */}
      <SkillTreeButton />

      {/* Skill Tree Modal */}
      <SkillTreeModal />

      {/* Building/Content Modal */}
      {isModalOpen && modalData && modalData.type !== "skilltree" && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalData.title}</h2>
            <p style={{ whiteSpace: "pre-line" }}>{modalData.content}</p>
            
            {modalData.links && (
              <div style={{ marginTop: 20 }}>
                {modalData.links.map((link: any, i: number) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginRight: 10,
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
            
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ marginTop: 20 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function LoadingScreen(): React.ReactElement {
  return (
    <div className="loading-screen">
      <h1>Loading Azgardia...</h1>
      <div className="loading-bar">
        <div className="loading-progress" />
      </div>
    </div>
  );
}
