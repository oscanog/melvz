import type { KAPLAYCtx, GameObj, Vec2 } from "kaplay";
import { PALETTE } from "../constants";

export default function makeSection(
  k: KAPLAYCtx,
  posVec2: Vec2,
  sectionName: string,
  onCollide?: (section: GameObj) => void
): GameObj {
  const section = k.add([
    k.rect(200, 200, { radius: 10 }),
    k.anchor("center"),
    k.area(),
    k.pos(posVec2),
    k.color(PALETTE.color1),
    sectionName,
  ]);

  section.add([
    k.text(sectionName, { font: "ibm-bold", size: 64 }),
    k.color(PALETTE.color1),
    k.anchor("center"),
    k.pos(0, -150),
  ]);

  if (onCollide) {
    const onCollideHandler = section.onCollide("player", () => {
      onCollide(section);
      (onCollideHandler as unknown as { cancel(): void }).cancel();
    });
  }

  return section;
}
