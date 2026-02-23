import kaplay from "kaplay";
import type { KAPLAYCtx } from "kaplay";
import { store } from "../../store";
import {
  gameStateAtom,
  cameraPosAtom,
  heroPosAtom,
  isModalOpenAtom,
  mobileInputAtom,
  autoWalkAtom,
  zonePhaseAtom,
} from "../../stores/gameStore";
import { SVZone, GROUND_Y, PLAYER_SPAWN_X, DESK_X } from "./SVZone";
import { SV_ZONE_MAP } from "../data/svZones";

// Camera Y is fixed so the side-scroller always shows sky + buildings + ground
const SV_CAMERA_Y   = -80;
// Auto-walk speed (px/s)
const AUTO_WALK_SPEED = 150;
// Cooldown after zone load before portals can trigger (ms)
const PORTAL_COOLDOWN_MS = 2000;

export class Game {
  private k: KAPLAYCtx;
  private player: any = null;
  private currentZone: SVZone | null = null;
  private keys: Record<string, boolean> = {};
  private lastPortalTime = 0;
  private lastPortalTarget = "";

  constructor(canvas: HTMLCanvasElement) {
    this.k = kaplay({
      global: false,
      pixelDensity: 2,
      touchToMouse: true,
      debug: false,
      canvas,
      background: [13, 13, 16],
    });
  }

  async init() {
    // Load font into Kaplay
    this.k.loadFont("IBM Plex Sans", "/fonts/IBMPlexSans-Regular.ttf");

    // Hero sprite only — all environment drawn with shapes
    await this.k.loadSprite("hero", "/sprites/hero.png", {
      sliceX: 6, sliceY: 7,
      anims: {
        "walk-down":  { from: 0,  to: 5,  loop: true, speed: 8 },
        "walk-left":  { from: 6,  to: 11, loop: true, speed: 8 },
        "walk-right": { from: 12, to: 17, loop: true, speed: 8 },
        "walk-up":    { from: 18, to: 23, loop: true, speed: 8 },
        "idle-down":  { from: 24, to: 29, loop: true, speed: 4 },
        "idle-left":  { from: 30, to: 35, loop: true, speed: 4 },
        "idle-up":    { from: 36, to: 41, loop: true, speed: 4 },
      },
    });

    await document.fonts.ready;

    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.setupNextZoneListener();
    this.loadZone("zone1");
    store.set(gameStateAtom, "playing");
  }

  // ── Zone management ─────────────────────────────────────────────

  private loadZone(zoneId: string) {
    const config = SV_ZONE_MAP[zoneId];
    if (!config) return;

    // Destroy old zone
    if (this.currentZone) {
      this.currentZone.destroy();
    }
    // Destroy player label so it doesn't duplicate
    this.k.destroyAll("player-label");

    this.currentZone = new SVZone(this.k, config, (targetId) => {
      this.loadZone(targetId);
    });
    this.currentZone.enter();

    // Prevent portal trigger immediately after load
    this.lastPortalTime = Date.now();
    this.lastPortalTarget = "";

    // Reset player position + velocity
    if (this.player) {
      this.player.pos.x = PLAYER_SPAWN_X;
      this.player.pos.y = GROUND_Y;
      this.player.vel.x = 0;
      this.player.vel.y = 0;
      this.player.play("walk-right");
    }

    // Snap camera to spawn point immediately (no drift from previous zone)
    this.k.setCamPos(PLAYER_SPAWN_X, SV_CAMERA_Y);

    // Re-create name label (destroyed above)
    this.spawnNameLabel();

    // Reset auto-walk state
    store.set(autoWalkAtom, true);
    store.set(zonePhaseAtom, "auto-walking");
    store.set(isModalOpenAtom, false);
  }

  // ── Player ──────────────────────────────────────────────────────

