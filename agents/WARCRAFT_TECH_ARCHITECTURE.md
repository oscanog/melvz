# 🏗️ Warcraft Portfolio - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         KAPLAY GAME CANVAS                              ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   ││
│  │  │ World Map   │ │ Hero Units  │ │  UI/HUD     │ │ Particle FX     │   ││
│  │  │ (Tilemap)   │ │ (Sprites)   │ │ (React)     │ │ (Shader)        │   ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GAME LOGIC LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      GAME SYSTEMS (Kaplay Context)                      ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  ││
│  │  │  Input   │ │  Camera  │ │  Entity  │ │ Combat   │ │  Quest/      │  ││
│  │  │ System   │ │ Controller│ │ Manager │ │ System   │ │  Dialogue    │  ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STATE MANAGEMENT                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           JOTAI ATOMS                                   ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐ ││
│  │  │ Game State   │ │ Player Prog  │ │ UI State     │ │ Camera State   │ ││
│  │  │ (mode, time) │ │ (unlocked)   │ │ (modals)     │ │ (pos, zoom)    │ ││
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Portfolio JSON  │  Asset Loader  │  External APIs  │  LocalStorage   ││
│  │  (projects, exp) │  (sprites, sfx)│  (GitHub, etc)  │  (progress)     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
src/
├── game/
│   ├── core/
│   │   ├── Game.ts                 # Main game controller
│   │   ├── CameraController.ts     # RTS-style camera
│   │   ├── InputManager.ts         # Keyboard/mouse handlers
│   │   └── EntityManager.ts        # Spawn/despawn entities
│   │
│   ├── entities/
│   │   ├── Hero.ts                 # Player hero unit
│   │   ├── Creep.ts                # Interactive enemies
│   │   ├── Building.ts             # Projects/Skills as buildings
│   │   ├── Projectile.ts           # Spells/attacks
│   │   └── Particle.ts             # FX entities
│   │
│   ├── systems/
│   │   ├── CombatSystem.ts         # Attack/damage logic
│   │   ├── QuestSystem.ts          # Portfolio content loader
│   │   ├── SkillTreeSystem.ts      # Tech stack as abilities
│   │   └── AudioSystem.ts          # SFX and music manager
│   │
│   ├── ui/
│   │   ├── HUD.ts                  # In-game HUD (health, mana)
│   │   ├── Minimap.ts              # World map minimap
│   │   ├── HeroPanel.ts            # Selected hero info
│   │   ├── QuestLog.ts             # Portfolio content display
│   │   └── Tooltips.ts             # Hover information
│   │
│   ├── worlds/
│   │   ├── World.ts                # Base world class
│   │   ├── TownWorld.ts            # About section (Mid)
│   │   ├── ForestWorld.ts          # Projects (West)
│   │   ├── FrozenWorld.ts          # Skills (East)
│   │   ├── MountainWorld.ts        # Contact (North)
│   │   └── ThroneWorld.ts          # Experience (Center)
│   │
│   └── assets/
│       ├── sprites/                # Character & object sprites
│       ├── tilesets/               # Map tilesets
│       ├── ui/                     # UI elements & frames
│       ├── audio/                  # SFX and music
│       └── shaders/                # GLSL effects
│
├── components/
│   ├── react/                      # React UI overlays
│   │   ├── GameOverlay.tsx         # Main game UI wrapper
│   │   ├── HeroStats.tsx           # Hero stats panel
│   │   ├── QuestModal.tsx          # Project/Experience detail
│   │   ├── SkillTooltip.tsx        # Tech stack info
│   │   ├── MenuScreen.tsx          # Main menu
│   │   └── LoadingScreen.tsx       # Asset loading
│   │
│   └── ui/                         # Reusable UI components
│
├── hooks/
│   ├── useGame.ts                  # Game instance access
│   ├── useCamera.ts                # Camera control hook
│   └── useQuest.ts                 # Quest progress hook
│
├── stores/
│   ├── gameStore.ts                # Game state atoms
│   ├── playerStore.ts              # Player progress atoms
│   └── uiStore.ts                  # UI state atoms
│
├── data/
│   ├── heroes.json                 # Hero definitions
│   ├── quests.json                 # Portfolio content
│   ├── skills.json                 # Tech stack data
│   └── dialogue.json               # NPC dialogue
│
├── utils/
│   ├── pathfinding.ts              # A* for unit movement
│   ├── collision.ts                # Hit detection
│   └── animations.ts               # Tween helpers
│
└── types/
    ├── game.ts                     # Core game types
    ├── entities.ts                 # Entity type definitions
    └── api.ts                      # External API types
