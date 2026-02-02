# 🎮 Warcraft III Filipino Portfolio - Game Design Document

## Executive Summary

Transform the portfolio into an **interactive Warcraft III/DOTA 1-inspired strategy game** with Filipino cultural elements. The player (recruiter/visitor) commands hero units representing Melvin's skills and projects, battling through "levels" that represent career milestones and project showcases.

---

## 🎯 Core Concept

### "The Quest for the Legendary Developer"

**Theme**: Warcraft III: The Frozen Throne meets Filipino mythology and DOTA nostalgia
**Genre**: Real-time Strategy / Tower Defense / Interactive Portfolio
**Target**: Recruiters, clients, fellow developers

### Story Premise
> *"In the land of Azgardia (Pilipinas), a young developer named Melvin E. Nogoy rises through the ranks of the Code Wardens. Command his hero units, explore his skill tree, and conquer the Towers of Legacy to uncover his greatest works."*

---

## 🎨 Visual Identity

### Color Palette (DOTA 1 / Warcraft III Inspired)
```
Primary Colors:
- Health Red: #8B0000 / #CC0000
- Mana Blue: #0066CC / #3399FF  
- Gold/Yellow: #FFD700 / #FFAA00
- Dark UI: #1A1A1A / #2D2D2D
- Fog of War: #0D0D0D

Filipino Accent Colors:
- Baybayin Gold: #D4AF37
- Sun Yellow: #FCD116
- Blue Field: #0038A8
- Red Stripe: #CE1126
- Jade Green: #00A86B (Jade Vine)
```

### UI Style
- **Font**: Friz Quadrata (Warcraft style) or Cinzel for headers
- **Borders**: Stone/wood textured panels with gold trim
- **Minimap**: Bottom-left corner (classic RTS)
- **Resource Bar**: Top-right (Gold = Projects, Lumber = Skills, Food = Experience)
- **Hero Panel**: Bottom-center with skill icons

---

## 🕹️ Game Mechanics

### 1. Hero Units (Melvin's Personas)

Each hero represents a domain expertise:

| Hero Name | Class | Represents | Ultimate Skill |
|-----------|-------|------------|----------------|
| **Melvin the Code Warden** | Spellcaster | Full Stack Dev | "Git Push Oblivion" - Deploys all projects at once |
| **Magician ng Maynila** | Summoner | Frontend/React | "Virtual DOM Storm" - Summons component clones |
| **Back-End Bantay** | Tank | Backend/Node | "Database Fortress" - Invulnerable defense wall |
| **UI/UX Diwata** | Support | Design | "Golden Ratio Blessing" - Perfect alignment aura |
| **DevOps Datu** | Commander | DevOps/CI/CD | "Pipeline of Destiny" - Auto-deploys everything |

### 2. The Skill Tree (Tech Stack)

DOTA-style skill tree instead of simple skill icons:

```
                    [React Mastery]
                         |
    [TypeScript] ---- [JavaScript] ---- [Node.js]
         |                  |                  |
    [Next.js]          [HTML/CSS]        [Express]
         |                  |                  |
    [Tailwind]         [Framer]          [PostgreSQL]
         \                  |                  /
          \            [Kaplay]             /
           \              |               /
            ===== [Full Stack Legend] =====
```

Each skill is a clickable ability with:
- Icon (DOTA-style square)
- Level indicator (1-4 dots)
- Description tooltip
- "Cast" animation when clicked

### 3. The Map (Portfolio Sections)

Instead of 4 static sections, create an **RTS world map**:

```
                    ┌─────────────────┐
                    │  ICEWIND PASS   │ ← Contact/Socials
                    │   (Top Lane)    │   (Frozen wasteland theme)
                    └────────┬────────┘
                             │
    ┌─────────────┐         │         ┌─────────────┐
    │  SENTINEL   │─────────┼─────────│   SCOURGE   │
    │    BASE     │         │         │    BASE     │
    │ (Projects)  │    ┌────┴────┐    │  (Skills)   │
    │  West Lane  │    │ MID LANE│    │  East Lane  │
    └─────────────┘    │  (About)│    └─────────────┘
                       │  Town   │
                       └────┬────┘
                            │
                    ┌───────┴───────┐
                    │  ANCIENT'S    │ ← Experience/Career
                    │    THRONE     │   (Final boss arena)
                    └───────────────┘
```

### 4. Interactive Elements

**Instead of walking to cards, players:**

