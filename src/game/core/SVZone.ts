/* ─────────────────────────────────────────────────────────────────
   SVZone — Silicon Valley career zone renderer
   Side-scrolling perspective. Everything drawn with Kaplay shapes.
   Coordinate system:
     X: -600 → +600 (zone width 1200px)
     Ground line: y = 160
     Sky occupies: y = -300 → y = 0
     Buildings at: y = -240 → y = 140
     Workstation at: y = 80 → y = 165
───────────────────────────────────────────────────────────────── */

import type { KAPLAYCtx } from "kaplay";
import { store } from "../../store";
import {
  zonePhaseAtom,
  currentZoneIdAtom,
  isModalOpenAtom,
  modalDataAtom,
  autoWalkAtom,
} from "../../stores/gameStore";
import type { ZoneConfig, SkyPhase } from "../data/svZones";

// ── Layout constants ──────────────────────────────────────────────
export const GROUND_Y     = 160;   // Player walks at this Y
export const DESK_X       = 80;    // Workstation center X (slightly right of 0)
export const DESK_Y       = 112;   // Desk top surface Y
export const PLAYER_SPAWN_X = -480; // Left entry point
export const PORTAL_L_X   = -520;  // Left portal X
export const PORTAL_R_X   =  520;  // Right portal X
const SKY_HEIGHT = 360;            // Total sky band height

// ── Code lines that scroll on the monitor screen ──────────────────
const CODE_LINES = [
  "$ npm run dev",
  "> react-scripts start",
  "const App = () => {",
  "  return <Router>",
  "    <Switch>",
  "    </Switch>",
  "  </Router>;",
  "};",
  "const db = connect()",
  "SELECT * FROM users",
  "WHERE status = 'active'",
  "INSERT INTO logs ...",
  "> Build successful ✓",
  "> 0 errors, 0 warnings",
  "git add . && git commit",
  "git push origin main",
  "function handleRequest(",
  "  req: Request) {",
  "  const { data } = req;",
  "  return res.json(data);",
  "}",
];

// ── Sky gradient configs per phase ────────────────────────────────
type RGBTriple = [number, number, number];

const SKY_GRADIENTS: Record<SkyPhase, RGBTriple[]> = {
  dawn:   [[255,100,70], [255,150,90], [255,190,130], [180,160,210], [100,130,210], [70,110,200]],
  noon:   [[50,140,255], [70,160,255], [90,175,255],  [110,190,255], [130,200,255], [150,210,255]],
  golden: [[255,120,30], [255,100,20], [220,80,40],   [170,60,60],   [120,50,70],   [80,40,80]],
  night:  [[5,5,30],     [10,10,50],   [15,15,65],    [20,20,80],    [25,25,90],    [30,30,100]],
};

export class SVZone {
  private entities: any[] = [];   // All created entities (for cleanup)
  private monitorScreen: any = null;
  private codeLineObjs: any[] = [];
  private rgbHue = 0;

  constructor(
    private k: KAPLAYCtx,
    private config: ZoneConfig,
    // onPortal kept for API compatibility (portal proximity handled by Game.ts)
    _onPortal: (targetId: string) => void,
  ) {}

  /* ── Public API ──────────────────────────────────────────────── */

  enter() {
    this.drawSky();
    this.drawStreet();
    this.drawBuilding();
    this.drawWorkstation();
    this.drawPortals();
    this.setupSkyFollow();

    store.set(currentZoneIdAtom, this.config.id);
    store.set(zonePhaseAtom, "auto-walking");
    store.set(isModalOpenAtom, false);
  }

  /** Called by Game.ts when player arrives at desk */
  triggerSitting(player: any) {
    const isActiveAutoplaySequence = () =>
      store.get(currentZoneIdAtom) === this.config.id &&
      store.get(zonePhaseAtom) !== "manual" &&
      store.get(zonePhaseAtom) !== "paused";

    store.set(zonePhaseAtom, "arrived");

    // Snap player to desk seat position
    player.pos.x = DESK_X - 35;
    player.pos.y = GROUND_Y - 10;
    player.vel.x = 0;
    player.vel.y = 0;

    // 0.8s: seated, dim screen lights up
    this.k.wait(0.8, () => {
      if (!isActiveAutoplaySequence()) return;
      store.set(zonePhaseAtom, "sitting");
      this.lightUpMonitor();
    });

    // 1.8s: typing starts (code scrolling)
    this.k.wait(1.8, () => {
      if (!isActiveAutoplaySequence()) return;
      store.set(zonePhaseAtom, "typing");
      this.startCodeScrolling();
    });

    // 2.8s: project modal appears (if this zone has projects)
    this.k.wait(2.8, () => {
      if (!isActiveAutoplaySequence()) return;
      store.set(zonePhaseAtom, "modal");
      store.set(modalDataAtom, {
        type: "sv-projects",
        zone: this.config,
      });
      if (this.config.projects.length > 0) {
        store.set(isModalOpenAtom, true);
      } else {
        // No projects: keep the sequence running until the 5s autoplay cutoff
        store.set(isModalOpenAtom, false);
      }
    });

    // 5.0s total per experience: auto-advance in autoplay, otherwise pause for manual takeover
    this.k.wait(5, () => {
      if (!isActiveAutoplaySequence()) return;

      store.set(isModalOpenAtom, false);

      const isAutoplay = store.get(autoWalkAtom);
      if (isAutoplay && this.config.right) {
        window.dispatchEvent(
          new CustomEvent("sv-load-zone", { detail: { zoneId: this.config.right } })
        );
        return;
      }

      store.set(zonePhaseAtom, "paused");
    });
  }

