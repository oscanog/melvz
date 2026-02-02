export interface Palette {
  color1: string;
  color2: string;
  color3: string;
}

export const PALETTE: Palette = {
  color1: "#272946",
  color2: "#aaea6c",
  color3: "#e7ffee",
} as const;

export const DIAGONAL_FACTOR = 1 / Math.sqrt(2);
export const ZOOM_MAX_BOUND = 2;
export const ZOOM_MIN_BOUND = 0.2;
