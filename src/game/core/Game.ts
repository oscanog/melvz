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
const SV_CAMERA_Y     = -80;
// Auto-walk speed (px/s)
const AUTO_WALK_SPEED = 150;
const MANUAL_MOVE_SPEED = 220;
const JUMP_VELOCITY = -410;
const JUMP_GRAVITY = 1150;
const MAX_FALL_SPEED = 620;
// Cooldown after zone load before portals can trigger (ms)
const PORTAL_COOLDOWN_MS = 2000;
// Nerdy glasses color
const GLASS_COLOR: [number,number,number] = [30, 30, 30];

export class Game {
  private k: KAPLAYCtx;
  private player: any = null;
  private currentZone: SVZone | null = null;
  private keys: Record<string, boolean> = {};
  private lastPortalTime = 0;
  private lastPortalTarget = "";
  private verticalVel = 0;
  private isJumping = false;
  private audioCtx: AudioContext | null = null;

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
    this.k.loadFont("IBM Plex Sans", "/fonts/IBMPlexSans-Regular.ttf");

    // Nerdy civilian character (hum_peasant: 128×320, 4 cols × 10 rows, 32×32/frame)
    // Row 0: walk-south · Row 1: walk-west · Row 2: walk-east · Row 3: walk-north · Row 4: idle
    await this.k.loadSprite("hero", "/sprites/smallcraft/troops/hum_peasant-Sheet.png", {
      sliceX: 4, sliceY: 10,
      anims: {
        "walk-down":  { from: 0,  to: 3,  loop: true, speed: 8 },
        "walk-left":  { from: 4,  to: 7,  loop: true, speed: 8 },
        "walk-right": { from: 8,  to: 11, loop: true, speed: 8 },
        "walk-up":    { from: 12, to: 15, loop: true, speed: 8 },
        "idle-down":  { from: 16, to: 19, loop: true, speed: 4 },
        "idle-left":  { from: 16, to: 19, loop: true, speed: 4 },
        "idle-up":    { from: 16, to: 19, loop: true, speed: 4 },
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

    if (this.currentZone) {
      this.currentZone.destroy();
    }

    this.k.destroyAll("player-label");
    this.k.destroyAll("player-glasses");

    this.currentZone = new SVZone(this.k, config, (targetId) => {
      this.loadZone(targetId);
    });
    this.currentZone.enter();

    // Prevent portal trigger immediately after load
    this.lastPortalTime = Date.now();
    this.lastPortalTarget = "";

    if (this.player) {
      this.player.pos.x = PLAYER_SPAWN_X;
      this.player.pos.y = GROUND_Y;
      this.player.vel.x = 0;
      this.player.vel.y = 0;
      this.verticalVel = 0;
      this.isJumping = false;
      this.player.play("walk-right");
    }

    this.k.setCamPos(PLAYER_SPAWN_X, SV_CAMERA_Y);
    this.spawnNameLabel();
    this.spawnGlasses();

    store.set(autoWalkAtom, true);
    store.set(zonePhaseAtom, "auto-walking");
    store.set(isModalOpenAtom, false);
  }

  // ── Player ──────────────────────────────────────────────────────

  private createPlayer() {
    // hum_peasant at 2.5× → 80×80 visible pixels
    this.player = this.k.add([
      this.k.sprite("hero", { anim: "walk-right" }),
      this.k.scale(2.5),
      this.k.pos(PLAYER_SPAWN_X, GROUND_Y),
      this.k.anchor("center"),
      this.k.area(),
      this.k.body(),
      this.k.z(50),
      "player",
      { speed: 200 },
    ]);

    this.spawnNameLabel();
    this.spawnGlasses();
    this.setupFollowLabels();

    this.player.onUpdate(() => {
      store.set(heroPosAtom, { x: this.player.pos.x, y: this.player.pos.y });

      const phase = store.get(zonePhaseAtom);
      const autoWalk = store.get(autoWalkAtom);

      if (autoWalk && phase === "auto-walking") {
        // Auto-walk plays uninterrupted — only SPACE or click stops it
        this.doAutoWalk();
        } else if (phase === "manual") {
          this.handleKeyboardMovement();
        } else {
          this.player.vel.x = 0;
        }
      // arrived / sitting / typing / modal / paused → player is stationary

        this.applyVerticalPhysics();
        this.updatePlayerAnimation();
      this.checkPortalProximity();
    });
  }

  /** Spawns the "Melvin" name label (tagged "player-label", recreated per zone). */
  private spawnNameLabel() {
    const px = this.player?.pos.x ?? PLAYER_SPAWN_X;
    const py = this.player?.pos.y ?? GROUND_Y;
    this.k.add([
      this.k.text("Melvin", { size: 14, font: "IBM Plex Sans" }),
      this.k.pos(px, py - 55),
      this.k.anchor("center"),
      this.k.color(255, 215, 0),
      this.k.z(100),
      "player-label",
    ]);
  }

  /**
   * Draw nerdy round glasses on top of the character.
   * Two circle lenses + bridge rect, tagged "player-glasses".
   * Positioned at ~y-22 above the player center (head region of the 80px sprite).
   */
  private spawnGlasses() {
    const px = this.player?.pos.x ?? PLAYER_SPAWN_X;
    const py = this.player?.pos.y ?? GROUND_Y;
    const gy = py - 22; // Y position of glasses (head region)

    // Left lens
    this.k.add([
      this.k.circle(5),
      this.k.pos(px - 9, gy),
      this.k.color(...GLASS_COLOR),
      this.k.opacity(0.82),
      this.k.z(53),
      this.k.anchor("center"),
      "player-glasses",
    ]);

    // Right lens
    this.k.add([
      this.k.circle(5),
      this.k.pos(px + 9, gy),
      this.k.color(...GLASS_COLOR),
      this.k.opacity(0.82),
      this.k.z(53),
      this.k.anchor("center"),
      "player-glasses",
    ]);

    // Bridge (horizontal connector)
    this.k.add([
      this.k.rect(10, 2),
      this.k.pos(px, gy),
      this.k.color(...GLASS_COLOR),
      this.k.opacity(0.82),
      this.k.z(53),
      this.k.anchor("center"),
      "player-glasses",
    ]);
  }

  /** Registers ONE update loop (in createPlayer) that follows player every frame. */
  private setupFollowLabels() {
    this.k.onUpdate(() => {
      if (!this.player) return;
      const px = this.player.pos.x;
      const py = this.player.pos.y;

      for (const lbl of this.k.get("player-label")) {
        lbl.pos.x = px;
        lbl.pos.y = py - 55;
      }

      const gy = py - 22;
      const glasses = this.k.get("player-glasses");
      if (glasses[0]) { glasses[0].pos.x = px - 9; glasses[0].pos.y = gy; }
      if (glasses[1]) { glasses[1].pos.x = px + 9; glasses[1].pos.y = gy; }
      if (glasses[2]) { glasses[2].pos.x = px;     glasses[2].pos.y = gy; }
    });
  }

  private doAutoWalk() {
    const targetX = this.currentZone?.getDeskX() ?? DESK_X;
    const dx = targetX - this.player.pos.x;

    if (dx > 5) {
      this.player.vel.x = AUTO_WALK_SPEED;
      this.verticalVel = 0;
      this.player.pos.y = GROUND_Y; // Lock Y during auto-walk
    } else {
      // Arrived at desk
      this.player.vel.x = 0;
      this.verticalVel = 0;
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
    const vy = this.verticalVel;
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

    if (this.keys["left"]  || this.keys["a"]) moveX = -1;
    if (this.keys["right"] || this.keys["d"]) moveX =  1;

    const mob = store.get(mobileInputAtom);
    if (mob.x !== 0) moveX = mob.x;
    this.player.vel.x = moveX * MANUAL_MOVE_SPEED;
  }

  // ── Portal proximity ─────────────────────────────────────────────

  private applyVerticalPhysics() {
    if (!this.player) return;

    const phase = store.get(zonePhaseAtom);
    if (phase !== "manual") {
      this.player.vel.y = 0;
      this.verticalVel = 0;
      this.isJumping = false;
      if (phase === "auto-walking" && this.player.pos.y !== GROUND_Y) {
        this.player.pos.y = GROUND_Y;
      }
      return;
    }

    const dt = this.k.dt();
    this.verticalVel = Math.min(this.verticalVel + JUMP_GRAVITY * dt, MAX_FALL_SPEED);
    this.player.vel.y = this.verticalVel;
    this.player.pos.y += this.verticalVel * dt;

    if (this.player.pos.y >= GROUND_Y) {
      this.player.pos.y = GROUND_Y;
      this.player.vel.y = 0;
      this.verticalVel = 0;
      this.isJumping = false;
    }
  }

  private tryJump() {
    if (!this.player) return;
    if (store.get(zonePhaseAtom) !== "manual") return;
    if (this.isJumping || this.player.pos.y < GROUND_Y - 0.5) return;

    this.isJumping = true;
    this.verticalVel = JUMP_VELOCITY;
    this.playJumpSound();
  }

  private playJumpSound() {
    const AudioCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    if (!this.audioCtx) {
      this.audioCtx = new AudioCtor();
    }
    const ctx = this.audioCtx;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.11);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2300, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

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
      const camX = this.k.getCamPos().x;
      const targetX = this.k.lerp(camX, this.player.pos.x, 0.1);
      this.k.setCamPos(targetX, SV_CAMERA_Y);
      store.set(cameraPosAtom, { x: targetX, y: SV_CAMERA_Y });
    });
  }