  /** Player desk target X for auto-walk */
  getDeskX() { return DESK_X; }

  /** Destroy all zone entities */
  destroy() {
    this.k.destroyAll("sv-sky");
    this.k.destroyAll("sv-ground");
    this.k.destroyAll("sv-building");
    this.k.destroyAll("sv-workstation");
    this.k.destroyAll("portal");
    this.k.destroyAll("sv-code");
  }

  /* ── Sky ─────────────────────────────────────────────────────── */

  private drawSky() {
    const bands = SKY_GRADIENTS[this.config.skyPhase];
    const bandH = Math.ceil(SKY_HEIGHT / bands.length);
    const halfW = 3000; // Very wide to always fill screen during scroll

    bands.forEach((rgb, i) => {
      const e = this.k.add([
        this.k.rect(halfW * 2, bandH + 2),
        this.k.pos(0, -SKY_HEIGHT / 2 + i * bandH),
        this.k.color(...rgb),
        this.k.z(-20),
        this.k.anchor("center"),
        "sv-sky",
      ]);
      this.entities.push(e);
    });

    // Celestial bodies
    this.drawCelestialBodies();
  }

  private drawCelestialBodies() {
    const phase = this.config.skyPhase;

    if (phase === "dawn") {
      // Rising sun — lower left
      const sun = this.k.add([
        this.k.circle(55),
        this.k.pos(-300, -110),
        this.k.color(255, 210, 80),
        this.k.opacity(0.95),
        this.k.z(-18),
        "sv-sky",
      ]);
      this.entities.push(sun);
      // Glow ring around sun
      this.entities.push(this.k.add([
        this.k.circle(80),
        this.k.pos(-300, -110),
        this.k.color(255, 220, 120),
        this.k.opacity(0.25),
        this.k.z(-19),
        "sv-sky",
      ]));
    }

    if (phase === "noon") {
      // High sun — upper center
      const sun = this.k.add([
        this.k.circle(50),
        this.k.pos(0, -240),
        this.k.color(255, 240, 100),
        this.k.opacity(1),
        this.k.z(-18),
        "sv-sky",
      ]);
      this.entities.push(sun);
    }

    if (phase === "golden") {
      // Setting sun on horizon
      const sun = this.k.add([
        this.k.circle(65),
        this.k.pos(280, -20),
        this.k.color(255, 140, 40),
        this.k.opacity(0.9),
        this.k.z(-18),
        "sv-sky",
      ]);
      this.entities.push(sun);
    }

    if (phase === "night") {
      // Moon — upper right
      const moon = this.k.add([
        this.k.circle(38),
        this.k.pos(280, -240),
        this.k.color(230, 235, 255),
        this.k.opacity(0.95),
        this.k.z(-18),
        "sv-sky",
      ]);
      this.entities.push(moon);

      // Stars
      for (let i = 0; i < 35; i++) {
        const sx = (Math.random() - 0.5) * 900;
        const sy = -300 + Math.random() * 250;
        const size = 1 + Math.random() * 3;
        const star = this.k.add([
          this.k.circle(size),
          this.k.pos(sx, sy),
          this.k.color(220, 225, 255),
          this.k.opacity(0.5 + Math.random() * 0.5),
          this.k.z(-18),
          "sv-sky",
        ]);
        this.entities.push(star);
      }
    }
  }

  /** Sky follows camera X every frame so it never scrolls away */
  private setupSkyFollow() {
    this.k.onUpdate(() => {
      const cam = this.k.getCamPos();
      const skyItems = this.k.get("sv-sky");
      for (const item of skyItems) {
        item.pos.x = cam.x + (item.pos.x - cam.x) * 0 + cam.x;
        // Simplified: just keep X centered on camera
        item.pos.x = cam.x;
      }
    });
  }

