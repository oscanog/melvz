import type { WorldConfig } from "../core/World";

export const WORLDS: Record<string, WorldConfig> = {
  town: {
    name: "Town of Origin",
    theme: "town",
    groundColor: [20, 30, 20],
    pathColor: [40, 50, 40],
    size: 500,
    buildings: [
      {
        id: "welcome",
        type: "shrine",
        x: 0,
        y: -200,
        data: {
          title: "Welcome!",
          type: "welcome",
          content: `Welcome to my portfolio!

I'm Melvin E. Nogoy, a Full Stack Developer from the Philippines.

Use LEFT CLICK or ARROW KEYS to move me around.
Walk into buildings to view my work.
Enter portals (purple) to travel to other worlds.`,
        },
      },
    ],
    creeps: [],
    portals: [
      { targetWorld: "forest", x: 300, y: 0, label: "Sentinel Forest" },
      { targetWorld: "frozen", x: -300, y: 0, label: "Frozen Throne" },
    ],
  },

  forest: {
    name: "Sentinel Forest",
    theme: "forest",
    groundColor: [10, 40, 15],
    pathColor: [20, 60, 25],
    size: 800,
    buildings: [
      {
        id: "project-1",
        type: "tower",
        x: 200,
        y: -200,
        data: {
          title: "Sonic Runner",
          type: "project",
          tech: ["JavaScript", "HTML5 Canvas"],
          description: "An infinite runner game inspired by Sonic the Hedgehog.",
          links: [
            { name: "Live Demo", url: "https://mviner000.itch.io/sonic-ring-run" },
            { name: "Source", url: "https://github.com/mviner000/sonic-runner" },
          ],
        },
      },
      {
        id: "project-2",
        type: "tower",
        x: -200,
        y: -200,
        data: {
          title: "Kirby Platformer",
          type: "project",
          tech: ["TypeScript", "Kaplay"],
          description: "A Kirby-inspired platformer built with TypeScript.",
          links: [
            { name: "Live Demo", url: "https://mviner000.itch.io/kirby-like-platformer-asset-pack" },
            { name: "Source", url: "https://github.com/mviner000/Kirby-like-ts" },
          ],
        },
      },
      {
        id: "project-3",
        type: "tower",
        x: 0,
        y: 200,
        data: {
          title: "Mario Platformer",
          type: "project",
          tech: ["JavaScript", "Kaboom.js"],
          description: "A Mario-like platformer game.",
          links: [
            { name: "Live Demo", url: "https://mviner000.itch.io/mario-like-in-javascript" },
            { name: "Source", url: "https://github.com/mviner000/Mario-Game-Kaboom.js" },
          ],
        },
      },
    ],
    creeps: [
      { id: "creep-1", type: "kobold", x: 100, y: 0, hp: 30, reward: "project-1" },
      { id: "creep-2", type: "kobold", x: -100, y: 100, hp: 30, reward: "project-2" },
      { id: "creep-3", type: "golem", x: 0, y: -100, hp: 100, reward: "project-3" },
    ],
    portals: [
      { targetWorld: "town", x: 400, y: 0, label: "Town" },
      { targetWorld: "frozen", x: -400, y: 0, label: "Frozen Throne" },
    ],
  },

  frozen: {
    name: "Frozen Throne",
    theme: "frozen",
    groundColor: [15, 25, 35],
    pathColor: [30, 45, 60],
    size: 600,
    buildings: [
      {
        id: "skill-react",
        type: "obelisk",
        x: 150,
        y: -150,
        data: {
          title: "React",
          type: "skill",
          level: 4,
          description: "Advanced React with hooks, context, and performance optimization.",
          icon: "⚛️",
        },
      },
      {
        id: "skill-typescript",
        type: "obelisk",
        x: -150,
        y: -150,
        data: {
          title: "TypeScript",
          type: "skill",
          level: 4,
          description: "Type-safe JavaScript with advanced generics and type guards.",
          icon: "📘",
        },
      },
      {
        id: "skill-nodejs",
        type: "obelisk",
        x: 150,
        y: 150,
        data: {
          title: "Node.js",
          type: "skill",
          level: 3,
          description: "Backend development with Express, NestJS, and microservices.",
          icon: "🟢",
        },
      },
      {
        id: "skill-python",
        type: "obelisk",
        x: -150,
        y: 150,
        data: {
          title: "Python",
          type: "skill",
          level: 3,
          description: "Data processing, automation, and Django web applications.",
          icon: "🐍",
        },
      },
    ],
    creeps: [
      { id: "creep-f1", type: "golem", x: 0, y: 0, hp: 80, reward: "skill-react" },
      { id: "creep-f2", type: "golem", x: -200, y: 0, hp: 80, reward: "skill-typescript" },
    ],
    portals: [
      { targetWorld: "town", x: 300, y: 0, label: "Town" },
      { targetWorld: "mountain", x: -300, y: 0, label: "Mountains" },
    ],
  },

  mountain: {
    name: "Contact Peaks",
    theme: "mountain",
    groundColor: [25, 25, 30],
    pathColor: [45, 45, 50],
    size: 400,
    buildings: [
      {
        id: "contact-email",
        type: "shrine",
        x: 0,
        y: -150,
        data: {
          title: "Email",
          type: "contact",
          content: "melvin.nogoy@example.com",
          icon: "📧",
        },
      },
      {
        id: "contact-github",
        type: "shrine",
        x: -150,
        y: 100,
        data: {
          title: "GitHub",
          type: "contact",
          content: "github.com/mviner000",
          icon: "🐙",
        },
      },
      {
        id: "contact-linkedin",
        type: "shrine",
        x: 150,
        y: 100,
        data: {
          title: "LinkedIn",
          type: "contact",
          content: "linkedin.com/in/melvinnogoy",
          icon: "💼",
        },
      },
    ],
    creeps: [],
    portals: [
      { targetWorld: "town", x: 0, y: 250, label: "Town" },
    ],
  },
};
