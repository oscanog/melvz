import { atom } from "jotai";

// Game state
export const gameStateAtom = atom<"loading" | "playing" | "modal">("loading");
export const currentWorldAtom = atom<"town" | "forest" | "frozen" | "mountain" | "throne">("town");

// Camera
export const cameraPosAtom = atom<{ x: number; y: number }>({ x: 0, y: 0 });
export const cameraZoomAtom = atom<number>(1);

// Hero
export const heroPosAtom = atom<{ x: number; y: number }>({ x: 0, y: 0 });
export const heroTargetAtom = atom<{ x: number; y: number } | null>(null);
export const selectedEntityAtom = atom<string | null>(null);

// UI State
export const isModalOpenAtom = atom<boolean>(false);
export const modalContentAtom = atom<"about" | "project" | "skill" | "contact" | "experience" | null>(null);
export const modalDataAtom = atom<any>(null);

// Portfolio data
export const projectsAtom = atom<any[]>([]);
export const skillsAtom = atom<any[]>([]);
export const experienceAtom = atom<any[]>([]);