  /* ── Street / Ground ─────────────────────────────────────────── */

  private drawStreet() {
    const halfW = 3000;

    // Sidewalk (light gray)
    this.entities.push(this.k.add([
      this.k.rect(halfW * 2, 120),
      this.k.pos(0, GROUND_Y + 20),
      this.k.color(180, 180, 185),
      this.k.z(-8),
      this.k.anchor("center"),
      "sv-ground",
    ]));

    // Road (darker gray strip below sidewalk)
    this.entities.push(this.k.add([
      this.k.rect(halfW * 2, 60),
      this.k.pos(0, GROUND_Y + 100),
      this.k.color(70, 70, 75),
      this.k.z(-9),
      this.k.anchor("center"),
      "sv-ground",
    ]));

    // Road center dashes (yellow, repeat every 80px)
    for (let x = -600; x <= 600; x += 80) {
      this.entities.push(this.k.add([
        this.k.rect(40, 6),
        this.k.pos(x, GROUND_Y + 100),
        this.k.color(255, 210, 50),
        this.k.z(-8),
        this.k.anchor("center"),
        "sv-ground",
      ]));
    }

    // Street lamps (every 250px)
    for (let x = -500; x <= 500; x += 250) {
      this.drawLamp(x);
    }
  }

  private drawLamp(x: number) {
    // Pole
    this.entities.push(this.k.add([
      this.k.rect(6, 100),
      this.k.pos(x, GROUND_Y - 20),
      this.k.color(80, 80, 90),
      this.k.z(-4),
      this.k.anchor("bot"),
      "sv-ground",
    ]));
    // Lamp head
    this.entities.push(this.k.add([
      this.k.circle(10),
      this.k.pos(x, GROUND_Y - 115),
      this.k.color(255, 230, 160),
      this.k.opacity(0.9),
      this.k.z(-4),
      this.k.anchor("center"),
      "sv-ground",
    ]));
    // Night-time glow
    if (this.config.skyPhase === "night") {
      this.entities.push(this.k.add([
        this.k.circle(28),
        this.k.pos(x, GROUND_Y - 115),
        this.k.color(255, 220, 120),
        this.k.opacity(0.18),
        this.k.z(-5),
        this.k.anchor("center"),
        "sv-ground",
      ]));
    }
  }

  /* ── Tech Building (background silhouette) ───────────────────── */

  private drawBuilding() {
    switch (this.config.workLevel) {
      case 1: this.drawITShop(); break;
      case 2: this.drawStartupHQ(); break;
      case 3: this.drawHooliHQ(); break;
      case 4: this.drawTechCenter(); break;
    }
  }

  private drawITShop() {
    const bx = -60, by = -20;
    // Main brick body
    this.entities.push(this.k.add([
      this.k.rect(300, 220),
      this.k.pos(bx, by),
      this.k.color(160, 90, 60),
      this.k.z(-6),
      this.k.anchor("bot"),
      "sv-building",
    ]));
    // Roof overhang
    this.entities.push(this.k.add([
      this.k.rect(320, 20),
      this.k.pos(bx, by - 220),
      this.k.color(130, 70, 40),
      this.k.z(-5),
      this.k.anchor("bot"),
      "sv-building",
    ]));
    // Windows (2)
    [-70, 60].forEach(wx => {
      this.entities.push(this.k.add([
        this.k.rect(50, 50),
        this.k.pos(bx + wx, by - 110),
        this.k.color(160, 210, 240),
        this.k.z(-5),
        this.k.anchor("center"),
        "sv-building",
      ]));
    });
    // Door
    this.entities.push(this.k.add([
      this.k.rect(40, 70),
      this.k.pos(bx, by - 35),
      this.k.color(80, 50, 30),
      this.k.z(-5),
      this.k.anchor("bot"),
      "sv-building",
    ]));
    // Sign
    this.entities.push(this.k.add([
      this.k.text("IT SUPPORT", { size: 12, font: "IBM Plex Sans" }),
      this.k.pos(bx, by - 235),
      this.k.color(255, 230, 100),
      this.k.z(-4),
      this.k.anchor("center"),
      "sv-building",
    ]));
  }

