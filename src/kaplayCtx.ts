import kaplay from "kaplay";
import type { KAPLAYCtx } from "kaplay";

export default function makeKaplayCtx(): KAPLAYCtx {
  return kaplay({
    global: false,
    pixelDensity: 2,
    touchToMouse: true,
    debug: false,
    debugKey: "f1",
    canvas: document.getElementById("game") as HTMLCanvasElement,
  });
}
