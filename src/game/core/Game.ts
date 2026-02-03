import kaplay from "kaplay";
import type { KAPLAYCtx } from "kaplay";
import { store } from "../../store";
import { 
  gameStateAtom, 
  cameraPosAtom, 
  heroPosAtom,
  heroTargetAtom,
  selectedEntityAtom,
  currentWorldAtom,
  isModalOpenAtom,
  modalDataAtom,
} from "../../stores/gameStore";
import { World } from "./World";
import { WORLDS } from "../data/worlds";

export class Game {
  private k: KAPLAYCtx;
  private hero: any = null;
  private currentWorld: World | null = null;
  private heroStats = { hp: 100, maxHp: 100, attack: 10 };
  private defeatedCreeps = new Set<string>();

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
    this.createHero();
    this.setupCamera();
    this.setupInput();
    this.loadWorld("town");
    store.set(gameStateAtom, "playing");
  }

  private loadWorld(worldId: string) {
    this.k.destroyAll("world");
    this.k.destroyAll("building");
    this.k.destroyAll("creep");
    this.k.destroyAll("portal");
    
    const config = WORLDS[worldId];
    if (!config) return;

    store.set(currentWorldAtom, worldId as any);
    
    this.currentWorld = new World(this.k, config, (type, data) => {
      this.handleInteraction(type, data);
    });
    
    this.currentWorld.enter();
    
    if (this.hero) {
      this.hero.pos = this.k.vec2(0, 0);
      this.hero.vel = this.k.vec2(0, 0);
    }
  }

  private createHero() {
    this.hero = this.k.add([
      this.k.rect(32, 32),
      this.k.pos(0, 0),
      this.k.anchor("center"),
      this.k.color(0, 100, 200),
      this.k.area(),
      this.k.body(),
      "hero",
      { speed: 250 },
    ]);

    this.k.add([
      this.k.rect(32, 4),
      this.k.color(0, 255, 0),
      "hero-hp",
    ]);

    this.hero.onUpdate(() => {
      store.set(heroPosAtom, { x: this.hero.pos.x, y: this.hero.pos.y });
      
      const hpBars = this.k.get("hero-hp");
      if (hpBars && hpBars.length > 0) {
        const hpBarObj = hpBars[0];
        if (hpBarObj && hpBarObj.pos) {
          hpBarObj.pos.x = this.hero.pos.x;
          hpBarObj.pos.y = this.hero.pos.y - 25;
        }
      }
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
    this.k.onMousePress("right", () => {
      const worldPos = this.k.toWorld(this.k.mousePos());
      this.moveHeroTo(worldPos.x, worldPos.y);
    });

    this.k.onMousePress("left", () => {
      const worldPos = this.k.toWorld(this.k.mousePos());
      
      const creeps = this.k.get("creep");
      for (const creep of creeps) {
        const dx = worldPos.x - creep.pos.x;
        const dy = worldPos.y - creep.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 30 && !this.defeatedCreeps.has(String(creep.id))) {
          this.attackCreep(creep);
          return;
        }
      }
    });

    this.k.onKeyPress("space", () => {
      this.k.camPos(this.hero.pos);
    });
  }

  private moveHeroTo(targetX: number, targetY: number) {
    store.set(heroTargetAtom, { x: targetX, y: targetY });
    
    const dx = targetX - this.hero.pos.x;
    const dy = targetY - this.hero.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      this.hero.vel.x = (dx / dist) * this.hero.speed;
      this.hero.vel.y = (dy / dist) * this.hero.speed;
    }

    const checkArrival = () => {
      const dx2 = targetX - this.hero.pos.x;
      const dy2 = targetY - this.hero.pos.y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      if (dist2 < 10) {
        this.hero.vel.x = 0;
        this.hero.vel.y = 0;
        store.set(heroTargetAtom, null);
      } else if (this.hero.vel.x !== 0 || this.hero.vel.y !== 0) {
        this.k.wait(0.05, checkArrival);
      }
    };
    
    this.k.wait(0.05, checkArrival);
  }

  private attackCreep(creep: any) {
    this.moveHeroTo(creep.pos.x, creep.pos.y);
    
    const checkAttack = () => {
      const dx = this.hero.pos.x - creep.pos.x;
      const dy = this.hero.pos.y - creep.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 50) {
        this.performAttack(creep);
      } else if (this.hero.vel.x !== 0 || this.hero.vel.y !== 0) {
        this.k.wait(0.1, checkAttack);
      }
    };
    
    this.k.wait(0.1, checkAttack);
  }

  private performAttack(creep: any) {
    this.hero.vel.x = 0;
    this.hero.vel.y = 0;
    
    const originalColor = this.hero.color;
    this.hero.color = this.k.rgb(255, 255, 0);
    this.k.wait(0.1, () => {
      this.hero.color = originalColor;
    });
    
    creep.hp -= this.heroStats.attack;
    
    this.showDamageNumber(creep.pos.x, creep.pos.y - 30, this.heroStats.attack);
    
    if (creep.hp <= 0) {
      this.defeatCreep(creep);
    }
  }

  private showDamageNumber(x: number, y: number, damage: number) {
    const text = this.k.add([
      this.k.text(damage.toString(), { size: 20 }),
      this.k.pos(x, y),
      this.k.anchor("center"),
      this.k.color(255, 0, 0),
    ]);
    
    let age = 0;
    text.onUpdate(() => {
      age += this.k.dt();
      text.pos.y -= 50 * this.k.dt();
      // Fade out
      if (age > 0.5) {
        text.destroy();
      }
    });
  }

  private defeatCreep(creep: any) {
    this.defeatedCreeps.add(creep.id as string);
    
    creep.scale = this.k.vec2(1.5);
    creep.color = this.k.rgb(100, 100, 100);
    
    this.k.wait(0.2, () => {
      creep.destroy();
    });
    
    this.showReward(creep.pos.x, creep.pos.y);
    
    if (creep.reward) {
      this.unlockContent(creep.reward as string);
    }
  }

  private showReward(x: number, y: number) {
    const text = this.k.add([
      this.k.text("Unlocked!", { size: 16 }),
      this.k.pos(x, y - 50),
      this.k.anchor("center"),
      this.k.color(255, 215, 0),
    ]);
    
    this.k.wait(2, () => text.destroy());
  }

  private unlockContent(id: string) {
    const buildings = this.k.get("building");
    for (const b of buildings) {
      if (String(b.id) === id) {
        b.use(this.k.color(100, 255, 100));
      }
    }
  }

  private handleInteraction(type: string, data: any) {
    if (type === "portal") {
      this.loadWorld(data.target);
    } else if (type === "building") {
      const buildings = this.k.get("building");
      const building = buildings.find((b: any) => b.id === data.id);
      
      if (building) {
        const dx = this.hero.pos.x - building.pos.x;
        const dy = this.hero.pos.y - building.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 80) {
          store.set(selectedEntityAtom, data.id);
          store.set(modalDataAtom, data);
          store.set(isModalOpenAtom, true);
        } else {
          this.moveHeroTo(building.pos.x, building.pos.y);
        }
      }
    }
  }

  getHeroStats() {
    return this.heroStats;
  }

  getDefeatedCreeps() {
    return Array.from(this.defeatedCreeps);
  }
}
