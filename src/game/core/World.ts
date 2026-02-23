import type { KAPLAYCtx } from "kaplay";

export interface WorldConfig {
  name: string;
  theme: "town" | "forest" | "frozen" | "mountain" | "throne";
  groundColor: [number, number, number];
  groundColor2: [number, number, number];
  pathColor: [number, number, number];
  size: number;
  buildings: BuildingConfig[];
  creeps: CreepConfig[];
  portals: PortalConfig[];
}

export interface BuildingConfig {
  id: string;
  type: "tower" | "obelisk" | "shrine" | "castle";
  x: number;
  y: number;
  data: any;
}

export interface CreepConfig {
  id: string;
  type: "kobold" | "golem" | "dragon";
  x: number;
  y: number;
  hp: number;
  reward: string;
}

export interface PortalConfig {
  targetWorld: string;
  x: number;
  y: number;
  label: string;
}

// Warcraft-style building → sprite mapping
const BUILDING_SPRITES: Record<string, string> = {
  shrine:  "bld-shrine",   // academy.png  64×64
  tower:   "bld-tower",    // castle_hum.png 64×64
  obelisk: "bld-obelisk",  // barracks_hum.png 48×48
  castle:  "bld-castle",   // castle_ork.png 64×64
};

// Building base pixel sizes (before scale)
const BUILDING_SIZES: Record<string, [number, number]> = {
  shrine:  [64, 64],
  tower:   [64, 64],
  obelisk: [48, 48],
  castle:  [64, 64],
};

// Creep type → troop sprite mapping
const CREEP_SPRITES: Record<string, string> = {
  kobold: "troop-skeleton",
  golem:  "troop-trooper",
  dragon: "troop-grunt",
};

export class World {
  protected k: KAPLAYCtx;
  protected config: WorldConfig;
  protected entities: any[] = [];
  protected onInteractCallback: (type: string, data: any) => void;

  constructor(k: KAPLAYCtx, config: WorldConfig, onInteract: (type: string, data: any) => void) {
    this.k = k;
    this.config = config;
    this.onInteractCallback = onInteract;
  }

  enter() {
    this.clear();
    this.createGround();
    this.createPaths();
    this.spawnBuildings();
    this.spawnCreeps();
    this.spawnPortals();
    this.createAmbientEffects();
  }

  clear() {
    this.entities.forEach(e => e.destroy?.());
    this.entities = [];
    this.k.destroyAll("world");
  }

  protected createGround() {
    const { size, groundColor, groundColor2 } = this.config;
    const tileSize = 64;

    for (let x = -size; x <= size; x += tileSize) {
      for (let y = -size; y <= size; y += tileSize) {
        const isAlt = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
        const c = isAlt ? groundColor : groundColor2;
        const tile = this.k.add([
          this.k.rect(tileSize, tileSize),
          this.k.pos(x, y),
          this.k.color(c[0], c[1], c[2]),
          this.k.z(0),
          "world",
        ]);
        this.entities.push(tile);
      }
    }
  }

  protected createPaths() {
    const { pathColor, size } = this.config;
    const pathWidth = 52;
    const pathLength = size * 2 + 200;

    const hPath = this.k.add([
      this.k.rect(pathLength, pathWidth),
      this.k.pos(0, 0),
      this.k.anchor("center"),
      this.k.color(pathColor[0], pathColor[1], pathColor[2]),
      this.k.z(1),
      "world",
    ]);
    this.entities.push(hPath);

    const vPath = this.k.add([
      this.k.rect(pathWidth, pathLength),
      this.k.pos(0, 0),
      this.k.anchor("center"),
      this.k.color(pathColor[0], pathColor[1], pathColor[2]),
      this.k.z(1),
      "world",
    ]);
    this.entities.push(vPath);

    // Path edge lines (slightly darker)
    const edgeColor: [number, number, number] = [
      Math.max(0, pathColor[0] - 15),
      Math.max(0, pathColor[1] - 15),
      Math.max(0, pathColor[2] - 15),
    ];
    for (const offset of [-(pathWidth / 2), (pathWidth / 2) - 3]) {
      const hEdge = this.k.add([
        this.k.rect(pathLength, 3),
        this.k.pos(0, offset),
        this.k.anchor("center"),
        this.k.color(edgeColor[0], edgeColor[1], edgeColor[2]),
        this.k.z(2),
        "world",
      ]);
      const vEdge = this.k.add([
        this.k.rect(3, pathLength),
        this.k.pos(offset, 0),
        this.k.anchor("center"),
        this.k.color(edgeColor[0], edgeColor[1], edgeColor[2]),
        this.k.z(2),
        "world",
      ]);
      this.entities.push(hEdge, vEdge);
    }
  }

