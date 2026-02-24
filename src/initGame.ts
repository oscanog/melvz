import { Game } from "./game/core/Game";

let gameInstance: Game | null = null;

export default async function initGame(): Promise<void> {
  // Dev StrictMode and hash-based boot can trigger duplicate init attempts.
  if (gameInstance) return;

  const canvas = document.getElementById("game") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Game canvas not found");
    return;
  }

  gameInstance = new Game(canvas);
  await gameInstance.init();
}

export function getGameInstance(): Game | null {
  return gameInstance;
}