```

---

## Core Systems Design

### 1. Game Loop Architecture

```typescript
// src/game/core/Game.ts

class WarcraftPortfolioGame {
  private k: KAPLAYCtx;
  private world: World;
  private entityManager: EntityManager;
  private inputManager: InputManager;
  private cameraController: CameraController;
  
  // React bridge
  private store: JotaiStore;
  
  async init() {
    // Load assets
    await this.loadAssets();
    
    // Initialize systems
    this.entityManager = new EntityManager(this.k);
    this.inputManager = new InputManager(this.k);
    this.cameraController = new CameraController(this.k);
    
    // Load first world
    this.world = new TownWorld(this.k);
    this.world.enter();
    
    // Start game loop
    this.k.onUpdate(() => this.update());
  }
  
  private update() {
    const dt = this.k.dt();
    
    this.entityManager.update(dt);
    this.cameraController.update(dt);
    this.world.update(dt);
    
    // Sync with React state (throttled)
    this.syncState();
  }
}
```

### 2. Entity Component System (Lightweight)

```typescript
// src/game/entities/Entity.ts

interface EntityConfig {
  pos: Vec2;
  sprite: string;
  animations?: Record<string, Animation>;
  stats?: EntityStats;
}

class Entity {
  protected gameObj: GameObj;
  protected k: KAPLAYCtx;
  
  constructor(k: KAPLAYCtx, config: EntityConfig) {
    this.k = k;
    this.gameObj = k.add([
      k.sprite(config.sprite),
      k.pos(config.pos),
      k.area(),
      k.anchor("center"),
      // ... other components
    ]);
  }
  
  destroy() {
    this.gameObj.destroy();
  }
  
  get position() { return this.gameObj.pos; }
  set position(pos: Vec2) { this.gameObj.pos = pos; }
}

// Hero entity with abilities
class Hero extends Entity {
  private abilities: Ability[] = [];
  private selected = false;
  
  constructor(k: KAPLAYCtx, heroType: HeroType) {
    super(k, HERO_CONFIGS[heroType]);
    this.setupAbilities();
    this.setupSelection();
  }
  
  private setupSelection() {
    // Click to select
    this.gameObj.onClick(() => {
      store.set(selectedHeroAtom, this);
      this.selected = true;
    });
  }
  
  moveTo(pos: Vec2) {
    // Pathfinding + animation
    const path = this.findPath(this.position, pos);
    this.animateMove(path);
  }
  
  castAbility(index: number, target?: Vec2) {
    const ability = this.abilities[index];
    if (ability.isReady()) {
      ability.cast(target);
      this.playCastAnimation(index);
    }
  }
}
```

### 3. Camera System (RTS-Style)

```typescript
// src/game/core/CameraController.ts

class CameraController {
  private k: KAPLAYCtx;
  private target: Vec2 | null = null;
  private bounds: Rect;
  
  constructor(k: KAPLAYCtx) {
    this.k = k;
    this.bounds = { x: -2000, y: -2000, w: 4000, h: 4000 };
    
    // Edge scrolling
    k.onUpdate(() => this.handleEdgeScroll());
  }
  