  private drawStartupHQ() {
    const bx = -80, by = -20;
    // Modern glass building (taller)
    this.entities.push(this.k.add([
      this.k.rect(380, 300),
      this.k.pos(bx, by),
      this.k.color(100, 120, 140),
      this.k.z(-6),
      this.k.anchor("bot"),
      "sv-building",
    ]));
    // Glass lobby at ground floor
    this.entities.push(this.k.add([
      this.k.rect(380, 70),
      this.k.pos(bx, by),
      this.k.color(150, 200, 240),
      this.k.opacity(0.7),
      this.k.z(-5),
      this.k.anchor("bot"),
      "sv-building",
    ]));
    // Window rows (3 floors × 4 windows)
    for (let floor = 0; floor < 3; floor++) {
      for (let col = 0; col < 4; col++) {
        this.entities.push(this.k.add([
          this.k.rect(50, 40),
          this.k.pos(bx - 135 + col * 90, by - 110 - floor * 70),
          this.k.color(180, 220, 250),
          this.k.opacity(0.8),
          this.k.z(-5),
          this.k.anchor("center"),
          "sv-building",
        ]));
      }
    }
    // Horizontal floor dividers
    for (let f = 1; f < 3; f++) {
      this.entities.push(this.k.add([
        this.k.rect(382, 5),
        this.k.pos(bx, by - 70 - f * 70),
        this.k.color(80, 100, 120),
        this.k.z(-5),
        this.k.anchor("center"),
        "sv-building",
      ]));
    }
    // Sign
    this.entities.push(this.k.add([
      this.k.text("STARTUP HQ", { size: 13, font: "IBM Plex Sans" }),
      this.k.pos(bx, by - 315),
      this.k.color(100, 200, 255),
      this.k.z(-4),
      this.k.anchor("center"),
      "sv-building",
    ]));
  }

  private drawHooliHQ() {
    const bx = -50, by = -20;
    // Corporate tower — tall, dark, serious
    this.entities.push(this.k.add([
      this.k.rect(360, 380),
      this.k.pos(bx, by),
      this.k.color(55, 65, 80),
      this.k.z(-6),
      this.k.anchor("bot"),
      "sv-building",
    ]));
    // Lighter top section (penthouse)
    this.entities.push(this.k.add([
      this.k.rect(360, 80),
      this.k.pos(bx, by - 380),
      this.k.color(70, 85, 105),
      this.k.z(-5),
      this.k.anchor("bot"),
      "sv-building",
    ]));
    // Uniform windows (5 floors × 5 windows)
    for (let floor = 0; floor < 5; floor++) {
      for (let col = 0; col < 5; col++) {
        const lit = Math.random() > 0.3;
        this.entities.push(this.k.add([
          this.k.rect(38, 28),
          this.k.pos(bx - 140 + col * 70, by - 70 - floor * 58),
          this.k.color(lit ? 200 : 60, lit ? 230 : 70, lit ? 255 : 90),
          this.k.opacity(lit ? 0.7 : 0.3),
          this.k.z(-5),
          this.k.anchor("center"),
          "sv-building",
        ]));
      }
    }
    // Sign
    this.entities.push(this.k.add([
      this.k.text("HOOLI HQ", { size: 15, font: "IBM Plex Sans" }),
      this.k.pos(bx, by - 470),
      this.k.color(255, 255, 255),
      this.k.z(-4),
      this.k.anchor("center"),
      "sv-building",
    ]));
  }

  private drawTechCenter() {
    const bx = -30, by = -20;
    // Grand government building (wide)
    this.entities.push(this.k.add([
      this.k.rect(500, 340),
      this.k.pos(bx, by),
      this.k.color(200, 195, 185),
      this.k.z(-6),
      this.k.anchor("bot"),
      "sv-building",
    ]));
    // Dome roof
    this.entities.push(this.k.add([
      this.k.circle(90),
      this.k.pos(bx, by - 340),
      this.k.color(180, 175, 165),
      this.k.z(-6),
      this.k.anchor("center"),
      "sv-building",
    ]));
    // Columns at entrance (5 columns)
    for (let c = -2; c <= 2; c++) {
      this.entities.push(this.k.add([
        this.k.rect(16, 160),
        this.k.pos(bx + c * 45, by),
        this.k.color(215, 210, 200),
        this.k.z(-5),
        this.k.anchor("bot"),
        "sv-building",
      ]));
    }
    // Lit windows (warm yellow at night)
    const winColor: [number, number, number] =
      this.config.skyPhase === "night" ? [255, 220, 120] : [180, 220, 255];
    for (let floor = 0; floor < 4; floor++) {
      for (let col = 0; col < 6; col++) {
        this.entities.push(this.k.add([
          this.k.rect(42, 32),
          this.k.pos(bx - 165 + col * 66, by - 90 - floor * 60),
          this.k.color(...winColor),
          this.k.opacity(0.8),
          this.k.z(-5),
          this.k.anchor("center"),
          "sv-building",
        ]));
      }
    }
    // Light beams (night only)
    if (this.config.skyPhase === "night") {
      [-100, 0, 100].forEach(lx => {
        this.entities.push(this.k.add([
          this.k.rect(6, 250),
          this.k.pos(bx + lx, by - 420),
          this.k.color(255, 240, 180),
          this.k.opacity(0.12),
          this.k.z(-7),
          this.k.anchor("bot"),
          "sv-building",
        ]));
      });
    }
    // Sign
    this.entities.push(this.k.add([
      this.k.text("PROVINCIAL TECH CENTER", { size: 11, font: "IBM Plex Sans" }),
      this.k.pos(bx, by - 440),
      this.k.color(255, 220, 100),
      this.k.z(-4),
      this.k.anchor("center"),
      "sv-building",
    ]));
  }