  // ── Input ────────────────────────────────────────────────────────

  private setupInput() {
    // SPACE — stop auto-walk and take manual control (shown in HUD as shortcut)
    this.k.onKeyPress("space", () => {
      const phase = store.get(zonePhaseAtom);
      if (phase === "auto-walking" || phase === "paused") {
        store.set(autoWalkAtom, false);
        store.set(zonePhaseAtom, "manual");
      }
      this.tryJump();
    });

    // Left click on game world — also takes manual control
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

    // WASD / Arrows — movement keys (only active in manual phase)
    const bindKey = (key: string) => {
      this.k.onKeyDown(key as any,     () => { this.keys[key] = true;  });
      this.k.onKeyRelease(key as any,  () => { this.keys[key] = false; });
    };
    ["left","right","up","down","a","d","w","s"].forEach(bindKey);
  }

  /** "Continue →" from ReactUI dispatches this event to load the next zone */
  private setupNextZoneListener() {
    window.addEventListener("sv-load-zone", (e: Event) => {
      const detail = (e as CustomEvent).detail as { zoneId: string };
      if (detail?.zoneId) {
        this.loadZone(detail.zoneId);
      }
    });

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
      this.player.vel.x = (dx / dist) * MANUAL_MOVE_SPEED;
      this.verticalVel = 0;
      this.player.pos.y = GROUND_Y;

      const checkArrival = () => {
        const dx2 = targetX - this.player.pos.x;
        const dy2 = targetY - this.player.pos.y;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (dist2 < 10) {
          this.player.vel.x = 0;
          this.verticalVel = 0;
        } else if (this.player.vel.x !== 0) {
          this.k.wait(0.05, checkArrival);
        }
      };
      this.k.wait(0.05, checkArrival);
    }
  }
}