  protected spawnBuildings() {
    for (const building of this.config.buildings) {
      this.spawnBuilding(building);
    }
  }

  protected spawnBuilding(config: BuildingConfig) {
    const spriteName = BUILDING_SPRITES[config.type] || "bld-shrine";
    const [_bw, bh] = BUILDING_SIZES[config.type] || [64, 64];
    const buildingScale = 2;
    const scaledH = bh * buildingScale;
    const labelY = config.y - scaledH / 2 - 14;

    const building = this.k.add([
      this.k.sprite(spriteName),
      this.k.scale(buildingScale),
      this.k.pos(config.x, config.y),
      this.k.anchor("center"),
      this.k.area(),
      this.k.z(10),
      "building",
      { id: config.id, data: config.data, type: config.type },
    ]);

    // Gold title label
    const label = this.k.add([
      this.k.text(config.data.title, { size: 12, font: "IBM Plex Sans" }),
      this.k.pos(config.x, labelY),
      this.k.anchor("center"),
      this.k.color(255, 215, 0),
      this.k.z(11),
      "world",
    ]);

    // "[ E ]" interact hint — shown on hover
    const hint = this.k.add([
      this.k.text("[ E ]", { size: 9, font: "IBM Plex Sans" }),
      this.k.pos(config.x, config.y + scaledH / 2 + 10),
      this.k.anchor("center"),
      this.k.color(180, 180, 180),
      this.k.opacity(0),
      this.k.z(11),
      "world",
    ]);

    building.onHover(() => {
      building.use(this.k.scale(buildingScale * 1.06));
      hint.use(this.k.opacity(1));
    });
    building.onHoverEnd(() => {
      building.use(this.k.scale(buildingScale));
      hint.use(this.k.opacity(0));
    });
    building.onClick(() => this.onInteractCallback("building", config.data));

    this.entities.push(building, label, hint);

    // Add bonfire torches flanking shrines and castles
    if (config.type === "shrine" || config.type === "castle") {
      this.spawnBonfires(config.x, config.y, scaledH);
    }

    return building;
  }

  private spawnBonfires(x: number, y: number, buildingH: number) {
    const offsets: [number, number][] = [[-50, buildingH / 2 - 10], [50, buildingH / 2 - 10]];
    for (const [dx, dy] of offsets) {
      const fire = this.k.add([
        this.k.sprite("bonfire", { anim: "burn" }),
        this.k.scale(2.5),
        this.k.pos(x + dx, y + dy),
        this.k.anchor("center"),
        this.k.z(9),
        "world",
      ]);
      this.entities.push(fire);
    }
  }

  protected spawnCreeps() {
    for (const creep of this.config.creeps) {
      this.spawnCreep(creep);
    }
  }