1. **Select Hero** → Click on hero portrait (like DOTA)
2. **Move Hero** → Right-click on map (RTS controls)
3. **Attack/Cast** → Click on enemies or press Q/W/E/R (DOTA hotkeys)
4. **View Projects** → Heroes "conquer" towers that reveal project details

### 5. The "Creeps" (Interactive Elements)

| Creep Type | Represents | Interaction |
|------------|------------|-------------|
| **Kobold Worker** | Small projects/snippets | Click to view code snippet |
| **Golem Guardian** | Major projects | Defeat to unlock project modal |
| **Dragon Boss** | Featured/capstone project | Epic battle, reveals detailed case study |
| **Rune Spirits** | Skills/Tech icons | Collect to "learn" new skills |
| **Treasure Chests** | Achievements/Awards | Click to open, confetti animation |

---

## 🗺️ World Sections (Portfolio Content)

### 1. MID LANE - Town of Origin (About Section)
**Theme**: Filipino barrio/bayan during fiesta
**Background**: Rice terraces, bahay kubo, banderitas
**Hero**: Young Melvin (starting hero)
**Content**:
- Brief bio with typewriter effect
- Profile picture in circular Warcraft-style portrait
- "Quest Log" button → Opens journey/career timeline

### 2. WEST LANE - Sentinel Base (Projects)
**Theme**: Night Elf forest (Sentinel) + Philippine jungle
**Structures**: Ancient Protectors that represent projects
**Interaction**:
- Each Ancient = One project
- Click Ancient → Tree opens, reveals project card
- Project cards styled as "Spell Tomes"
- Live demo = "Portal to the Realm"
- GitHub = "Ancient Manuscript"

### 3. EAST LANE - Scourge Territory (Skills)
**Theme**: Undead Frozen Throne + Banaue rice terraces (icy)
**Structure**: Obelisks of Power
**Interaction**:
- Each Obelisk = Skill category
- Destroying (clicking) obelisk reveals skill details
- Skill levels shown as "Frozen Runes" (1-4)

