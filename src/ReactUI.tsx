import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { 
  gameStateAtom, 
  isModalOpenAtom, 
  modalDataAtom,
  selectedEntityAtom 
} from "./stores/gameStore";

// Portfolio data
const PORTFOLIO_DATA: Record<string, any> = {
  about: {
    title: "About Me",
    content: `Hi! I'm Melvin E. Nogoy, a Full Stack Developer from the Philippines.

I specialize in building modern web applications with React, TypeScript, and Node.js. With 5+ years of experience, I've worked on everything from small business websites to enterprise applications.

When I'm not coding, you'll find me exploring Filipino indie games, contributing to open source, or mentoring aspiring developers.`
  },
  skills: {
    title: "Skills & Technologies",
    content: `Frontend: React, TypeScript, Next.js, Tailwind CSS, Framer Motion

Backend: Node.js, Express, Python, PostgreSQL, MongoDB

DevOps: Docker, GitHub Actions, Vercel, AWS

Game Dev: Kaplay, Phaser, Unity (learning)`
  },
  projects: {
    title: "Projects",
    content: `My projects are hosted on GitHub. Here are some highlights:

• Sonic Runner - JavaScript infinite runner game
• Kirby-like Platformer - TypeScript game experiment  
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

export default function ReactUI(): React.ReactElement {
  const [gameState] = useAtom(gameStateAtom);
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);
  const [modalData, setModalData] = useAtom(modalDataAtom);
  const selectedEntity = useAtomValue(selectedEntityAtom);

  useEffect(() => {
    if (selectedEntity && PORTFOLIO_DATA[selectedEntity]) {
      setModalData({
        type: selectedEntity,
        ...PORTFOLIO_DATA[selectedEntity]
      });
      setIsModalOpen(true);
    }
  }, [selectedEntity, setModalData, setIsModalOpen]);

  if (gameState === "loading") {
    return <LoadingScreen />;
  }

  return (
    <>
      <div className="game-hud">
        <div className="hud-top">
          <div className="resources">
            <span className="resource-gold">📁 Projects</span>
            <span className="resource-lumber">💻 Skills</span>
            <span className="resource-food">⭐ Experience</span>
          </div>
        </div>

        <div className="hud-bottom">
          <p className="controls-hint">
            Right-click to move • Click buildings to view portfolio
          </p>
        </div>
      </div>

      {isModalOpen && modalData && (
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