  /* ── Workstation (4 levels) ──────────────────────────────────── */

  private drawWorkstation() {
    switch (this.config.workLevel) {
      case 1: this.drawWorkLevel1(); break;
      case 2: this.drawWorkLevel2(); break;
      case 3: this.drawWorkLevel3(); break;
      case 4: this.drawWorkLevel4(); break;
    }
  }

  // ── Level 1: IT Support — Folding table + CRT ─────────────────

  private drawWorkLevel1() {
    const dx = DESK_X, dy = DESK_Y;

    // Folding table (beige, flimsy)
    this.add_ws(this.k.rect(200, 14), dx, dy, [210, 195, 165]); // surface
    this.add_ws(this.k.rect(6, 55), dx - 90, dy + 14, [160, 150, 130]); // left leg
    this.add_ws(this.k.rect(6, 55), dx + 90, dy + 14, [160, 150, 130]); // right leg

    // Chair: simple plastic folding
    this.add_ws(this.k.rect(50, 10), dx - 50, dy + 30, [140, 140, 145]); // seat
    this.add_ws(this.k.rect(5, 28), dx - 70, dy + 40, [120, 120, 125]); // left leg
    this.add_ws(this.k.rect(5, 28), dx - 30, dy + 40, [120, 120, 125]); // right leg
    this.add_ws(this.k.rect(50, 4), dx - 50, dy + 20, [140, 140, 145]);  // back top

    // CRT monitor
    this.add_ws(this.k.rect(80, 65), dx + 10, dy - 55, [180, 180, 175]); // outer body
    this.add_ws(this.k.rect(60, 46), dx + 10, dy - 56, [30, 60, 30]);    // green screen
    this.add_ws(this.k.rect(10, 22), dx + 10, dy - 12, [160, 160, 155]); // neck
    this.add_ws(this.k.rect(60, 8), dx + 10, dy - 4, [160, 160, 155]);   // base

    // Beige PC tower
    this.add_ws(this.k.rect(30, 72), dx + 105, dy - 28, [200, 195, 175]); // case
    this.add_ws(this.k.circle(4), dx + 105, dy - 20, [180, 175, 155]);    // button
    this.add_ws(this.k.circle(3), dx + 105, dy - 10, [180, 175, 155]);    // LED

    // Keyboard
    this.add_ws(this.k.rect(70, 8), dx - 10, dy + 2, [195, 185, 160]);

    // Cursor blink on CRT
    this.monitorScreen = this.add_ws(this.k.rect(4, 8), dx - 15, dy - 56, [80, 200, 80]);
    this.setupCursorBlink();
  }

  // ── Level 2: Project Dev — Mesh chair + flat monitor ─────────

