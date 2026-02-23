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

interface SkillTreeButtonProps {
  isMobile?: boolean;
}

export function SkillTreeButton({ isMobile }: SkillTreeButtonProps): React.ReactElement {
  const [isOpen, setIsModalOpen] = useAtom(isModalOpenAtom);
  const [, setModalData] = useAtom(modalDataAtom);

  const openSkillTree = () => {
    setModalData({ type: "skilltree" });
    setIsModalOpen(true);
  };

  // Keyboard shortcut K (desktop only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" || e.key === "K") {
        if (!isOpen) openSkillTree();
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
        bottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
        right: "calc(16px + env(safe-area-inset-right, 0px))",
        padding: "10px 18px",
        background: "linear-gradient(180deg, #3d2817, #2a1b0f)",
        border: "2px solid #8b6914",
        color: "#d4af37",
        fontSize: "0.9rem",
        cursor: "pointer",
        borderRadius: "4px",
        zIndex: 5,
        whiteSpace: "nowrap",
      }}
    >
      🎮 Skill Tree{isMobile ? "" : " (K)"}
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
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #1a1a2e, #0f0f1e)",
          maxWidth: 800,
        }}
      >
        <h2 style={{ textAlign: "center" }}>⚔️ Skill Tree ⚔️</h2>

        {/* Responsive 2-col (mobile) → 4-col (desktop) grid via CSS class */}
        <div className="skill-tree-grid">
          {(["q", "w", "e", "r"] as const).map((category) => (
            <div key={category} style={{ textAlign: "center" }}>
              <h3
                style={{
                  color: "#888",
                  textTransform: "uppercase",
                  fontSize: "0.8rem",
                  marginBottom: "12px",
                  marginTop: 0,
                }}
              >
                {category === "q" && "⚛️ Frontend"}
                {category === "w" && "📘 Language"}
                {category === "e" && "🟢 Backend"}
                {category === "r" && "👑 Ultimate"}
              </h3>

              {skillsByCategory[category].map((skill) => (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill)}
                  style={{
                    background:
                      selectedSkill?.id === skill.id
                        ? "linear-gradient(180deg, #4a3728, #3d2817)"
                        : "linear-gradient(180deg, #2a1b0f, #1a0f0a)",
                    border: `2px solid ${skill.unlocked ? "#8b6914" : "#444"}`,
                    borderRadius: "8px",
                    padding: "12px 8px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    opacity: skill.unlocked ? 1 : 0.5,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: "1.6rem", marginBottom: "4px" }}>
                    {skill.icon}
                  </div>
                  <div
                    style={{
                      color: skill.unlocked ? "#d4af37" : "#666",
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                    }}
                  >
                    {skill.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "3px",
                      marginTop: "6px",
                    }}
                  >
                    {Array.from({ length: skill.maxLevel }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: "7px",
                          height: "7px",
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
              marginTop: "16px",
              padding: "16px",
              background: "rgba(139, 105, 20, 0.1)",
              borderRadius: "8px",
              border: "1px solid #8b6914",
            }}
          >
            <h3 style={{ color: "#d4af37", marginTop: 0, fontSize: "1rem" }}>
              {selectedSkill.icon} {selectedSkill.name}
            </h3>
            <p style={{ color: "#ccc", margin: "8px 0", fontSize: "0.9rem" }}>
              {selectedSkill.description}
            </p>
            <div style={{ color: "#888", fontSize: "0.85rem" }}>
              Level: {selectedSkill.level}/{selectedSkill.maxLevel}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button onClick={() => setIsModalOpen(false)}>Close</button>
        </div>
      </div>
    </div>
  );
}