  private createPlayer() {
    this.player = this.k.add([
      this.k.sprite("hero", { anim: "walk-right" }),
      this.k.scale(1.5),
      this.k.pos(PLAYER_SPAWN_X, GROUND_Y),
      this.k.anchor("center"),
      this.k.area(),
      this.k.body(),
      this.k.z(50),
      "player",
      { speed: 200 },
    ]);

    this.spawnNameLabel();
    this.setupNameLabelFollow();

    this.player.onUpdate(() => {
      store.set(heroPosAtom, { x: this.player.pos.x, y: this.player.pos.y });

      const phase = store.get(zonePhaseAtom);
      const autoWalk = store.get(autoWalkAtom);

      if (autoWalk && phase === "auto-walking") {
        // Check for manual override via held movement keys
        const anyKeyHeld =
          this.keys["left"] || this.keys["a"] ||
          this.keys["right"] || this.keys["d"] ||
          this.keys["up"]   || this.keys["w"] ||
          this.keys["down"] || this.keys["s"];

        if (anyKeyHeld) {
          store.set(autoWalkAtom, false);
          store.set(zonePhaseAtom, "manual");
          this.handleKeyboardMovement();
        } else {
          this.doAutoWalk();
        }
      } else if (phase === "manual") {
        this.handleKeyboardMovement();
      }
      // In arrived/sitting/typing/modal/paused phases — player is stationary

      this.updatePlayerAnimation();
      this.checkPortalProximity();
    });
  }

  /** Spawns the "Melvin" floating name label. Called once on init and after zone loads. */
  private spawnNameLabel() {
    this.k.add([
      this.k.text("Melvin", { size: 14, font: "IBM Plex Sans" }),
      this.k.pos(this.player?.pos.x ?? PLAYER_SPAWN_X, (this.player?.pos.y ?? GROUND_Y) - 65),
      this.k.anchor("center"),
      this.k.color(255, 215, 0),
      this.k.z(100),
      "player-label",
    ]);
  }

  /** Registers the label-follow update loop once (called from createPlayer). */
  private setupNameLabelFollow() {
    this.k.onUpdate(() => {
      const labels = this.k.get("player-label");
      for (const lbl of labels) {
        if (this.player) {
          lbl.pos.x = this.player.pos.x;
          lbl.pos.y = this.player.pos.y - 65;
        }
      }
    });
  }

  private doAutoWalk() {
    const targetX = this.currentZone?.getDeskX() ?? DESK_X;
    const dx = targetX - this.player.pos.x;

    if (dx > 5) {
      // Still walking toward desk
      this.player.vel.x = AUTO_WALK_SPEED;
      this.player.vel.y = 0;
      this.player.pos.y = GROUND_Y; // Lock Y
    } else {
      // Arrived — stop and trigger sitting sequence
      this.player.vel.x = 0;
      this.player.vel.y = 0;
      this.player.pos.x = targetX - 5;
      this.player.pos.y = GROUND_Y;
      store.set(zonePhaseAtom, "arrived");
      if (this.currentZone) {
        this.currentZone.triggerSitting(this.player);
      }
    }
  }

  private updatePlayerAnimation() {
    const vx = this.player.vel.x;
    const vy = this.player.vel.y;
    const moving = Math.abs(vx) > 5 || Math.abs(vy) > 5;

    let targetAnim: string;
    if (moving) {
      if (Math.abs(vx) >= Math.abs(vy)) {
        targetAnim = vx > 0 ? "walk-right" : "walk-left";
      } else {
        targetAnim = vy > 0 ? "walk-down" : "walk-up";
      }
    } else {
      const cur = this.player.getCurAnim()?.name ?? "idle-down";
      if (cur.includes("right") || cur.includes("left")) targetAnim = "idle-left";
      else if (cur.includes("up")) targetAnim = "idle-up";
      else targetAnim = "idle-down";
    }

    if (this.player.getCurAnim()?.name !== targetAnim) {
      this.player.play(targetAnim);
    }
  }