  private handleEdgeScroll() {
    const mousePos = this.k.mousePos();
    const edgeThreshold = 50;
    const scrollSpeed = 500 * this.k.dt();
    
    let moveX = 0, moveY = 0;
    
    if (mousePos.x < edgeThreshold) moveX = -scrollSpeed;
    if (mousePos.x > this.k.width() - edgeThreshold) moveX = scrollSpeed;
    if (mousePos.y < edgeThreshold) moveY = -scrollSpeed;
    if (mousePos.y > this.k.height() - edgeThreshold) moveY = scrollSpeed;
    
    if (moveX !== 0 || moveY !== 0) {
      const currentPos = this.k.camPos();
      this.k.camPos(currentPos.x + moveX, currentPos.y + moveY);
    }
  }
  
  follow(target: Entity, smooth = true) {
    if (smooth) {
      this.k.tween(
        this.k.camPos(),
        target.position,
        0.1,
        (pos) => this.k.camPos(pos),
        this.k.easings.linear
      );
    } else {
      this.k.camPos(target.position);
    }
  }
  
  // Minimap click = jump to position
  jumpTo(worldPos: Vec2) {
    this.k.camPos(worldPos);
  }
}
```

### 4. Quest System (Portfolio Content)

```typescript
// src/game/systems/QuestSystem.ts

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side';
  objectives: Objective[];
  rewards: Reward[];
  
  // Portfolio mapping
  portfolioData?: Project | Experience | Skill;
}

class QuestSystem {
  private activeQuests: Quest[] = [];
  private completedQuests: string[] = [];
  
  async loadPortfolioData() {
    // Load from JSON
    const projects = await fetch('/configs/projects.json').then(r => r.json());
    const experience = await fetch('/configs/experience.json').then(r => r.json());
    
    // Convert to quests
    this.activeQuests = [
      ...this.convertProjectsToQuests(projects),
      ...this.convertExperienceToQuests(experience),
    ];
  }
  
  startQuest(questId: string) {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (quest) {
      store.set(currentQuestAtom, quest);
      this.showQuestStartDialog(quest);
    }
  }
  
  completeObjective(questId: string, objectiveId: string) {
    // Check if all objectives complete
    // Award rewards
    // Update portfolio view count
  }
}
```

---

## External APIs & Asset Loading

### 1. GitHub API Integration

```typescript
// src/services/github.ts

interface GitHubRepo {
  name: string;
  description: string;
  html_url: string;
  homepage: string;
  stargazers_count: number;
  topics: string[];
}

class GitHubService {
  private username = 'mviner000';
  
  async fetchRepos(): Promise<Project[]> {
    const response = await fetch(
      `https://api.github.com/users/${this.username}/repos?sort=updated`
    );
    const repos: GitHubRepo[] = await response.json();
    
    return repos.map(repo => ({
      id: repo.name,
      title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: repo.description,
      sourceLink: repo.html_url,
      liveLink: repo.homepage,
      stars: repo.stargazers_count,
      tags: repo.topics,
    }));
  }
  
  // Generate screenshot URL (using thumbnail service)
  getProjectThumbnail(repoName: string, homepage?: string): string {
    if (homepage) {
      // Use screenshot API
      return `https://api.screenshotone.com/take?url=${encodeURIComponent(homepage)}&access_key=YOUR_KEY`;
    }
    // Fallback placeholder
    return `/assets/placeholders/project-${repoName}.png`;
  }
}
```

### 2. Asset Loading Strategy

```typescript
// src/game/assets/AssetLoader.ts

class AssetLoader {
  private k: KAPLAYCtx;
  private loadedAssets = new Set<string>();
  
  async loadAll() {
    await Promise.all([
      this.loadSprites(),
      this.loadAudio(),
      this.loadTilesets(),
    ]);
  }
  
