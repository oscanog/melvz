import type { WorldConfig } from "../core/World";

export const WORLDS: Record<string, WorldConfig> = {

  // ─────────────────────────────────────────────
  //  HUB  —  Town of Origin
  //  ↑ About   → Skills   ← Experience   ↓ Projects
  // ─────────────────────────────────────────────
  town: {
    name: "Town of Origin",
    theme: "town",
    groundColor:  [18, 48, 18],
    groundColor2: [22, 58, 22],
    pathColor:    [70, 55, 32],
    size: 520,
    buildings: [
      {
        id: "welcome",
        type: "shrine",
        x: 0,
        y: -160,
        data: {
          title: "Welcome!",
          type: "welcome",
          content: `Welcome to Azgardia — my interactive portfolio!

I'm Melvin E. Nogoy, a Full Stack Developer.

Navigate with LEFT CLICK or ARROW KEYS / WASD.
Enter a wisp portal to explore each section:

  ↑  About Me
  →  Skills
  ←  Past Works & Experience
  ↓  Projects`,
        },
      },
    ],
    creeps: [],
    portals: [
      { targetWorld: "about",      x:    0, y: -340, label: "About Me"           },
      { targetWorld: "skills",     x:  340, y:    0, label: "Skills"             },
      { targetWorld: "experience", x: -340, y:    0, label: "Experience"         },
      { targetWorld: "projects",   x:    0, y:  340, label: "Projects"           },
    ],
  },

  // ─────────────────────────────────────────────
  //  ↑  About Me
  // ─────────────────────────────────────────────
  about: {
    name: "About Me",
    theme: "mountain",
    groundColor:  [32, 28, 24],
    groundColor2: [40, 36, 30],
    pathColor:    [58, 52, 44],
    size: 460,
    buildings: [
      {
        id: "about-bio",
        type: "castle",
        x: 0,
        y: -150,
        data: {
          title: "Melvin E. Nogoy",
          type: "about",
          content: `Melvin E. Nogoy
Full Stack Developer — Philippines

I build modern web experiences:
React · Next.js · TypeScript · Node.js · Python

Passionate about game development, open source,
and creating things people genuinely enjoy using.

Currently open to freelance & full-time roles.`,
        },
      },
      {
        id: "contact-email",
        type: "shrine",
        x: -160,
        y: 120,
        data: {
          title: "Email",
          type: "contact",
          content: "melvin.nogoy@example.com",
          icon: "📧",
          link: "mailto:melvin.nogoy@example.com",
        },
      },
      {
        id: "contact-github",
        type: "obelisk",
        x: 0,
        y: 140,
        data: {
          title: "GitHub",
          type: "contact",
          content: "github.com/mviner000",
          icon: "🐙",
          link: "https://github.com/mviner000",
        },
      },
      {
        id: "contact-linkedin",
        type: "obelisk",
        x: 160,
        y: 120,
        data: {
          title: "LinkedIn",
          type: "contact",
          content: "linkedin.com/in/melvinnogoy",
          icon: "💼",
          link: "https://linkedin.com/in/melvinnogoy",
        },
      },
    ],
    creeps: [],
    portals: [
      { targetWorld: "town", x: 0, y: 280, label: "← Town of Origin" },
    ],
  },

  // ─────────────────────────────────────────────
  //  →  Skills  (east of town)
  // ─────────────────────────────────────────────
  skills: {
    name: "Hall of Mastery",
    theme: "frozen",
    groundColor:  [14, 24, 44],
    groundColor2: [18, 30, 54],
    pathColor:    [35, 52, 85],
    size: 620,
    buildings: [
      {
        id: "skill-react",
        type: "obelisk",
        x:  160,
        y: -160,
        data: {
          title: "React / Next.js",
          type: "skill",
          level: 4,
          description: "Advanced React — hooks, context, Next.js App Router, server components, and performance optimization.",
          icon: "⚛️",
        },
      },
      {
        id: "skill-typescript",
        type: "obelisk",
        x: -160,
        y: -160,
        data: {
          title: "TypeScript",
          type: "skill",
          level: 4,
          description: "Type-safe JavaScript with generics, utility types, type guards, and advanced design patterns.",
          icon: "📘",
        },
      },
      {
        id: "skill-nodejs",
        type: "obelisk",
        x:  160,
        y:  160,
        data: {
          title: "Node.js",
          type: "skill",
          level: 3,
          description: "Backend development with Express, NestJS, REST APIs, WebSockets, and microservices.",
          icon: "🟢",
        },
      },
      {
        id: "skill-python",
        type: "obelisk",
        x: -160,
        y:  160,
        data: {
          title: "Python",
          type: "skill",
          level: 3,
          description: "Data processing, automation scripts, Django, and Flask web applications.",
          icon: "🐍",
        },
      },
      {
        id: "skill-db",
        type: "shrine",
        x: 0,
        y: 0,
        data: {
          title: "Databases",
          type: "skill",
          level: 3,
          description: "PostgreSQL, MySQL, SQLite — schema design, query optimization, ORMs, and migrations.",
          icon: "🗄️",
        },
      },
    ],
    creeps: [
      { id: "sk-s1", type: "golem", x:  90, y:  60, hp: 80, reward: "skill-react"      },
      { id: "sk-s2", type: "golem", x: -90, y: -60, hp: 80, reward: "skill-typescript" },
    ],
    portals: [
      { targetWorld: "town", x: -380, y: 0, label: "← Town of Origin" },
    ],
  },

  // ─────────────────────────────────────────────
  //  ←  Past Works & Experience  (west of town)
  // ─────────────────────────────────────────────
  experience: {
    name: "Hall of Chronicles",
    theme: "throne",
    groundColor:  [28, 12, 12],
    groundColor2: [36, 16, 16],
    pathColor:    [65, 35, 20],
    size: 560,
    buildings: [
      {
        id: "exp-1",
        type: "castle",
        x: 0,
        y: -180,
        data: {
          title: "Front-End Engineer",
          type: "experience",
          role: "Front-End Software Engineer",
          company: "[REDACTED]",
          period: "2024 – Present",
          description: "Enhanced an interactive design platform by building and optimizing prototyping tools, empowering designers to create high-fidelity experiences and bridging the gap between design and development.",
          tech: ["React", "TypeScript", "WebGL"],
        },
      },
      {
        id: "exp-2",
        type: "tower",
        x: 0,
        y: 100,
        data: {
          title: "Product Engineer",
          type: "experience",
          role: "Product Software Engineer",
          company: "[REDACTED]",
          period: "2021 – 2023",
          description: "Improved a real-time design collaboration tool by developing new components and refining existing features, enhancing workflow efficiency and creativity for design teams worldwide.",
          tech: ["React", "Node.js", "WebSockets"],
        },
      },
    ],
    creeps: [
      { id: "ex-sk1", type: "kobold", x:  130, y: -50, hp: 30, reward: "exp-1" },
      { id: "ex-sk2", type: "kobold", x: -130, y:  60, hp: 30, reward: "exp-2" },
    ],
    portals: [
      { targetWorld: "town", x: 380, y: 0, label: "Town of Origin →" },
    ],
  },

  // ─────────────────────────────────────────────
  //  ↓  Projects  (south of town)
  // ─────────────────────────────────────────────
  projects: {
    name: "Sentinel Forest",
    theme: "forest",
    groundColor:  [8,  38, 8],
    groundColor2: [12, 48, 12],
    pathColor:    [22, 60, 22],
    size: 820,
    buildings: [
      {
        id: "project-sonic",
        type: "tower",
        x: -220,
        y: -200,
        data: {
          title: "Sonic Runner",
          type: "project",
          tech: ["JavaScript", "HTML5 Canvas"],
          description: "An infinite runner inspired by Sonic the Hedgehog — vanilla JS & HTML5 Canvas.",
          links: [
            { name: "Live Demo", url: "https://mviner000.itch.io/sonic-ring-run" },
            { name: "Source",    url: "https://github.com/mviner000/sonic-runner" },
          ],
        },
      },
      {
        id: "project-kirby",
        type: "tower",
        x: 220,
        y: -200,
        data: {
          title: "Kirby Platformer",
          type: "project",
          tech: ["TypeScript", "Kaplay.js"],
          description: "A Kirby-inspired platformer built with TypeScript and the Kaplay game engine.",
          links: [
            { name: "Live Demo", url: "https://mviner000.itch.io/kirby-like-platformer-asset-pack" },
            { name: "Source",    url: "https://github.com/mviner000/Kirby-like-ts" },
          ],
        },
      },
      {
        id: "project-mario",
        type: "tower",
        x: 0,
        y: 200,
        data: {
          title: "Mario Platformer",
          type: "project",
          tech: ["JavaScript", "Kaboom.js"],
          description: "A Super Mario-style platformer game built with Kaboom.js.",
          links: [
            { name: "Live Demo", url: "https://mviner000.itch.io/mario-like-in-javascript" },
            { name: "Source",    url: "https://github.com/mviner000/Mario-Game-Kaboom.js" },
          ],
        },
      },
    ],
    creeps: [
      { id: "pr-sk1", type: "kobold", x:  120, y:   30, hp: 30,  reward: "project-sonic" },
      { id: "pr-sk2", type: "kobold", x: -120, y:  120, hp: 30,  reward: "project-kirby" },
      { id: "pr-go1", type: "golem",  x:    0, y: -100, hp: 100, reward: "project-mario" },
      { id: "pr-sk3", type: "kobold", x:  250, y:  100, hp: 30,  reward: "project-sonic" },
    ],
    portals: [
      { targetWorld: "town", x: 0, y: -480, label: "↑ Town of Origin" },
    ],
  },
};