  protected spawnCreep(config: CreepConfig) {
    const spriteName = CREEP_SPRITES[config.type] || "troop-skeleton";
    const creepScale = 1.5;
    const spriteH = 32 * creepScale;

    const creep = this.k.add([
      this.k.sprite(spriteName, { anim: "walk-east" }),
      this.k.scale(creepScale),
      this.k.pos(config.x, config.y),
      this.k.anchor("center"),
      this.k.area(),
      this.k.z(15),
      "creep",
      {
        id: config.id,
        type: config.type,
        maxHp: config.hp,
        hp: config.hp,
        reward: config.reward,
      },
    ]);

    // HP bar background
    const hpBg = this.k.add([
      this.k.rect(40, 5),
      this.k.pos(config.x - 20, config.y - spriteH - 8),
      this.k.color(60, 0, 0),
      this.k.z(16),
      "world",
    ]);

    // HP bar fill (green)
    const hpFill = this.k.add([
      this.k.rect(40, 5),
      this.k.pos(config.x - 20, config.y - spriteH - 8),
      this.k.color(50, 200, 50),
      this.k.z(17),
      "world",
    ]);

    let direction = 1;
    this.k.loop(2 + Math.random(), () => {
      direction *= -1;
    });

    creep.onUpdate(() => {
      creep.move(28 * direction, 0);

      // Animate walk direction
      const anim = direction > 0 ? "walk-east" : "walk-west";
      if (creep.getCurAnim()?.name !== anim) creep.play(anim);

      // HP bars follow creep
      const barY = creep.pos.y - spriteH - 8;
      hpBg.pos.x = creep.pos.x - 20;
      hpBg.pos.y = barY;
      hpFill.pos.x = creep.pos.x - 20;
      hpFill.pos.y = barY;

      // Update HP bar width
      const hpRatio = (creep as any).hp / (creep as any).maxHp;
      hpFill.width = 40 * Math.max(0, hpRatio);
    });

    creep.onClick(() => this.onInteractCallback("creep", { id: config.id, data: config }));

    this.entities.push(creep, hpBg, hpFill);
    return creep;
  }

  protected spawnPortals() {
    for (const portal of this.config.portals) {
      this.spawnPortal(portal);
    }
  }

  protected spawnPortal(config: PortalConfig) {
    const portalScale = 2.5;

    const portal = this.k.add([
      this.k.sprite("wisp", { anim: "float" }),
      this.k.scale(portalScale),
      this.k.pos(config.x, config.y),
      this.k.anchor("center"),
      this.k.area(),
      this.k.z(20),
      "portal",
      { target: config.targetWorld },
    ]);

    const baseY = config.y;
    portal.onUpdate(() => {
      portal.pos.y = baseY + Math.sin(this.k.time() * 2.2) * 5;
      // Cycle between float and glow animations
      const t = Math.floor(this.k.time() * 0.5) % 2;
      const targetAnim = t === 0 ? "float" : "glow";
      if (portal.getCurAnim()?.name !== targetAnim) portal.play(targetAnim);
    });

    // Portal ring glow (decorative outer circle)
    const ring = this.k.add([
      this.k.circle(30),
      this.k.pos(config.x, config.y),
      this.k.anchor("center"),
      this.k.color(140, 80, 255),
      this.k.opacity(0.25),
      this.k.z(19),
      "world",
    ]);

    ring.onUpdate(() => {
      ring.pos.y = baseY + Math.sin(this.k.time() * 2.2) * 5;
      ring.use(this.k.opacity(0.15 + Math.sin(this.k.time() * 3) * 0.1));
    });

    // Destination label
    const label = this.k.add([
      this.k.text(`⬥ ${config.label}`, { size: 10, font: "IBM Plex Sans" }),
      this.k.pos(config.x, config.y - 55),
      this.k.anchor("center"),
      this.k.color(190, 140, 255),
      this.k.z(21),
      "world",
    ]);

    portal.onClick(() => this.onInteractCallback("portal", { target: config.targetWorld }));

    this.entities.push(portal, ring, label);
    return portal;
  }

