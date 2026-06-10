export interface ResumeSkillGroup {
  label: string;
  items: string[];
  mysteryLore?: string;
}

export interface EducationItem {
  degree: string;
  school: string;
  period: string;
  detail: string;
  mysteryLore?: string;
}

export interface ExperienceItem {
  role: string;
  period: string;
  description: string;
  mysteryLore?: string;
}

export interface PortfolioProject {
  name: string;
  period: string;
  stack: string;
  description: string;
  links?: { label: string; url: string }[];
  demoSlug?: string;
  mysteryLore?: string;
}

export interface SocialLink {
  name: string;
  description: string;
  url?: string;
  address?: string;
}

export type SkyPhase = "dawn" | "noon" | "golden" | "night";

export interface GameZoneProject {
  name: string;
  stack: string;
  color: [number, number, number];
}

export interface GameZone {
  id: string;
  index: number;
  year: string;
  role: string;
  kiss: string;
  workLevel: 1 | 2 | 3 | 4;
  skyPhase: SkyPhase;
  buildingLabel: string;
  projects: GameZoneProject[];
  left?: string;
  right?: string;
}

export interface PortfolioContent {
  profile: {
    name: string;
    title: string;
    imageUrl: string;
    image2xUrl?: string;
    imageBlurUrl?: string;
    imageAlt: string;
    contacts: string[];
    summary: string;
  };
  skills: ResumeSkillGroup[];
  education: EducationItem[];
  experiences: ExperienceItem[];
  projects: {
    featured: PortfolioProject[];
    compact: PortfolioProject[];
  };
  socials: SocialLink[];
  game: {
    zones: GameZone[];
  };
}
