import { atom } from "jotai";

// Landing page phase
export type AppPhase = "landing" | "hacking" | "game-loading" | "game";
export const appPhaseAtom = atom<AppPhase>("landing");

// Game state
export const gameStateAtom = atom<"loading" | "playing" | "modal">("loading");

// ─── Silicon Valley zone system ────────────────────────────────────────
/** Which zone is currently loaded */
export const currentZoneIdAtom = atom<string>("zone1");

/** Auto-walk cinematics on/off */
export const autoWalkAtom = atom<boolean>(true);

/**
 * Phase within the current zone's scene:
 *   auto-walking → player moving toward desk
 *   arrived      → at desk, transition frame
 *   sitting      → seated, PC screen dim
 *   typing       → PC screen lit, code scrolling
 *   modal        → project cards visible
 *   paused       → manual takeover prompt shown
 *   manual       → employer has full control
 */
export type ZonePhaseState =
  | "auto-walking"
  | "arrived"
  | "sitting"
  | "typing"
  | "modal"
  | "paused"
  | "manual";

export const zonePhaseAtom = atom<ZonePhaseState>("auto-walking");

// ─── Camera ────────────────────────────────────────────────────────────
export const cameraPosAtom = atom<{ x: number; y: number }>({ x: 0, y: 0 });
export const cameraZoomAtom = atom<number>(1);

// ─── Hero ──────────────────────────────────────────────────────────────
export const heroPosAtom = atom<{ x: number; y: number }>({ x: 0, y: 0 });

// ─── UI State ──────────────────────────────────────────────────────────
export const isModalOpenAtom = atom<boolean>(false);
export const modalDataAtom = atom<any>(null);

// Mobile D-pad input (x: -1/0/1, y: -1/0/1)
export const mobileInputAtom = atom<{ x: number; y: number }>({ x: 0, y: 0 });