  protected createAmbientEffects() {
    const { theme, size } = this.config;
    this.addBorderTrees();

    if (theme === "forest") {
      for (let i = 0; i < 18; i++) {
        const phase = Math.random() * Math.PI * 2;
        const bx = this.k.rand(-size * 0.75, size * 0.75);
        const by = this.k.rand(-size * 0.75, size * 0.75);

        const fly = this.k.add([
          this.k.circle(2),
          this.k.pos(bx, by),
          this.k.color(180, 255, 80),
          this.k.opacity(0.8),
          this.k.z(5),
          "world",
        ]);
        fly.onUpdate(() => {
          const t = this.k.time() + phase;
          fly.pos.x = bx + Math.sin(t * 0.8) * 25;
          fly.pos.y = by + Math.cos(t * 0.6) * 18;
          fly.use(this.k.opacity(0.3 + Math.abs(Math.sin(t * 1.8)) * 0.7));
        });
        this.entities.push(fly);
      }
    }

    if (theme === "frozen") {
      for (let i = 0; i < 25; i++) {
        const sx = this.k.rand(-size, size);
        const sy = this.k.rand(-size, size);
        const speed = 15 + Math.random() * 25;

        const flake = this.k.add([
          this.k.circle(1 + Math.random()),
          this.k.pos(sx, sy),
          this.k.color(190, 215, 255),
          this.k.opacity(0.5),
          this.k.z(5),
          "world",
        ]);
        flake.onUpdate(() => {
          flake.pos.y += speed * this.k.dt();
          flake.pos.x += Math.sin(this.k.time() * 0.4 + sx * 0.02) * 8 * this.k.dt();
          if (flake.pos.y > size) flake.pos.y = -size;
        });
        this.entities.push(flake);
      }
    }

    if (theme === "throne") {
      for (let i = 0; i < 12; i++) {
        const ex = this.k.rand(-size * 0.8, size * 0.8);
        const ey = this.k.rand(-size * 0.8, size * 0.8);
        const phase = Math.random() * Math.PI * 2;

        const ember = this.k.add([
          this.k.circle(2),
          this.k.pos(ex, ey),
          this.k.color(255, 80, 30),
          this.k.z(5),
          "world",
        ]);
        ember.onUpdate(() => {
          ember.pos.y -= 20 * this.k.dt();
          ember.pos.x += Math.sin(this.k.time() + phase) * 15 * this.k.dt();
          if (ember.pos.y < -size) ember.pos.y = size;
          ember.use(this.k.opacity(0.4 + Math.abs(Math.sin(this.k.time() * 2 + phase)) * 0.6));
        });
        this.entities.push(ember);
      }
    }
  }

  private addBorderTrees() {
    const { size, theme } = this.config;

    const treeColors: Record<string, [number, number, number][]> = {
      town:    [[18, 65, 18], [25, 80, 25], [12, 50, 12]],
      forest:  [[8, 50, 8],  [12, 65, 12], [6, 40, 6]],
      frozen:  [[45, 65, 90], [55, 78, 105], [35, 55, 80]],
      mountain:[[55, 50, 42], [65, 60, 52], [48, 44, 36]],
      throne:  [[50, 12, 12], [62, 18, 18], [42, 8, 8]],
    };

    const colors = treeColors[theme] || treeColors.town;
    const trunkColor: [number, number, number] = [80, 52, 22];

    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const jitter = 0.85 + Math.random() * 0.2;
      const dist = size * jitter;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const r = 14 + Math.random() * 16;
      const color = colors[i % colors.length];

      const canopy = this.k.add([
        this.k.circle(r),
        this.k.pos(tx, ty),
        this.k.anchor("center"),
        this.k.color(color[0], color[1], color[2]),
        this.k.z(6),
        "world",
      ]);
      const trunk = this.k.add([
        this.k.rect(5, 9),
        this.k.pos(tx, ty + r - 2),
        this.k.anchor("center"),
        this.k.color(trunkColor[0], trunkColor[1], trunkColor[2]),
        this.k.z(5),
        "world",
      ]);
      this.entities.push(canopy, trunk);
    }

    // Scattered interior trees (sparser, smaller)
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = size * (0.55 + Math.random() * 0.25);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const r = 10 + Math.random() * 10;
      const color = colors[i % colors.length];

      const inner = this.k.add([
        this.k.circle(r),
        this.k.pos(tx, ty),
        this.k.anchor("center"),
        this.k.color(color[0], color[1], color[2]),
        this.k.z(6),
        "world",
      ]);
      this.entities.push(inner);
    }
  }
}
