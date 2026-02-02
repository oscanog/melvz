import type { KAPLAYCtx, GameObj, Vec2 } from "kaplay";
import { PALETTE } from "../constants";
import { emailAtom, isEmailModalVisibleAtom, store } from "../store";
import { opacityTrickleDown } from "../utils";
import makeIcon, { type ImageData } from "./Icon";

export default function makeEmailIcon(
  k: KAPLAYCtx,
  parent: GameObj,
  posVec2: Vec2,
  imageData: ImageData,
  subtitle: string,
  email: string
): GameObj {
  const [emailIcon, subtitleText] = makeIcon(
    k,
    parent,
    posVec2,
    imageData,
    subtitle
  );

  const emailSwitch = emailIcon.add([
    k.circle(30),
    k.color(k.Color.fromHex(PALETTE.color1)),
    k.anchor("center"),
    k.area(),
    k.pos(0, 150),
    k.opacity(0),
  ]);

  emailSwitch.onCollide("player", () => {
    store.set(isEmailModalVisibleAtom, true);
    store.set(emailAtom, email);
  });

  opacityTrickleDown(parent, [subtitleText, emailSwitch]);

  return emailIcon;
}