  private async loadSprites() {
    // Heroes
    this.k.loadSprite('hero-melvin', '/sprites/heroes/melvin.png');
    this.k.loadSprite('hero-frontend', '/sprites/heroes/frontend.png');
    this.k.loadSprite('hero-backend', '/sprites/heroes/backend.png');
    
    // Creeps
    this.k.loadSprite('creep-kobold', '/sprites/creeps/kobold.png');
    this.k.loadSprite('creep-golem', '/sprites/creeps/golem.png');
    this.k.loadSprite('creep-dragon', '/sprites/creeps/dragon.png');
    
    // Buildings
    this.k.loadSprite('building-ancient', '/sprites/buildings/ancient.png');
    this.k.loadSprite('building-obelisk', '/sprites/buildings/obelisk.png');
    
    // Tech icons (DOTA-style)
    const techs = ['react', 'typescript', 'nodejs', 'python'];
    for (const tech of techs) {
      this.k.loadSprite(`tech-${tech}`, `/sprites/tech/${tech}.png`);
    }
  }
  
  // Lazy loading for world-specific assets
  async loadWorldAssets(worldType: WorldType) {
    if (this.loadedAssets.has(worldType)) return;
    
    const assets = WORLD_ASSET_MAP[worldType];
    for (const [name, path] of Object.entries(assets)) {
      await this.k.loadSprite(name, path);
    }
    
    this.loadedAssets.add(worldType);
  }
}
```

---

## React-Kaplay Bridge

### State Synchronization

```typescript
// src/stores/gameStore.ts

// Game state synced from Kaplay
export const gameStateAtom = atom<GameState>('loading');
export const selectedHeroAtom = atom<HeroData | null>(null);
export const cameraPositionAtom = atom<Vec2>({ x: 0, y: 0 });
export const hoveredEntityAtom = atom<EntityData | null>(null);

// Actions sent TO Kaplay
export const gameActions = {
  moveHero: (pos: Vec2) => {
    gameInstance?.selectedHero?.moveTo(pos);
  },
  
  castAbility: (heroId: string, abilityIndex: number) => {
    gameInstance?.heroes.get(heroId)?.castAbility(abilityIndex);
  },
  
  selectQuest: (questId: string) => {
    gameInstance?.questSystem.startQuest(questId);
  },
};
```

### React Overlay Components

```tsx
// src/components/react/GameOverlay.tsx

export function GameOverlay() {
  const gameState = useAtomValue(gameStateAtom);
  const selectedHero = useAtomValue(selectedHeroAtom);
  
  return (
    <div className="game-overlay">
      {/* Top Bar - Resources */}
      <ResourceBar 
        gold={12} // Projects count
        lumber={24} // Skills count
        food={`${5}/${10}`} // Experience years
      />
      
      {/* Bottom Panel - Hero Stats (DOTA style) */}
      {selectedHero && (
        <HeroPanel
          hero={selectedHero}
          onAbilityClick={(i) => gameActions.castAbility(selectedHero.id, i)}
        />
      )}
      
      {/* Bottom Left - Minimap */}
      <Minimap 
        cameraPos={useAtomValue(cameraPositionAtom)}
        onClick={(pos) => gameActions.panCamera(pos)}
      />
      
      {/* Modals */}
      <QuestModal />
      <SkillTreeModal />
    </div>
  );
}
```

---

## Performance Optimizations

### 1. Spatial Partitioning
```typescript
// Divide world into grid for efficient collision/selection
class SpatialGrid {
  private cells: Map<string, Entity[]> = new Map();
  private cellSize = 100;
  
  insert(entity: Entity) {
    const key = this.getCellKey(entity.position);
    // Add to cell
  }
  
  query(rect: Rect): Entity[] {
    // Return only entities in relevant cells
  }
}
```

### 2. Object Pooling
```typescript
// Reuse projectile/particle entities
class ObjectPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  
  acquire(): T {
    const obj = this.available.pop() || this.createNew();
    this.inUse.add(obj);
    return obj;
  }
  
  release(obj: T) {
    this.inUse.delete(obj);
    this.available.push(obj);
  }
}
```

### 3. LOD (Level of Detail)
```typescript
// Reduce detail for distant entities
getSpriteForDistance(entity: Entity, cameraDistance: number): string {
  if (cameraDistance > 500) return 'sprite-low-res';
  if (cameraDistance > 200) return 'sprite-medium';
  return 'sprite-high-res';
}
```

---

*This architecture supports 60fps gameplay with 100+ entities on screen.*