### 4. TOP LANE - Icewind Pass (Contact/Socials)
**Theme**: Frozen peaks + Benguet/ Sagada
**Structure**: Signal fires (like DOTA's side lanes)
**Interaction**:
- Light the fires to open social links
- Smoke signals animation
- Email = "Sending Raven" (raven flies away animation)

### 5. ANCIENT'S THRONE (Experience/Career)
**Theme**: Throne room with Filipino elements (sarimanok, okir patterns)
**Boss**: Adult Melvin in full armor
**Content**: Timeline as "Campaign Missions"
- Each mission = Job/Experience
- Victory screen style cards
- "Campaign Progress" bar

---

## 🎮 Controls & UX

### Keyboard Shortcuts (DOTA Style)
| Key | Action |
|-----|--------|
| Q/W/E/R | Cast Hero Skills |
| A | Attack move |
| H | Hold position |
| M | Move |
| 1-5 | Select hero groups |
| Tab | Toggle hero stats |
| Esc | Close modal/menu |
| F1 | Help/Controls |
| Space | Center camera on hero |

### Mouse Controls
- **Left Click**: Select unit, click buttons
- **Right Click**: Move hero, attack target
- **Scroll**: Zoom in/out (camera)
- **Drag**: Pan camera (when at map edges)

### Mobile Adaptation
- Virtual joystick (bottom-left)
- Action buttons (bottom-right): Move, Attack, Skills
- Tap to select/interact
- Pinch to zoom

---

## 🖼️ Asset Strategy

### Option A: Free Placeholder Assets

**Character Sprites**:
- OpenGameArt: "LPC Character Generator" (customize to Filipino look)
- Craftpix: Free RPG character sprites
- itch.io: "Generic RPG Pack" assets

**Environment**:
- OpenGameArt: "RPG Tilesets" (modify colors)
- Craftpix: Free RTS tilesets

**UI Elements**:
- RPG UI borders from OpenGameArt
- Custom build for DOTA-style skill icons

### Option B: AI-Generated Assets (Placeholders)

Use Stable Diffusion/Leonardo.ai for:
- Filipino fantasy character portraits
- Warcraft-style environment backgrounds
- Icon sprites for skills

### Option C: API-Based Assets

**For Project Thumbnails**:
- GitHub API: Fetch repo screenshots
- URL2PNG API: Generate website screenshots
- Placehold.co: Simple placeholders

**For Icons**:
- SimpleIcons API: Tech stack logos
- Devicon: Developer icons
- Custom sprite sheet for RPG icons

---

## 🔧 Technical Architecture

### Core Systems

```
┌─────────────────────────────────────────────┐
│           GAME ENGINE (Kaplay)              │
├─────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Hero System │  │  Camera Controller  │  │
│  │ (Movement,  │  │  (RTS-style, minimap)│ │
│  │  Combat)    │  └─────────────────────┘  │
│  └─────────────┘                           │
│  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Skill Tree  │  │   Entity Spawner    │  │
│  │ (Upgrades)  │  │ (Creeps, Buildings) │  │
│  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Quest System│  │  Particle Effects   │  │
│  │ (Portfolio  │  │  (Spells, Ambient)  │  │
│  │  content)   │  │                     │  │
│  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────┘
```

### State Management (Jotai)

```typescript
// Game State
const gameStateAtom = atom<'menu' | 'playing' | 'modal'>('menu');
const selectedHeroAtom = atom<Hero | null>(null);
const cameraPositionAtom = atom<Vec2>({ x: 0, y: 0 });

// Portfolio Data (loaded from JSON)
const projectsAtom = atom<Project[]>();
const skillsAtom = atom<Skill[]>();
const experienceAtom = atom<Experience[]>();

// Player Progress
const unlockedProjectsAtom = atom<string[]>([]);
const viewedSkillsAtom = atom<string[]>([]);
const defeatedBossesAtom = atom<string[]>([]);
```

---

## 📱 Portfolio Content Integration

### Project Cards → Spell Tomes

**Visual Design**:
- Closed: Ancient book with project name as runes
- Open: Book spreads, left page = screenshot, right page = details
- Animation: Book flips open with particle effect

**Content Structure**:
```typescript
interface ProjectTome {
  id: string;
  title: string;           // "Sonic Runner"
  category: 'spell' | 'artifact' | 'legendary';
  thumbnail: string;       // Project screenshot
  description: string;     // Lore-style description
  technologies: string[];  // As "required mana types"
  liveLink: string;        // "Portal to Realm"
  sourceLink: string;      // "Ancient Manuscript"
  
  // Game stats (just for fun)
  manaCost: number;
  cooldown: number;
  damage: string;          // "High Impact"
}
```

### Experience → Campaign Missions

**Visual Design**: 
- Warcraft III mission select screen
- Map with glowing mission markers
- Completed = Gold checkmark
- Current = Pulsing marker
- Locked = Grayed out

**Content**:
```typescript
interface CampaignMission {
  id: string;
  title: string;           // Job title as mission name
  company: string;         // "The Kingdom of [Company]"
  period: string;          // "Year 2020-2023"
  description: string;     // Mission briefing style
  objectives: string[];    // Accomplishments as quest objectives
  completed: boolean;
  rewards: string[];       // Skills learned
}
```

---

## 🎵 Audio Design

### Music (Placeholder/Free)
- **Menu**: Filipino folk music with fantasy orchestration
- **Town**: Upbeat fiesta music
- **Forest**: Ambient nature + bamboo flute
- **Battle**: Epic orchestral with kulintang percussion
- **Boss**: Intense Filipino-heavy metal fusion

Sources:
- Free Music Archive
- OpenGameArt music
- YouTube Audio Library
- Original Filipino folk music (public domain)

### Sound Effects
- Warcraft II/III style UI clicks
- DOTA ability cast sounds (inspired, not copied)
- Filipino ambience (roosters, jeepney horns in distance)

---

## 📊 Success Metrics

### User Engagement
- Time spent on portfolio
- Number of "battles" (interactions)
- Projects "conquered" (viewed)
- Skills "learned" (clicked)

### Technical
- Load time < 3 seconds
- 60 FPS gameplay
- Mobile responsiveness
- Accessibility (keyboard nav, screen reader)

---

## 🚀 Future Expansions

1. **Multiplayer Mode**: Visitors can leave messages as "runes"
2. **Daily Quests**: GitHub activity as daily challenges
3. **Achievements**: "Viewed all projects", "Spent 5 minutes"
4. **New Game+**: Hard mode with faster enemies
5. **DLC**: Blog section as "Side Quests"

---

*"Ang hindi lumingon sa pinanggalingan, hindi makararating sa paroroonan."*  
*(He who does not look back at his origins will not reach his destination.)*  
— Let's build something legendary. 🇵🇭⚔️
