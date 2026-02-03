import { useAtom } from "jotai";
import { useState, useEffect } from "react";
import { isModalOpenAtom, modalDataAtom } from "../../stores/gameStore";

interface Skill {
  id: string;
  name: string;
  icon: string;
  level: number;
  maxLevel: number;
  description: string;
  category: "q" | "w" | "e" | "r";
  unlocked: boolean;
}

const SKILLS: Skill[] = [
  {
    id: "react",
    name: "React",
    icon: "⚛️",
    level: 4,
    maxLevel: 4,
    description: "Component-based UI with virtual DOM",
    category: "q",
    unlocked: true,
  },
  {
    id: "typescript",
    name: "TypeScript",
    icon: "📘",
    level: 4,
    maxLevel: 4,
    description: "Type-safe JavaScript development",
    category: "w",
    unlocked: true,
  },
  {
    id: "nodejs",
    name: "Node.js",
    icon: "🟢",
    level: 3,
    maxLevel: 4,
    description: "Server-side JavaScript runtime",
    category: "e",
    unlocked: true,
  },
  {
    id: "fullstack",
    name: "Full Stack",
    icon: "👑",
    level: 1,
    maxLevel: 1,
    description: "Ultimate: Master of all trades",
    category: "r",
    unlocked: true,
  },
  {
    id: "nextjs",
    name: "Next.js",
    icon: "▲",
    level: 3,
    maxLevel: 4,
    description: "React framework for production",
    category: "q",
    unlocked: true,
  },
  {
    id: "tailwind",
    name: "Tailwind",
    icon: "🌊",
    level: 4,
    maxLevel: 4,
    description: "Utility-first CSS framework",
    category: "q",
    unlocked: true,
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    icon: "🐘",
    level: 3,
    maxLevel: 4,
    description: "Advanced relational database",
    category: "e",
    unlocked: true,
  },
  {
    id: "docker",
    name: "Docker",
    icon: "🐳",
    level: 2,
    maxLevel: 4,
    description: "Containerization platform",
    category: "e",
    unlocked: true,
  },
];

export function SkillTreeButton(): React.ReactElement {
  const [isOpen, setIsModalOpen] = useAtom(isModalOpenAtom);
  const [, setModalData] = useAtom(modalDataAtom);

  const openSkillTree = () => {
    setModalData({ type: "skilltree" });
    setIsModalOpen(true);
  };

  // Keyboard shortcut K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" || e.key === "K") {
        if (!isOpen) {
          openSkillTree();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <button
      onClick={openSkillTree}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "12px 24px",
        background: "linear-gradient(180deg, #3d2817, #2a1b0f)",
        border: "2px solid #8b6914",
        color: "#d4af37",
        fontSize: "1rem",
        cursor: "pointer",
        borderRadius: "4px",
        zIndex: 5,
      }}
    >
      🎮 Skill Tree (K)
    </button>
  );
}

export function SkillTreeModal(): React.ReactElement | null {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);
  const [modalData] = useAtom(modalDataAtom);

  if (!isModalOpen || modalData?.type !== "skilltree") return null;

  const skillsByCategory = {
    q: SKILLS.filter((s) => s.category === "q"),
    w: SKILLS.filter((s) => s.category === "w"),
    e: SKILLS.filter((s) => s.category === "e"),
    r: SKILLS.filter((s) => s.category === "r"),
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => setIsModalOpen(false)}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #1a1a2e, #0f0f1e)",
          border: "3px solid #8b6914",
          borderRadius: "12px",
          padding: "30px",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <h2
          style={{
            color: "#d4af37",
            textAlign: "center",
            marginTop: 0,
            borderBottom: "2px solid #8b6914",
            paddingBottom: "15px",
          }}
        >
          ⚔️ Skill Tree ⚔️
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {(["q", "w", "e", "r"] as const).map((category) => (
            <div key={category} style={{ textAlign: "center" }}>
              <h3
                style={{
                  color: "#888",
                  textTransform: "uppercase",
                  fontSize: "0.9rem",
                  marginBottom: "15px",
                }}
              >
                {category === "q" && "⚛️ Frontend (Q)"}
                {category === "w" && "📘 Language (W)"}
                {category === "e" && "🟢 Backend (E)"}
                {category === "r" && "👑 Ultimate (R)"}
              </h3>

              {skillsByCategory[category].map((skill) => (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill)}
                  style={{
                    background: selectedSkill?.id === skill.id
                      ? "linear-gradient(180deg, #4a3728, #3d2817)"
                      : "linear-gradient(180deg, #2a1b0f, #1a0f0a)",
                    border: `2px solid ${skill.unlocked ? "#8b6914" : "#444"}`,
                    borderRadius: "8px",
                    padding: "15px",
                    marginBottom: "10px",
                    cursor: "pointer",
                    opacity: skill.unlocked ? 1 : 0.5,
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      fontSize: "2rem",
                      marginBottom: "5px",
                    }}
                  >
                    {skill.icon}
                  </div>
                  <div
                    style={{
                      color: skill.unlocked ? "#d4af37" : "#666",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                    }}
                  >
                    {skill.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "3px",
                      marginTop: "8px",
                    }}
                  >
                    {Array.from({ length: skill.maxLevel }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: i < skill.level ? "#d4af37" : "#444",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {selectedSkill && (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "rgba(139, 105, 20, 0.1)",
              borderRadius: "8px",
              border: "1px solid #8b6914",
            }}
          >
            <h3 style={{ color: "#d4af37", marginTop: 0 }}>
              {selectedSkill.icon} {selectedSkill.name}
            </h3>
            <p style={{ color: "#ccc" }}>{selectedSkill.description}</p>
            <div style={{ color: "#888", marginTop: "10px" }}>
              Level: {selectedSkill.level}/{selectedSkill.maxLevel}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={() => setIsModalOpen(false)}
            style={{
              padding: "12px 30px",
              background: "linear-gradient(180deg, #3d2817, #2a1b0f)",
              border: "2px solid #8b6914",
              color: "#d4af37",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
