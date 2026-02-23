/* ─────────────────────────────────────────────────────────────────
   Silicon Valley Career Zones — data config
   4 zones ordered oldest → newest (left → right)
───────────────────────────────────────────────────────────────── */

export type SkyPhase = "dawn" | "noon" | "golden" | "night";

export interface ZoneProject {
  name: string;
  stack: string;
  color: [number, number, number];
}

export interface ZoneConfig {
  id: string;
  index: number;
  year: string;
  role: string;
  kiss: string;           // Keep It Short & Simple one-liner
  workLevel: 1 | 2 | 3 | 4;
  skyPhase: SkyPhase;
  buildingLabel: string;
  projects: ZoneProject[];
  left?: string;          // Portal target (zone id)
  right?: string;         // Portal target (zone id)
}

export const SV_ZONES: ZoneConfig[] = [
  {
    id: "zone1",
    index: 0,
    year: "2019 – 2020",
    role: "IT Support / Technical Assistant",
    kiss: "Fixed computers. Learned patience. Found the spark.",
    workLevel: 1,
    skyPhase: "dawn",
    buildingLabel: "IT Repair Shop",
    projects: [], // No shipped products yet — support role
    right: "zone2",
  },
  {
    id: "zone2",
    index: 1,
    year: "2021 – 2025",
    role: "Full Stack Developer — Project-Based",
    kiss: "Self-taught. Built real systems. Never stopped shipping.",
    workLevel: 2,
    skyPhase: "noon",
    buildingLabel: "Co-working Space",
    projects: [
      { name: "Library Inventory", stack: "Vue.js + Laravel",    color: [34, 139, 34]  },
      { name: "Offline Kiosk Logger", stack: "Tauri + React",    color: [0, 128, 128]  },
      { name: "BugCake QA Tool", stack: "React + Convex",        color: [220, 20, 60]  },
      { name: "Attendance Logger", stack: "Vue.js + Laravel API", color: [70, 130, 180] },
    ],
    left: "zone1",
    right: "zone3",
  },
  {
    id: "zone3",
    index: 2,
    year: "Jun – Nov 2025",
    role: "QA Tester — Hooli Software International",
    kiss: "Broke things professionally. Made enterprise software bulletproof.",
    workLevel: 3,
    skyPhase: "golden",
    buildingLabel: "Hooli HQ",
    projects: [
      { name: "Enterprise Web App QA", stack: "Manual Testing + CI", color: [255, 140, 0] },
    ],
    left: "zone2",
    right: "zone4",
  },
  {
    id: "zone4",
    index: 3,
    year: "Nov 2025 – Mar 2026",
    role: "Full Stack Dev — Provincial Government",
    kiss: "Government scale. 18 municipalities. 1000+ requests/month.",
    workLevel: 4,
    skyPhase: "night",
    buildingLabel: "Provincial Tech Center",
    projects: [
      { name: "PGO Connect",  stack: "Next.js 16 + Laravel 11 + PostgreSQL", color: [100, 149, 237] },
      { name: "PPDO Next",    stack: "Next.js 16 + Laravel 12 + Convex",     color: [147, 112, 219] },
    ],
    left: "zone3",
  },
];

export const SV_ZONE_MAP: Record<string, ZoneConfig> =
  Object.fromEntries(SV_ZONES.map((z) => [z.id, z]));
