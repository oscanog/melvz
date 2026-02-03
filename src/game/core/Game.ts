import kaplay from "kaplay";
import type { KAPLAYCtx } from "kaplay";
import { store } from "../../store";
import { 
  gameStateAtom, 
  cameraPosAtom, 
  heroPosAtom,
  currentWorldAtom,
  isModalOpenAtom,
  modalDataAtom,
} from "../../stores/gameStore";
import { World } from "./World";
import { WORLDS } from "../data/worlds";

export class Game {
  private k: KAPLAYCtx;
  private player: any = null;
  private currentWorld: World | null = null;
  private keys: Record<string, boolean> = {};
  private lastModalTrigger: string | null = null;

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
    // Load font before creating text elements
    this.k.loadFont("ibm-bold", "/fonts/IBMPlexSans-Bold.ttf");
    
    this.createPlayer();
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
    
    // Keep player position when changing worlds (or reset to center)
    if (this.player) {
      // Don't reset position - let player continue from where they "entered"
      this.player.vel = this.k.vec2(0, 0);
    }
  }

  private createPlayer() {
    // Melvin - the main character (About Me personified)
    this.player = this.k.add([
      this.k.rect(32, 48),
      this.k.pos(0, 0),
      this.k.anchor("center"),
      this.k.color(100, 150, 255), // Blue outfit
      this.k.area(),
      this.k.body(),
      this.k.z(50), // Higher than world (0), lower than label (100)
      "player",
      { speed: 200 },
    ]);

    // Name label above player - add AFTER world so it's on top
    const nameLabel = this.k.add([
      this.k.text("Melvin", { size: 14, font: "ibm-bold" }),
      this.k.pos(0, -35),
      this.k.anchor("center"),
      this.k.color(255, 215, 0),
      this.k.z(100), // High z-index to stay on top
      "player-label",
    ]);

    // Player update loop
    this.player.onUpdate(() => {
      // Update store with position
      store.set(heroPosAtom, { x: this.player.pos.x, y: this.player.pos.y });
      
      // Update name label position
      nameLabel.pos.x = this.player.pos.x;
      nameLabel.pos.y = this.player.pos.y - 35;

      // Handle keyboard movement
      this.handleKeyboardMovement();

      // Check proximity to buildings for auto-trigger
      this.checkBuildingProximity();
    });
  }

  private handleKeyboardMovement() {
    let moveX = 0;
    let moveY = 0;

    if (this.keys["left"] || this.keys["a"]) moveX = -1;
    if (this.keys["right"] || this.keys["d"]) moveX = 1;
    if (this.keys["up"] || this.keys["w"]) moveY = -1;
    if (this.keys["down"] || this.keys["s"]) moveY = 1;

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.707;
      moveY *= 0.707;
    }

    this.player.vel.x = moveX * this.player.speed;
    this.player.vel.y = moveY * this.player.speed;
  }

  private setupCamera() {
    this.k.onUpdate(() => {
      const playerPos = this.player.pos;
      const camPos = this.k.camPos();
      const targetX = this.k.lerp(camPos.x, playerPos.x, 0.1);
      const targetY = this.k.lerp(camPos.y, playerPos.y, 0.1);
      this.k.camPos(targetX, targetY);
      store.set(cameraPosAtom, { x: targetX, y: targetY });
    });
  }

  private setupInput() {
    // LEFT CLICK to move (best UX as requested)
    this.k.onMousePress("left", () => {
      // Check if clicking on UI or game world
      const mousePos = this.k.mousePos();
      
      // Don't move if clicking near UI areas (top/bottom of screen)
      if (mousePos.y < 60 || mousePos.y > this.k.height() - 60) {
        return;
      }

      const worldPos = this.k.toWorld(mousePos);
      this.movePlayerTo(worldPos.x, worldPos.y);
    });

    // Keyboard controls
    this.k.onKeyDown("left", () => this.keys["left"] = true);
    this.k.onKeyRelease("left", () => this.keys["left"] = false);
    
    this.k.onKeyDown("right", () => this.keys["right"] = true);
    this.k.onKeyRelease("right", () => this.keys["right"] = false);
    
    this.k.onKeyDown("up", () => this.keys["up"] = true);
    this.k.onKeyRelease("up", () => this.keys["up"] = false);
    
    this.k.onKeyDown("down", () => this.keys["down"] = true);
    this.k.onKeyRelease("down", () => this.keys["down"] = false);

    // WASD alternatives
    this.k.onKeyDown("a", () => this.keys["a"] = true);
    this.k.onKeyRelease("a", () => this.keys["a"] = false);
    
    this.k.onKeyDown("d", () => this.keys["d"] = true);
    this.k.onKeyRelease("d", () => this.keys["d"] = false);
    
    this.k.onKeyDown("w", () => this.keys["w"] = true);
    this.k.onKeyRelease("w", () => this.keys["w"] = false);
    
    this.k.onKeyDown("s", () => this.keys["s"] = true);
    this.k.onKeyRelease("s", () => this.keys["s"] = false);

    // Space to interact with nearby building
    this.k.onKeyPress("space", () => {
      this.tryInteractWithNearest();
    });

    // E to interact alternative
    this.k.onKeyPress("e", () => {
      this.tryInteractWithNearest();
    });
  }

  private movePlayerTo(targetX: number, targetY: number) {
    // Calculate direction
    const dx = targetX - this.player.pos.x;
    const dy = targetY - this.player.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      // Set velocity toward target
      this.player.vel.x = (dx / dist) * this.player.speed;
      this.player.vel.y = (dy / dist) * this.player.speed;

      // Stop when close
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

  private checkBuildingProximity() {
    const buildings = this.k.get("building");
    
    for (const building of buildings) {
      const dx = this.player.pos.x - building.pos.x;
      const dy = this.player.pos.y - building.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // If very close to building, show indicator
      if (dist < 60) {
        // Could show "Press E to interact" hint here
        building.use(this.k.color(150, 255, 150)); // Glow green
      } else {
        // Reset color based on type
        this.resetBuildingColor(building);
      }
    }

    // Check portal proximity
    const portals = this.k.get("portal");
    for (const portal of portals) {
      const dx = this.player.pos.x - portal.pos.x;
      const dy = this.player.pos.y - portal.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        // Auto-travel through portal
        this.handleInteraction("portal", { target: portal.target });
      }
    }
  }

  private resetBuildingColor(building: any) {
    const colors: Record<string, [number, number, number]> = {
      tower: [34, 139, 34],
      obelisk: [65, 105, 225],
      shrine: [218, 165, 32],
      castle: [139, 0, 0],
    };
    const color = colors[building.type] || [100, 100, 100];
    building.use(this.k.color(color[0], color[1], color[2]));
  }

  private tryInteractWithNearest() {
    const buildings = this.k.get("building");
    let nearest: any = null;
    let nearestDist = Infinity;

    for (const building of buildings) {
      const dx = this.player.pos.x - building.pos.x;
      const dy = this.player.pos.y - building.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 80 && dist < nearestDist) {
        nearest = building;
        nearestDist = dist;
      }
    }

    if (nearest) {
      this.handleInteraction("building", nearest.data);
    }
  }

  private handleInteraction(type: string, data: any) {
    if (type === "portal") {
      // Prevent rapid world switching
      const now = Date.now();
      if (this.lastModalTrigger === `portal-${data.target}` && now - (this as any).lastPortalTime < 2000) {
        return;
      }
      (this as any).lastPortalTime = now;
      this.lastModalTrigger = `portal-${data.target}`;
      
      this.loadWorld(data.target);
    } else if (type === "building") {
      // Prevent duplicate modal opens
      const now = Date.now();
      if (this.lastModalTrigger === data.id && now - (this as any).lastModalTime < 1000) {
        return;
      }
      (this as any).lastModalTime = now;
      this.lastModalTrigger = data.id;

      store.set(modalDataAtom, data);
      store.set(isModalOpenAtom, true);
    }
  }
}
