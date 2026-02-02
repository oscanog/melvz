import type { KAPLAYCtx, GameObj, Vec2 } from "kaplay";
import { opacityTrickleDown } from "../utils";
import makeIcon, { type ImageData } from "./Icon";

export default function makeSkillIcon(
  k: KAPLAYCtx,
  parent: GameObj,
  posVec2: Vec2,
  imageData: ImageData,
  subtitle: string
): GameObj {
  const [icon, subtitleText] = makeIcon(
    k,
    parent,
    posVec2,
    imageData,
    subtitle
  );

  icon.use(
    k.area({ shape: new k.Rect(k.vec2(0), icon.width + 50, icon.height + 65) })
  );
  icon.use(k.body({ drag: 1 }));
  (icon as GameObj & { direction: Vec2 }).direction = k.vec2(0, 0);

  icon.onCollide("player", (player: GameObj & { direction: Vec2 }) => {
    icon.applyImpulse(player.direction.scale(1000));
    icon.direction = player.direction;
  });

  opacityTrickleDown(parent, [subtitleText]);

  return icon;
}