  private drawWorkLevel2() {
    const dx = DESK_X, dy = DESK_Y;

    // Wooden desk
    this.add_ws(this.k.rect(240, 16), dx, dy, [140, 90, 50]);      // surface
    this.add_ws(this.k.rect(10, 60), dx - 110, dy + 16, [100, 65, 35]); // L-leg
    this.add_ws(this.k.rect(10, 60), dx + 110, dy + 16, [100, 65, 35]); // R-leg

    // Mesh office chair (darker)
    this.add_ws(this.k.rect(60, 12), dx - 55, dy + 28, [50, 60, 80]);   // seat
    this.add_ws(this.k.rect(50, 55), dx - 55, dy - 22, [45, 55, 75]);   // back
    this.add_ws(this.k.rect(6, 30), dx - 75, dy + 40, [40, 50, 65]);    // L-leg
    this.add_ws(this.k.rect(6, 30), dx - 35, dy + 40, [40, 50, 65]);    // R-leg
    // Armrests
    this.add_ws(this.k.rect(6, 20), dx - 78, dy + 16, [55, 65, 85]);
    this.add_ws(this.k.rect(6, 20), dx - 32, dy + 16, [55, 65, 85]);

    // Flat 22" monitor
    this.add_ws(this.k.rect(110, 4), dx + 20, dy - 85, [30, 30, 30]);   // top bezel
    this.add_ws(this.k.rect(110, 70), dx + 20, dy - 52, [25, 25, 25]);  // outer
    this.add_ws(this.k.rect(96, 58), dx + 20, dy - 52, [15, 15, 15]);   // screen dark
    this.add_ws(this.k.rect(8, 22), dx + 20, dy - 8, [35, 35, 35]);     // stand neck
    this.add_ws(this.k.rect(48, 7), dx + 20, dy - 1, [35, 35, 35]);     // base

    // Laptop (partially open on desk left)
    this.add_ws(this.k.rect(88, 8), dx - 60, dy + 2, [55, 55, 60]);     // base
    this.add_ws(this.k.rect(82, 52), dx - 60, dy - 30, [50, 50, 55]);   // screen
    this.add_ws(this.k.rect(72, 42), dx - 60, dy - 30, [25, 25, 28]);   // screen content

    // Keyboard
    this.add_ws(this.k.rect(90, 9), dx + 10, dy + 3, [40, 40, 44]);

    this.monitorScreen = this.add_ws(this.k.rect(96, 58), dx + 20, dy - 52, [10, 40, 80]);
  }

  // ── Level 3: Hooli QA — Ergonomic chair + dual monitors ──────

  private drawWorkLevel3() {
    const dx = DESK_X, dy = DESK_Y;

    // White L-shaped desk
    this.add_ws(this.k.rect(300, 16), dx - 30, dy, [240, 240, 242]);      // main surface
    this.add_ws(this.k.rect(130, 16), dx + 115, dy + 40, [240, 240, 242]); // side return
    this.add_ws(this.k.rect(10, 62), dx - 175, dy + 16, [200, 200, 202]);  // legs
    this.add_ws(this.k.rect(10, 62), dx + 115, dy + 16, [200, 200, 202]);
    this.add_ws(this.k.rect(10, 40), dx + 175, dy + 56, [200, 200, 202]);

    // Ergonomic chair (Herman Miller style)
    this.add_ws(this.k.rect(70, 12), dx - 60, dy + 28, [60, 75, 90]);      // seat
    this.add_ws(this.k.rect(58, 70), dx - 60, dy - 36, [55, 70, 85]);      // back
    this.add_ws(this.k.rect(58, 12), dx - 60, dy - 110, [65, 80, 95]);     // headrest
    this.add_ws(this.k.rect(8, 32), dx - 82, dy + 16, [65, 80, 95]);       // L-armrest
    this.add_ws(this.k.rect(20, 6), dx - 82, dy + 10, [65, 80, 95]);
    this.add_ws(this.k.rect(8, 32), dx - 38, dy + 16, [65, 80, 95]);       // R-armrest
    this.add_ws(this.k.rect(20, 6), dx - 38, dy + 10, [65, 80, 95]);
    this.add_ws(this.k.rect(6, 30), dx - 75, dy + 40, [50, 60, 75]);       // legs
    this.add_ws(this.k.rect(6, 30), dx - 45, dy + 40, [50, 60, 75]);

    // Monitor arm (center pole)
    this.add_ws(this.k.rect(8, 80), dx, dy - 52, [80, 80, 85]);

    // Left monitor
    this.add_ws(this.k.rect(96, 70), dx - 75, dy - 60, [20, 20, 22]);
    this.add_ws(this.k.rect(84, 58), dx - 75, dy - 60, [15, 15, 18]);
    this.monitorScreen = this.add_ws(this.k.rect(84, 58), dx - 75, dy - 60, [0, 20, 60]);

    // Right monitor
    this.add_ws(this.k.rect(96, 70), dx + 75, dy - 60, [20, 20, 22]);
    this.add_ws(this.k.rect(84, 58), dx + 75, dy - 60, [15, 15, 18]);
    this.add_ws(this.k.rect(84, 58), dx + 75, dy - 60, [0, 20, 60]);

    // Keyboard + mouse
    this.add_ws(this.k.rect(95, 9), dx - 15, dy + 3, [30, 30, 32]);
    this.add_ws(this.k.circle(7), dx + 65, dy + 4, [40, 40, 44]);
  }

  // ── Level 4: Provincial Gov — Gaming + RGB + triple monitors ─

