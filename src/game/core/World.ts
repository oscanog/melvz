import type { KAPLAYCtx } from "kaplay";

export interface WorldConfig {
  name: string;
  theme: "town" | "forest" | "frozen" | "mountain" | "throne";
  groundColor: [number, number, number];
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
    const { size, groundColor } = this.config;
    
    for (let x = -size; x <= size; x += 64) {
      for (let y = -size; y <= size; y += 64) {
        const tile = this.k.add([
          this.k.rect(64, 64),
          this.k.pos(x, y),
          this.k.color(groundColor[0], groundColor[1], groundColor[2]),
          this.k.z(0), // Ground is at bottom
          "world",
        ]);
        this.entities.push(tile);
      }
    }
  }

  protected createPaths() {
    const { pathColor } = this.config;
    
    const pathWidth = 60;
    const pathLength = 2000;
    
    const hPath = this.k.add([
      this.k.rect(pathLength, pathWidth),
      this.k.pos(0, 0),
      this.k.color(pathColor[0], pathColor[1], pathColor[2]),
      this.k.z(1), // Slightly above ground
      "world",
    ]);
    this.entities.push(hPath);
    
    const vPath = this.k.add([
      this.k.rect(pathWidth, pathLength),
      this.k.pos(0, 0),
      this.k.color(pathColor[0], pathColor[1], pathColor[2]),
      this.k.z(1),
      "world",
    ]);
    this.entities.push(vPath);
  }

  protected spawnBuildings() {
    for (const building of this.config.buildings) {
      this.spawnBuilding(building);
    }
  }

  protected spawnBuilding(config: BuildingConfig) {
    const colors: Record<string, [number, number, number]> = {
      tower: [34, 139, 34],
      obelisk: [65, 105, 225],
      shrine: [218, 165, 32],
      castle: [139, 0, 0],
    };
    
    const sizes: Record<string, [number, number]> = {
      tower: [48, 64],
      obelisk: [32, 80],
      shrine: [56, 56],
      castle: [96, 96],
    };
    
    const color = colors[config.type] || [100, 100, 100];
    const [w, h] = sizes[config.type] || [48, 64];
    
    const building = this.k.add([
      this.k.rect(w, h),
      this.k.pos(config.x, config.y),
      this.k.anchor("center"),
      this.k.color(color[0], color[1], color[2]),
      this.k.area(),
      this.k.z(10), // Above ground, below player
      "building",
      { id: config.id, data: config.data, type: config.type },
    ]);

    const label = this.k.add([
      this.k.text(config.data.title, { size: 14, font: "sans-serif" }),
      this.k.pos(config.x, config.y - h / 2 - 20),
      this.k.anchor("center"),
      this.k.color(255, 215, 0),
      this.k.z(11), // Above building
      "world",
    ]);

    building.onHover(() => building.use(this.k.scale(1.1)));
    building.onHoverEnd(() => building.use(this.k.scale(1)));
    
    building.onClick(() => {
      this.onInteractCallback("building", config.data);
    });

    this.entities.push(building, label);
    return building;
  }

  protected spawnCreeps() {
    for (const creep of this.config.creeps) {
      this.spawnCreep(creep);
    }
  }

  protected spawnCreep(config: CreepConfig) {
    const colors: Record<string, [number, number, number]> = {
      kobold: [255, 165, 0],
      golem: [128, 128, 128],
      dragon: [220, 20, 60],
    };
    
    const sizes: Record<string, number> = {
      kobold: 20,
      golem: 35,
      dragon: 50,
    };
    
    const color = colors[config.type] || [255, 0, 0];
    const size = sizes[config.type] || 25;
    
    const creep = this.k.add([
      this.k.rect(size, size),
      this.k.pos(config.x, config.y),
      this.k.anchor("center"),
      this.k.color(color[0], color[1], color[2]),
      this.k.area(),
      this.k.body(),
      this.k.z(15), // Above buildings
      "creep",
      { 
        id: config.id, 
        type: config.type,
        maxHp: config.hp,
        hp: config.hp,
        reward: config.reward,
      },
    ]);

    const hpBar = this.k.add([
      this.k.rect(size, 4),
      this.k.pos(config.x, config.y - size / 2 - 10),
      this.k.anchor("center"),
      this.k.color(255, 0, 0),
      this.k.z(16), // Above creep
      "world",
    ]);

    let direction = 1;
    this.k.loop(2, () => {
      direction *= -1;
    });
    
    creep.onUpdate(() => {
      creep.move(30 * direction, 0);
    });

    creep.onClick(() => {
      this.onInteractCallback("creep", { id: config.id, data: config });
    });

    this.entities.push(creep, hpBar);
    return creep;
  }

  protected spawnPortals() {
    for (const portal of this.config.portals) {
      this.spawnPortal(portal);
    }
  }

  protected spawnPortal(config: PortalConfig) {
    const portal = this.k.add([
      this.k.circle(30),
      this.k.pos(config.x, config.y),
      this.k.anchor("center"),
      this.k.color(128, 0, 128),
      this.k.area(),
      this.k.z(20), // Above creeps
      "portal",
      { target: config.targetWorld },
    ]);

    let scale = 1;
    portal.onUpdate(() => {
      scale = 1 + Math.sin(this.k.time() * 3) * 0.1;
      portal.use(this.k.scale(scale));
    });

    const label = this.k.add([
      this.k.text(`→ ${config.label}`, { size: 12, font: "sans-serif" }),
      this.k.pos(config.x, config.y - 40),
      this.k.anchor("center"),
      this.k.color(200, 150, 255),
      this.k.z(21), // Above portal
      "world",
    ]);

    portal.onClick(() => {
      this.onInteractCallback("portal", { target: config.targetWorld });
    });

    this.entities.push(portal, label);
    return portal;
  }

  protected createAmbientEffects() {
    if (this.config.theme === "forest") {
      for (let i = 0; i < 10; i++) {
        const firefly = this.k.add([
          this.k.circle(3),
          this.k.pos(
            this.k.rand(-500, 500),
            this.k.rand(-500, 500)
          ),
          this.k.color(255, 255, 100),
          "world",
        ]);
        
        firefly.onUpdate(() => {
          firefly.pos.x += this.k.rand(-1, 1);
          firefly.pos.y += this.k.rand(-1, 1);
        });
        
        this.entities.push(firefly);
      }
    }
  }
}
