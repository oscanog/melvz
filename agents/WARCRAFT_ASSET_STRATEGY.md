# 🎨 Warcraft Portfolio - Asset Strategy & APIs

## Asset Philosophy

**Constraint**: No copyrighted Warcraft III/DOTA assets. Everything is:
- Free/open-source alternatives
- AI-generated placeholders
- Stylized inspired-by designs
- API-fetched data

---

## 🖼️ Visual Asset Plan

### 1. Character Sprites (Heroes & Units)

#### Option A: LPC Sprite Generator (Free)
**Tool**: [LPC Character Generator](https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/)

**Pros**:
- Completely free (CC-BY-SA 3.0 / GPL 3.0)
- 4-directional walk animations
- Customizable: hair, clothes, weapons
- Can mix Filipino elements (barong, salakot)

**Implementation**:
```typescript
// Generate 4 heroes with different looks
const heroes = [
  { name: 'melvin', outfit: 'mage_robes', hat: 'salakot' },
  { name: 'frontend', outfit: 'green_tunic', weapon: 'staff' },
  { name: 'backend', outfit: 'heavy_armor', shield: 'tower_shield' },
  { name: 'devops', outfit: 'commander', weapon: 'war_hammer' },
];
```

#### Option B: Craftpix Free Sprites
**Source**: [Craftpix RPG Characters](https://craftpix.net/freebies/free-rpg-character-sprites/)

**Recommended Packs**:
1. "Fantasy Characters" - For heroes
2. "Dungeon Enemies" - For creeps
3. "RTS Units" - For scale reference

#### Option C: AI Generation (Leonardo.ai)
**Prompt Template**:
```
"16-bit pixel art RPG character sprite, Filipino warrior mage, 
red and gold robes, top-down view, 4-directional walking animation, 
warcraft 3 style, dota aesthetic, game sprite sheet, 
white background, 64x64 pixels"
```

### 2. Environment Tilesets

| World | Theme | Free Asset Source |
|-------|-------|-------------------|
| **Town** (Mid) | Filipino Fiesta + Fantasy | OpenGameArt: "RPG Tileset" + custom |
| **Forest** (West) | Philippine Jungle + Night Elf | OpenGameArt: "Forest Tiles" |
| **Frozen** (East) | Banaue + Frozen Throne | OpenGameArt: "Winter Tileset" |
| **Mountain** (North) | Sagada + Ice Peaks | OpenGameArt: "Mountain Tiles" |
| **Throne** (Center) | Sarimanok Palace | Custom + "Castle Tileset" |

**Color Modification**:
```typescript
// Load tileset and recolor to match palette
k.loadSprite("forest_tileset", "/tilesets/forest.png", {
  shader: "colorReplace",
  // Replace greens with golds/blues
});
```

### 3. UI Elements

#### Frames & Borders
- **Source**: [OpenGameArt UI Borders](https://opengameart.org/content/rpg-ui-border)
- **Style**: Stone/wood with gold trim
- **Colors**: Dark brown (#3D2817) + Gold (#D4AF37)

#### Skill Icons (DOTA-Style)
**Strategy**: Create simple geometric icons

```typescript
// Generate programmatically or use Devicon
const skillIcons = {
  react: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  typescript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  // Apply filter for DOTA look
};

// Style with CSS filter
.dota-skill-icon {
  filter: sepia(30%) saturate(150%) contrast(110%);
  border: 2px solid #8B6914;
  border-radius: 4px;
  background: #1a1a1a;
}
```

#### Minimap
```typescript
// Procedural generation
const minimap = k.add([
  k.rect(200, 200),
  k.color(k.Color.fromHex('#0D0D0D')),
  k.outline(2, k.Color.fromHex('#D4AF37')),
  k.fixed(),
  k.pos(20, k.height() - 220),
]);

// Draw world representation
minimap.onDraw(() => {
  // Draw simplified world map
  // Draw hero position as dot
  // Draw discovered areas
});
```

---

## 🔌 External APIs

### 1. GitHub API (Primary Data Source)

**Endpoint**: `https://api.github.com/users/mviner000/repos`

**Data Mapping**:
```typescript
interface GitHubRepo {
  name: string;
  description: string;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  language: string;
  topics: string[];
  created_at: string;
  updated_at: string;
}

// Transform to game quest
const repoToQuest = (repo: GitHubRepo): Quest => ({
  id: repo.name,
  title: formatTitle(repo.name),
  description: repo.description || "An ancient project of great power...",
  category: categorizeByStars(repo.stargazers_count),
  technologies: [repo.language, ...repo.topics].filter(Boolean),
  links: {
    source: repo.html_url,
    demo: repo.homepage,
  },
  // Game stats (for fun)
  difficulty: calculateDifficulty(repo),
  reward: generateReward(repo),
});
```

**Rate Limits**:
- 60 requests/hour (unauthenticated)
- 5000 requests/hour (authenticated with token)

**Solution**: Cache in localStorage, refresh on page load if >1 hour old.

### 2. Screenshot/Thumbnail APIs

#### Option A: ScreenshotOne (Recommended)
**URL**: `https://api.screenshotone.com/take`
**Pricing**: Free tier: 100 screenshots/month

```typescript
const getProjectThumbnail = (url: string) => 
  `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&access_key=FREE_TIER_KEY&viewport_width=1280&viewport_height=720`;
```

#### Option B: URL2PNG
**Pricing**: Paid (but cheap)

#### Option C: DIY Puppeteer (Future)
Self-hosted screenshot service.

### 3. Tech Stack Icons

**Devicon CDN** (Free, always available):
```typescript
const techIcons = {
  react: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  typescript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  nodejs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
  python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  // ... etc
};
```

**Style**: Apply CSS filter for unified look:
```css
.tech-icon {
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
  background: radial-gradient(circle, #2d2d2d 0%, #1a1a1a 100%);
  border: 2px solid #8B6914;
  border-radius: 8px;
  padding: 8px;
}
```

### 4. Filipino Cultural Assets

#### Baybayin Text Generator
**API**: None needed - use font
```css
@font-face {
  font-family: 'Baybayin';
  src: url('/fonts/baybayin.ttf');
}

.ancient-text {
  font-family: 'Baybayin', serif;
  color: #D4AF37;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
}
```

#### Pattern Generators
- **Okir Patterns**: Use SVG patterns or CSS gradients
- **Sarimanok**: AI-generated or simplified vector

---

## 🎵 Audio Strategy

### Music (Free Sources)

| Location | Mood | Source | Track Example |
|----------|------|--------|---------------|
| Menu | Epic orchestral | Free Music Archive | "Fantasy Theme" |
| Town | Fiesta upbeat | YouTube Audio Library | Filipino folk-inspired |
| Forest | Mysterious | OpenGameArt | "Enchanted Forest" |
| Battle | Intense | Incompetech (Kevin MacLeod) | "Epic Battle" |
| Victory | Triumphant | FreePD | "Victory Fanfare" |

### Sound Effects

**Generation**: Use sfxr or similar
```typescript
// Generate placeholder SFX
const sfxMap = {
  attack: '/sfx/attack.wav',
  spell: '/sfx/spell.wav',
  ui_click: '/sfx/click.wav',
  quest_complete: '/sfx/victory.wav',
};

// Or use Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
```

---

## 📦 Asset Manifest

```json
{
  "sprites": {
    "heroes": {
      "melvin": { "path": "/sprites/heroes/melvin.png", "size": [64, 64] },
      "frontend": { "path": "/sprites/heroes/frontend.png", "size": [64, 64] },
      "backend": { "path": "/sprites/heroes/backend.png", "size": [64, 64] },
      "devops": { "path": "/sprites/heroes/devops.png", "size": [64, 64] }
    },
    "creeps": {
      "kobold": { "path": "/sprites/creeps/kobold.png", "count": 3 },
      "golem": { "path": "/sprites/creeps/golem.png", "count": 2 },
      "dragon": { "path": "/sprites/creeps/dragon.png", "count": 1 }
    },
    "buildings": {
      "ancient": { "path": "/sprites/buildings/ancient.png", "size": [128, 128] },
      "obelisk": { "path": "/sprites/buildings/obelisk.png", "size": [96, 96] }
    },
    "ui": {
      "frame": { "path": "/sprites/ui/frame.png", "slice": 16 },
      "button": { "path": "/sprites/ui/button.png", "slice": 8 },
      "minimap": { "path": "/sprites/ui/minimap.png" }
    }
  },
  "tilesets": {
    "town": { "path": "/tilesets/town.png", "tileSize": 32 },
    "forest": { "path": "/tilesets/forest.png", "tileSize": 32 },
    "frozen": { "path": "/tilesets/frozen.png", "tileSize": 32 }
  },
  "audio": {
    "music": {
      "menu": { "path": "/audio/music/menu.mp3", "loop": true },
      "town": { "path": "/audio/music/town.mp3", "loop": true },
      "battle": { "path": "/audio/music/battle.mp3", "loop": true }
    },
    "sfx": {
      "attack": { "path": "/audio/sfx/attack.wav" },
      "spell": { "path": "/audio/sfx/spell.wav" },
      "click": { "path": "/audio/sfx/click.wav" }
    }
  },
  "fonts": {
    "title": { "path": "/fonts/cinzel.ttf", "family": "Cinzel" },
    "body": { "path": "/fonts/ibm-plex.ttf", "family": "IBM Plex Sans" },
    "rune": { "path": "/fonts/baybayin.ttf", "family": "Baybayin" }
  }
}
```

---

## 🚀 Implementation Priority

### Phase 1: MVP (Week 1-2)
**Assets Needed**:
- [ ] 1 Hero sprite (Melvin only) - LPC generator
- [ ] 1 Tileset (Town) - OpenGameArt
- [ ] Basic UI frame - CSS borders (no images)
- [ ] Devicon tech stack icons
- [ ] GitHub API integration

### Phase 2: Content (Week 3-4)
**Assets Needed**:
- [ ] 4 Hero sprites (all classes)
- [ ] 3 Creep types
- [ ] 2 Building types
- [ ] 3 World tilesets
- [ ] Placeholder music (1 track)

### Phase 3: Polish (Week 5-6)
**Assets Needed**:
- [ ] All creep variants
- [ ] Particle effects
- [ ] Skill icons (custom)
- [ ] Full soundtrack
- [ ] Sound effects

### Phase 4: Launch (Week 7)
**Assets Needed**:
- [ ] Project screenshots (via API)
- [ ] Filipino cultural elements
- [ ] Final UI polish
- [ ] Performance optimization

---

*All assets will be placeholder-quality for MVP, upgraded as development progresses.*