  private drawWorkLevel4() {
    const dx = DESK_X, dy = DESK_Y;

    // Wide black gaming desk
    this.add_ws(this.k.rect(380, 18), dx, dy, [22, 22, 28]);
    this.add_ws(this.k.rect(12, 65), dx - 180, dy + 18, [18, 18, 24]);
    this.add_ws(this.k.rect(12, 65), dx + 180, dy + 18, [18, 18, 24]);
    // Steel crossbar
    this.add_ws(this.k.rect(356, 8), dx, dy + 60, [30, 30, 36]);

    // RGB desk edge strip (animated via loop below)
    const rgbStrip = this.add_ws(this.k.rect(380, 5), dx, dy + 18, [255, 0, 128]);
    this.setupRGBStrip(rgbStrip);

    // Gaming chair
    this.add_ws(this.k.rect(90, 14), dx - 55, dy + 30, [25, 25, 32]);    // seat
    this.add_ws(this.k.rect(75, 85), dx - 55, dy - 50, [22, 22, 28]);    // back
    this.add_ws(this.k.rect(75, 16), dx - 55, dy - 130, [28, 28, 35]);   // headrest

    // Red accent strips on chair
    this.add_ws(this.k.rect(6, 85), dx - 90, dy - 50, [200, 20, 40]);
    this.add_ws(this.k.rect(6, 85), dx - 20, dy - 50, [200, 20, 40]);

    // Chair legs
    this.add_ws(this.k.rect(8, 36), dx - 80, dy + 44, [35, 35, 40]);
    this.add_ws(this.k.rect(8, 36), dx - 30, dy + 44, [35, 35, 40]);

    // PC tower (tempered glass side, RGB)
    const pcX = dx + 220, pcY = dy - 40;
    this.add_ws(this.k.rect(50, 100), pcX, pcY, [18, 18, 24]);            // case
    this.add_ws(this.k.rect(44, 94), pcX, pcY, [8, 12, 18]);              // glass panel
    const rgbFan = this.add_ws(this.k.circle(18), pcX, pcY - 10, [0, 200, 255]); // RGB fan
    this.setupRGBStrip(rgbFan);
    this.add_ws(this.k.circle(5), pcX, pcY - 10, [255, 255, 255]);        // fan center

    // RGB underglow under desk
    const underglow = this.add_ws(this.k.rect(380, 6), dx, dy + 78, [0, 100, 255]);
    this.setupRGBStrip(underglow);

    // Monitor arm
    this.add_ws(this.k.rect(10, 90), dx, dy - 58, [30, 30, 36]);

    // Left monitor (smaller, angled look)
    this.add_ws(this.k.rect(90, 68), dx - 130, dy - 62, [15, 15, 20]);
    this.add_ws(this.k.rect(78, 56), dx - 130, dy - 62, [10, 10, 16]);
    this.monitorScreen = this.add_ws(this.k.rect(78, 56), dx - 130, dy - 62, [0, 15, 50]);

    // Center monitor (largest)
    this.add_ws(this.k.rect(140, 90), dx, dy - 70, [12, 12, 18]);
    this.add_ws(this.k.rect(126, 76), dx, dy - 70, [8, 8, 14]);
    this.add_ws(this.k.rect(126, 76), dx, dy - 70, [0, 15, 50]);

    // Right monitor
    this.add_ws(this.k.rect(90, 68), dx + 130, dy - 62, [15, 15, 20]);
    this.add_ws(this.k.rect(78, 56), dx + 130, dy - 62, [10, 10, 16]);
    this.add_ws(this.k.rect(78, 56), dx + 130, dy - 62, [0, 15, 50]);

    // Keyboard + peripherals
    this.add_ws(this.k.rect(110, 9), dx, dy + 4, [25, 25, 30]);
    this.add_ws(this.k.circle(8), dx + 85, dy + 5, [30, 30, 36]);
  }

  /** Animate RGB color cycling (hue shifts every frame) */
  private setupRGBStrip(entity: any) {
    this.k.onUpdate(() => {
      this.rgbHue = (this.rgbHue + 1) % 360;
      const [r, g, b] = hsvToRgb(this.rgbHue / 360, 1, 1);
      if (entity?.exists()) {
        entity.color.r = r;
        entity.color.g = g;
        entity.color.b = b;
      }
    });
  }

  /** CRT cursor blink */
  private setupCursorBlink() {
    let visible = true;
    this.k.loop(0.6, () => {
      visible = !visible;
      if (this.monitorScreen?.exists()) {
        this.monitorScreen.opacity = visible ? 1 : 0;
      }
    });
  }

  /* ── Monitor Code Display ─────────────────────────────────────── */

