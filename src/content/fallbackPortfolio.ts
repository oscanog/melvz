import type { PortfolioContent } from "./portfolioTypes";

export const fallbackPortfolio: PortfolioContent = {
  profile: {
    name: "MELVIN NOGOY",
    title: "Full Stack Developer - Software Engineer",
    imageUrl: "/melvin_nogoy_id.webp",
    imageAlt: "Melvin Nogoy",
    contacts: [
      "0994-823-5631",
      "m.viner001@gmail.com",
      "Tarlac City, Philippines",
      "29 years old",
    ],
    summary:
      "Full Stack Developer with 5 years combined experience in software engineering, QA, and system development. Specialized in bridging rapid prototyping with enterprise legacy systems - building fast, maintainable applications with clean implementation across government and institutional sectors.",
  },
  skills: [
    {
      label: "Frontend",
      items: ["React", "Next.js", "Vue.js", "TypeScript", "Tailwind CSS"],
    },
    {
      label: "Backend",
      items: ["Laravel", "Rust", "Django", "REST API Design"],
    },
    {
      label: "Desktop",
      items: ["Tauri (Rust-based)", "Electron"],
    },
    {
      label: "Database",
      items: ["PostgreSQL", "MySQL", "Convex"],
    },
    {
      label: "QA & Ops",
      items: ["Manual Testing", "Regression Testing", "Git", "CI/CD"],
    },
  ],
  education: [
    {
      degree: "BS Information Technology",
      school: "General De Jesus College",
      period: "Apr 2026",
      detail: "General De Jesus College (2022-2026). Capstone II remaining.",
    },
  ],
  experiences: [
    {
      role: "Full Stack Developer - Provincial Government Digital Transformation",
      period: "Nov 2025 - Mar 2026",
      description:
        "Architected production-grade systems for Province of Tarlac, transitioning from rapid Convex prototypes to Laravel 12 enterprise infrastructure serving 18 municipalities.",
    },
    {
      role: "Quality Assurance Tester - Hooli Software International",
      period: "Jun 2025 - Nov 2025",
      description:
        "Designed and executed manual test cases for enterprise web applications; logged, tracked, and verified defects during feature and regression cycles.",
    },
    {
      role: "Full Stack Developer - Project-Based & Institutional",
      period: "2021 - 2025",
      description:
        "Built end-to-end systems including Library Inventory Management, Offline Attendance Loggers, and QA management tools using Vue.js, Laravel, React, and Tauri.",
    },
    {
      role: "IT Support / Technical Assistant",
      period: "2019 - 2020",
      description:
        "Troubleshot hardware, software, and network issues; documented technical processes and supported staff operations.",
    },
  ],
  projects: {
    featured: [
      {
        name: "PGO Connect - Provincial Governor's Office DMS",
        period: "Feb - Mar 2026",
        stack: "Next.js 16, Laravel 11, PostgreSQL, SMS/Facebook APIs",
        description:
          "Enhanced a mission-critical citizen service platform processing 1000+ monthly requests across 18 municipalities.",
      },
      {
        name: "PPDO Next - Provincial Planning & Development Platform",
        period: "Nov 2025 - Jan 2026",
        stack: "Next.js 16, Laravel 12, Convex, PostgreSQL",
        description:
          "Architected a government-grade financial planning ecosystem with 4-tier hierarchical allocation, RBAC security, and zero-downtime migration from Convex to PostgreSQL.",
      },
    ],
    compact: [
      {
        name: "Offline Kiosk Logger",
        period: "2024",
        stack: "Tauri, React",
        description: "Offline-first attendance logging with printable report generation.",
      },
      {
        name: "BugCake QA Tool",
        period: "2024",
        stack: "React, Convex",
        description: "Centralized test case management platform for QA workflows.",
      },
      {
        name: "Library Inventory System",
        period: "2024",
        stack: "Vue.js, Laravel",
        description: "End-to-end system for tracking books, students, and borrowing activities.",
      },
      {
        name: "Attendance Logger",
        period: "2023",
        stack: "Vue.js, Laravel API",
        description: "Cross-platform attendance tracking with admin dashboard and reporting.",
      },
    ],
  },
  socials: [
    {
      name: "GitHub",
      description: "GitHub is where I host my projects.",
      url: "https://github.com/mviner000",
    },
    {
      name: "LinkedIn",
      description: "Professional profile and work history.",
      url: "https://linkedin.com/in/melvinnogoy",
    },
    {
      name: "Email",
      description: "Primary contact email.",
      address: "m.viner001@gmail.com",
    },
  ],
  game: {
    zones: [
      {
        id: "zone1",
        index: 0,
        year: "2019 - 2020",
        role: "IT Support / Technical Assistant",
        kiss: "Fixed computers. Learned patience. Found the spark.",
        workLevel: 1,
        skyPhase: "dawn",
        buildingLabel: "IT Repair Shop",
        projects: [],
        right: "zone2",
      },
      {
        id: "zone2",
        index: 1,
        year: "2021 - 2025",
        role: "Full Stack Developer - Project-Based",
        kiss: "Self-taught. Built real systems. Never stopped shipping.",
        workLevel: 2,
        skyPhase: "noon",
        buildingLabel: "Co-working Space",
        projects: [
          { name: "Library Inventory", stack: "Vue.js + Laravel", color: [34, 139, 34] },
          { name: "Offline Kiosk Logger", stack: "Tauri + React", color: [0, 128, 128] },
          { name: "BugCake QA Tool", stack: "React + Convex", color: [220, 20, 60] },
          { name: "Attendance Logger", stack: "Vue.js + Laravel API", color: [70, 130, 180] },
        ],
        left: "zone1",
        right: "zone3",
      },
      {
        id: "zone3",
        index: 2,
        year: "Jun - Nov 2025",
        role: "QA Tester - Hooli Software International",
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
        year: "Nov 2025 - Mar 2026",
        role: "Full Stack Dev - Provincial Government",
        kiss: "Government scale. 18 municipalities. 1000+ requests/month.",
        workLevel: 4,
        skyPhase: "night",
        buildingLabel: "Provincial Tech Center",
        projects: [
          { name: "PGO Connect", stack: "Next.js 16 + Laravel 11 + PostgreSQL", color: [100, 149, 237] },
          { name: "PPDO Next", stack: "Next.js 16 + Laravel 12 + Convex", color: [147, 112, 219] },
        ],
        left: "zone3",
      },
    ],
  },
};

