import type { KAPLAYCtx, GameObj, Vec2 } from "kaplay";
import { PALETTE } from "../constants";

export interface ImageData {
  name: string;
  width: number;
  height: number;
}

export default function makeIcon(
  k: KAPLAYCtx,
  parent: GameObj,
  posVec2: Vec2,
  imageData: ImageData,
  subtitle: string
): [GameObj, GameObj] {
  const icon = parent.add([
    k.sprite(imageData.name, {
      width: imageData.width,
      height: imageData.height,
    }),
    k.anchor("center"),
    k.pos(posVec2),
    k.opacity(0),
    k.offscreen({ hide: true, distance: 300 }),
  ]);

  const subtitleText = icon.add([
    k.text(subtitle, { font: "ibm-bold", size: 32 }),
    k.color(k.Color.fromHex(PALETTE.color1)),
    k.anchor("center"),
    k.pos(0, 100),
    k.opacity(0),
  ]);

  return [icon, subtitleText];
}