  private lightUpMonitor() {
    if (!this.monitorScreen?.exists()) return;
    const litColors: Record<number, [number,number,number]> = {
      1: [20, 60, 20],
      2: [0, 40, 100],
      3: [0, 40, 100],
      4: [0, 40, 120],
    };
    const [r, g, b] = litColors[this.config.workLevel];
    this.monitorScreen.color.r = r;
    this.monitorScreen.color.g = g;
    this.monitorScreen.color.b = b;
    this.monitorScreen.opacity = 1;
  }

  private startCodeScrolling() {
    const dx = DESK_X, dy = DESK_Y;

    // Determine monitor position based on work level
    const screenX = this.config.workLevel === 1 ? dx + 10 :
                    this.config.workLevel === 2 ? dx + 20 :
                    this.config.workLevel === 3 ? dx - 75 : dx - 130;
    const screenY = this.config.workLevel === 1 ? dy - 56 :
                    this.config.workLevel === 2 ? dy - 52 :
                    this.config.workLevel === 3 ? dy - 60 : dy - 62;
    const screenH = this.config.workLevel === 1 ? 46 : 58;

    // Create code text lines (max 4 visible at once)
    const numLines = 4;
    const lineH = screenH / numLines;
    for (let i = 0; i < numLines; i++) {
      const codeObj = this.k.add([
        this.k.text("", { size: 5, font: "IBM Plex Sans" }),
        this.k.pos(screenX - 28, screenY - screenH / 2 + 6 + i * lineH),
        this.k.color(80, 220, 80),
        this.k.z(49),
        "sv-code",
      ]);
      this.codeLineObjs.push(codeObj);
    }

    // Scroll code lines every 350ms
    let tick = 0;
    this.k.loop(0.35, () => {
      for (let i = 0; i < numLines; i++) {
        const lineIdx = (tick + i) % CODE_LINES.length;
        if (this.codeLineObjs[i]?.exists()) {
          this.codeLineObjs[i].text = CODE_LINES[lineIdx];
        }
      }
      tick++;
    });
  }

  /* ── Portals (linear left/right) ─────────────────────────────── */

  private drawPortals() {
    if (this.config.left) this.drawPortal(PORTAL_L_X, "← " + this.config.left.replace("zone","Zone "), this.config.left);
    if (this.config.right) this.drawPortal(PORTAL_R_X, this.config.right.replace("zone","Zone ") + " →", this.config.right);
  }

  private drawPortal(x: number, label: string, targetId: string) {
    const portalColors: Record<string, [number,number,number]> = {
      zone1: [100, 120, 255],
      zone2: [80, 200, 120],
      zone3: [255, 180, 50],
      zone4: [200, 80, 255],
    };
    const [r, g, b] = portalColors[targetId] ?? [180, 80, 255];

    // Outer ring
    const ring = this.k.add([
      this.k.circle(28),
      this.k.pos(x, GROUND_Y - 80),
      this.k.color(r, g, b),
      this.k.opacity(0.3),
      this.k.z(20),
      this.k.anchor("center"),
      "portal",
      { target: targetId },
    ]);

    // Inner glow
    const inner = this.k.add([
      this.k.circle(14),
      this.k.pos(x, GROUND_Y - 80),
      this.k.color(r, g, b),
      this.k.opacity(0.85),
      this.k.z(21),
      this.k.anchor("center"),
      "portal",
      { target: targetId },
    ]);

    // Portal float animation
    const baseY = GROUND_Y - 80;
    ring.onUpdate(() => {
      ring.pos.y = baseY + Math.sin(this.k.time() * 2.2) * 8;
      ring.opacity = 0.2 + Math.abs(Math.sin(this.k.time() * 1.5)) * 0.3;
      inner.pos.y = ring.pos.y;
      inner.opacity = 0.7 + Math.sin(this.k.time() * 2.5) * 0.15;
    });

    // Label
    this.k.add([
      this.k.text(label, { size: 10, font: "IBM Plex Sans" }),
      this.k.pos(x, GROUND_Y - 120),
      this.k.color(r, g, b),
      this.k.z(22),
      this.k.anchor("center"),
      "portal",
      { target: targetId },
    ]);
  }

  /* ── Helpers ─────────────────────────────────────────────────── */

  /** Shorthand: add a workstation entity (z: 30, anchor: center, sv-workstation tag) */
  private add_ws(shape: any, x: number, y: number, rgb: [number,number,number], z = 30): any {
    const e = this.k.add([
      shape,
      this.k.pos(x, y),
      this.k.color(...rgb),
      this.k.z(z),
      this.k.anchor("center"),
      "sv-workstation",
    ]);
    this.entities.push(e);
    return e;
  }
}

/* ── HSV → RGB helper (for RGB animation) ─────────────────────── */
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const table: [number, number, number][] = [
    [v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q],
  ];
  const [r, g, b] = table[i % 6];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