  private handleKeyboardMovement() {
    let moveX = 0;
    let moveY = 0;

    if (this.keys["left"] || this.keys["a"]) moveX = -1;
    if (this.keys["right"] || this.keys["d"]) moveX = 1;
    if (this.keys["up"] || this.keys["w"]) moveY = -1;
    if (this.keys["down"] || this.keys["s"]) moveY = 1;

    // Mobile D-pad input overrides keyboard
    const mobileInput = store.get(mobileInputAtom);
    if (mobileInput.x !== 0) moveX = mobileInput.x;
    if (mobileInput.y !== 0) moveY = mobileInput.y;

    // Normalize diagonal
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.707;
      moveY *= 0.707;
    }

    this.player.vel.x = moveX * this.player.speed;
    this.player.vel.y = moveY * this.player.speed;
  }

  // ── Portal proximity ─────────────────────────────────────────────

  private checkPortalProximity() {
    const now = Date.now();
    if (now - this.lastPortalTime < PORTAL_COOLDOWN_MS) return;

    const portals = this.k.get("portal");
    for (const portal of portals) {
      const dx = this.player.pos.x - portal.pos.x;
      const dy = this.player.pos.y - portal.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 60 && portal.target !== this.lastPortalTarget) {
        this.lastPortalTime = now;
        this.lastPortalTarget = portal.target;
        this.loadZone(portal.target);
        return;
      }
    }
  }

  // ── Camera (side-scroller: X lerps, Y fixed) ─────────────────────

  private setupCamera() {
    this.k.onUpdate(() => {
      const playerX = this.player.pos.x;
      const camX = this.k.getCamPos().x;
      const targetX = this.k.lerp(camX, playerX, 0.1);
      this.k.setCamPos(targetX, SV_CAMERA_Y);
      store.set(cameraPosAtom, { x: targetX, y: SV_CAMERA_Y });
    });
  }

  // ── Input ────────────────────────────────────────────────────────

  private setupInput() {
    // Left click: switch to manual + click-to-move
    this.k.onMousePress("left", () => {
      const mousePos = this.k.mousePos();
      if (mousePos.y < 60 || mousePos.y > this.k.height() - 60) return;

      const phase = store.get(zonePhaseAtom);
      if (phase === "auto-walking" || phase === "paused") {
        store.set(autoWalkAtom, false);
        store.set(zonePhaseAtom, "manual");
      }

      if (store.get(zonePhaseAtom) === "manual") {
        const worldPos = this.k.toWorld(mousePos);
        this.movePlayerTo(worldPos.x, worldPos.y);
      }
    });

    // Keyboard hold listeners
    const bindKey = (key: string) => {
      this.k.onKeyDown(key as any, () => { this.keys[key] = true; });
      this.k.onKeyRelease(key as any, () => { this.keys[key] = false; });
    };
    ["left","right","up","down","a","d","w","s"].forEach(bindKey);
  }

  /** Listen for the "Continue →" button from ReactUI to advance to next zone */
  private setupNextZoneListener() {
    window.addEventListener("sv-next-zone", (e: Event) => {
      const detail = (e as CustomEvent).detail as { zoneId: string };
      if (detail?.zoneId) {
        this.loadZone(detail.zoneId);
      }
    });
  }

  private movePlayerTo(targetX: number, targetY: number) {
    const dx = targetX - this.player.pos.x;
    const dy = targetY - this.player.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.player.vel.x = (dx / dist) * this.player.speed;
      this.player.vel.y = (dy / dist) * this.player.speed;

      const checkArrival = () => {
        const dx2 = targetX - this.player.pos.x;
        const dy2 = targetY - this.player.pos.y;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        if (dist2 < 10) {
          this.player.vel.x = 0;
          this.player.vel.y = 0;
        } else if (this.player.vel.x !== 0 || this.player.vel.y !== 0) {
          this.k.wait(0.05, checkArrival);
        }
      };

      this.k.wait(0.05, checkArrival);
    }
  }
}
