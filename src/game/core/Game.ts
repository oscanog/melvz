import kaplay from "kaplay";
import type { KAPLAYCtx } from "kaplay";
import { store } from "../../store";
import { 
  gameStateAtom, 
  cameraPosAtom, 
  heroPosAtom,
  heroTargetAtom,
  selectedEntityAtom 
} from "../../stores/gameStore";

export class Game {
  private k: KAPLAYCtx;
  private hero: any = null;
  private buildings: any[] = [];
  private updateHandlers: any[] = [];

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
    this.createWorld();
    this.createHero();
    this.setupCamera();
    this.setupInput();
    store.set(gameStateAtom, "playing");
  }

  private createWorld() {
    // Ground tiles
    for (let x = -500; x <= 500; x += 64) {
      for (let y = -500; y <= 500; y += 64) {
        const isPath = Math.abs(y as number) < 50 || Math.abs(x as number) < 50;
        this.k.add([
          this.k.rect(64, 64),
          this.k.pos(x, y),
          this.k.color(isPath ? 30 : 20, isPath ? 40 : 25, isPath ? 30 : 20),
        ]);
      }
    }

    // Spawn buildings
    this.spawnBuilding("tower", 200, -100, { 
      id: "about", 
      title: "About Me",
      type: "about",
      description: "A passionate developer from the Philippines..."
    });
    
    this.spawnBuilding("obelisk", -200, -100, { 
      id: "skills", 
      title: "Skills",
      type: "skills",
      description: "React, TypeScript, Node.js, Python..."
    });

    this.spawnBuilding("tower", 200, 100, { 
      id: "projects", 
      title: "Projects",
      type: "projects",
      description: "View my GitHub repositories..."
    });

    this.spawnBuilding("obelisk", -200, 100, { 
      id: "contact", 
      title: "Contact",
      type: "contact",
      description: "Get in touch via email or social media..."
    });
  }

  private createHero() {
    // Use rectangle as placeholder for hero
    this.hero = this.k.add([
      this.k.rect(32, 32),
      this.k.pos(0, 0),
      this.k.anchor("center"),
      this.k.color(0, 100, 200),
      this.k.area(),
      this.k.body(),
      "hero",
      { speed: 200 },
    ]);

    this.hero.onUpdate(() => {
      store.set(heroPosAtom, { x: this.hero.pos.x, y: this.hero.pos.y });
    });
  }

  private setupCamera() {
    this.k.onUpdate(() => {
      const heroPos = this.hero.pos;
      const camPos = this.k.camPos();
      const targetX = this.k.lerp(camPos.x, heroPos.x, 0.1);
      const targetY = this.k.lerp(camPos.y, heroPos.y, 0.1);
      this.k.camPos(targetX, targetY);
      store.set(cameraPosAtom, { x: targetX, y: targetY });
    });
  }

  private setupInput() {
    // Right click to move hero
    this.k.onMousePress("right", () => {
      const worldPos = this.k.toWorld(this.k.mousePos());
      this.moveHeroTo(worldPos.x, worldPos.y);
    });

    // Left click to interact
    this.k.onMousePress("left", () => {
      const worldPos = this.k.toWorld(this.k.mousePos());
      
      for (const b of this.buildings) {
        const dx = worldPos.x - b.pos.x;
        const dy = worldPos.y - b.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 40) {
          this.onBuildingClick(b);
          return;
        }
      }
    });
  }

  private moveHeroTo(targetX: number, targetY: number) {
    store.set(heroTargetAtom, { x: targetX, y: targetY });
    
    const dx = targetX - this.hero.pos.x;
    const dy = targetY - this.hero.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / dist;
    const dirY = dy / dist;
    
    this.hero.vel.x = dirX * this.hero.speed;
    this.hero.vel.y = dirY * this.hero.speed;

    // Stop when arrived
    const checkArrival = () => {
      const dx2 = targetX - this.hero.pos.x;
      const dy2 = targetY - this.hero.pos.y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      if (dist2 < 10) {
        this.hero.vel.x = 0;
        this.hero.vel.y = 0;
        store.set(heroTargetAtom, null);
        // Remove this handler
        this.updateHandlers = this.updateHandlers.filter((h: any) => h !== checkArrival);
      }
    };
    
    this.updateHandlers.push(checkArrival);
    this.k.onUpdate(checkArrival);
  }

  private onBuildingClick(building: any) {
    const dx = this.hero.pos.x - building.pos.x;
    const dy = this.hero.pos.y - building.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 80) {
      store.set(selectedEntityAtom, building.data.id);
    } else {
      this.moveHeroTo(building.pos.x, building.pos.y);
    }
  }

  spawnBuilding(type: string, x: number, y: number, data: any) {
    const color = type === "tower" ? [34, 139, 34] : [65, 105, 225];
    
    const building = this.k.add([
      this.k.rect(48, 64),
      this.k.pos(x, y),
      this.k.anchor("center"),
      this.k.color(color[0], color[1], color[2]),
      this.k.area(),
      "building",
      { id: data.id, data },
    ]);

    // Label above building
    this.k.add([
      this.k.text(data.title, { size: 16 }),
      this.k.pos(x, y - 50),
      this.k.anchor("center"),
      this.k.color(255, 215, 0),
    ]);

    // Hover effect using use()
    building.onHover(() => {
      building.use(this.k.scale(1.1));
    });
    building.onHoverEnd(() => {
      building.use(this.k.scale(1));
    });

    this.buildings.push(building);
    return building;
  }
}
