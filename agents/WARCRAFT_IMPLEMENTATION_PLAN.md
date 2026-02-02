# 🗓️ Warcraft Portfolio - Implementation Plan

## Overview
**Timeline**: 8 weeks (2 months)  
**Team**: 1 Developer (solo project)  
**Goal**: Fully playable RTS-style portfolio game

---

## Phase 0: Foundation & Cleanup (Week 0)
**Goal**: Prepare codebase, remove old game, set up new architecture

### Tasks
- [ ] Create new branch `warcraft-portfolio`
- [ ] Remove all old game files (Player, Sections, etc.)
- [ ] Set up new folder structure (`src/game/`, `src/worlds/`)
- [ ] Update `vite.config.ts` for new asset paths
- [ ] Create base Game class
- [ ] Set up Jotai stores for new game state

### Deliverables
- Empty game canvas running
- New folder structure in place
- Build passes

**Effort**: 1 day

---

## Phase 1: Core Engine (Week 1)
**Goal**: Basic RTS camera, movement, selection

### Week 1, Day 1-2: Camera System
- [ ] Implement edge-scrolling camera
- [ ] Mouse drag panning
- [ ] Zoom in/out (mouse wheel)
- [ ] Minimap (visual only)

### Week 1, Day 3-4: Entity System
- [ ] Base Entity class
- [ ] Hero entity with selection ring
- [ ] Click to select
- [ ] Right-click to move (basic, no pathfinding)

### Week 1, Day 5-7: Input & UI
- [ ] Keyboard shortcuts (1-4 select heroes)
- [ ] React HUD overlay
- [ ] Hero selection panel (bottom)
- [ ] Resource bar (top)

### Deliverables
- Move camera around empty world
- Select hero, move with right-click
- See HUD elements

**Effort**: 1 week

---

## Phase 2: First World - Town of Origin (Week 2)
**Goal**: Complete "About" section as first playable area

### Week 2, Day 1-2: World Generation
- [ ] Tilemap system
- [ ] Load Town tileset (placeholder)
- [ ] Place buildings (Ancient Protectors as placeholders)
- [ ] Set world boundaries

### Week 2, Day 3-4: Interactions
- [ ] Click building → Open "Spell Tome" modal
- [ ] Display bio content in tome style
- [ ] Typewriter effect for text
- [ ] Close button (Esc or X)

### Week 2, Day 5-7: Hero & Polish
- [ ] Melvin hero sprite (LPC generated)
- [ ] Spawn hero in town center
- [ ] Idle animation
- [ ] Walking animation (4-directional)

### Content Integration
```json
{
  "hero": {
    "name": "Melvin the Code Warden",
    "title": "Full Stack Legend",
    "bio": "A warrior from the digital realms of Azgardia...",
    "portrait": "/heroes/melvin-portrait.png"
  },
  "town_buildings": [
    { "id": "about", "name": "Tome of Origins", "content": "..." },
    { "id": "contact", "name": "Raven's Roost", "content": "..." }
  ]
}
```

### Deliverables
- Walk around Town
- Click buildings, read content
- Hero animations working

**Effort**: 1 week

---

## Phase 3: Projects World - Sentinel Forest (Week 3)
**Goal**: Projects as "Ancient Protectors" (DOTA towers)

### Week 3, Day 1-2: World Setup
- [ ] Forest tileset
- [ ] Generate forest world (West)
- [ ] Portal from Town to Forest
- [ ] Fog of war effect (simple)

### Week 3, Day 3-4: Project Buildings
- [ ] Ancient Protector sprite
- [ ] GitHub API integration
- [ ] Fetch real repos
- [ ] Convert repos to "Protectors"

### Week 3, Day 5-7: Quest System
- [ ] Quest log UI (Warcraft style)
- [ ] Click Protector → Open Quest
- [ ] Quest details in tome format
- [ ] Links to GitHub/Demo

### Content Integration
```typescript
// Auto-generated from GitHub API
interface ProjectQuest {
  id: string;           // repo name
  name: string;         // formatted title
  description: string;  // repo description
  category: 'kobold' | 'golem' | 'dragon'; // based on complexity
  tech_stack: string[];
  links: {
    source: string;
    demo?: string;
  };
  stats: {
    stars: number;
    forks: number;
  };
}
```

### Deliverables
- Travel to Forest world
- See real projects as towers
- Click to view project details
- Links work

**Effort**: 1 week

---

## Phase 4: Skills World - Frozen Throne (Week 4)
**Goal**: Tech stack as "Obelisks of Power"

### Week 4, Day 1-2: World Setup
- [ ] Frozen/Ice tileset
- [ ] Generate frozen world (East)
- [ ] Portal connections

### Week 4, Day 3-4: Skill System
- [ ] Obelisk sprites
- [ ] Skill data structure
- [ ] "Shatter" animation on click
- [ ] Skill details modal

### Week 4, Day 5-7: Skill Tree UI
- [ ] DOTA-style skill panel
- [ ] Q/W/E/R hotkeys
- [ ] Tooltips on hover
- [ ] Skill level indicators (1-4 dots)

### Content Integration
```typescript
const skills = [
  {
    id: 'react',
    name: 'React Mastery',
    description: 'Summon component-based UIs with virtual DOM magic',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    level: 4,
    category: 'frontend',
    hotkey: 'Q'
  },
  // ... more skills
];
```

### Deliverables
- Travel to Frozen world
- Click obelisks to view skills
- Skill tree UI functional
- Hotkeys work

**Effort**: 1 week

---

## Phase 5: Experience & Contact (Week 5)
**Goal**: Complete remaining worlds

### Week 5, Day 1-2: Mountain World (Contact)
- [ ] Mountain tileset
- [ ] Signal fire mechanic
- [ ] Social links as "fires to light"
- [ ] Email raven animation

### Week 5, Day 3-5: Throne World (Experience)
- [ ] Throne room tileset
- [ ] Campaign mission select UI
- [ ] Experience as "missions"
- [ ] Mission briefings (Warcraft style)

### Week 5, Day 6-7: World Connections
- [ ] All portals working
- [ ] World transition animations
- [ ] Loading screens

### Deliverables
- All 5 worlds accessible
- Contact page functional
- Experience timeline viewable

**Effort**: 1 week

---

## Phase 6: Combat & Gameplay (Week 6)
**Goal**: Make it feel like a real game

### Week 6, Day 1-2: Creeps
- [ ] Spawn creeps in worlds
- [ ] Basic AI (patrol, chase)
- [ ] Attack animations
- [ ] Death animations

### Week 6, Day 3-4: Combat System
- [ ] Attack command (A + click)
- [ ] Health bars
- [ ] Damage numbers
- [ ] Simple combat logic

### Week 6, Day 5-7: Rewards
- [ ] Defeating creeps → Unlock content
- [ ] Achievement system
- [ ] "Conquered" visual on completed quests
- [ ] Victory effects (confetti, sound)

### Deliverables
- Fight creeps
- Unlock content by defeating them
- Combat feels responsive

**Effort**: 1 week

---

## Phase 7: Polish & Audio (Week 7)
**Goal**: Professional feel

### Week 7, Day 1-2: Visual Polish
- [ ] Particle effects (spells, attacks)
- [ ] Screen shake on impact
- [ ] Better animations
- [ ] Lighting effects

### Week 7, Day 3-4: Audio
- [ ] Background music (1 track per world)
- [ ] UI sound effects
- [ ] Combat sounds
- [ ] Ambient sounds

### Week 7, Day 5-7: UI Polish
- [ ] Loading screen
- [ ] Main menu
- [ ] Settings panel
- [ ] Mobile responsiveness

### Deliverables
- Audio working
- Visual effects active
- Mobile playable

**Effort**: 1 week

---

## Phase 8: Launch Prep (Week 8)
**Goal**: Deploy and announce

### Week 8, Day 1-3: Testing
- [ ] Play through all worlds
- [ ] Test all links
- [ ] Mobile testing
- [ ] Performance profiling

### Week 8, Day 4-5: Content
- [ ] Finalize all text content
- [ ] Update project data
- [ ] Proofreading
- [ ] Screenshot generation

### Week 8, Day 6-7: Deploy
- [ ] Build for production
- [ ] Deploy to GitHub Pages
- [ ] Custom domain setup (optional)
- [ ] Social media announcement

### Deliverables
- Live portfolio game
- All content accurate
- Mobile optimized

**Effort**: 1 week

---

## Summary Timeline

```
Week 0: ████ Foundation
Week 1: ████ Core Engine
Week 2: ████ Town World
Week 3: ████ Forest World
Week 4: ████ Frozen World
Week 5: ████ Mountain/Throne
Week 6: ████ Combat
Week 7: ████ Polish
Week 8: ████ Launch
```

---

## Risk Mitigation

### Risk: Asset creation takes too long
**Mitigation**: 
- Use LPC generator (automated)
- Start with colored rectangles as sprites
- Upgrade visuals in Phase 7

### Risk: GitHub API rate limits
**Mitigation**:
- Cache aggressively
- Have fallback JSON data
- Don't refresh on every load

### Risk: Performance issues
**Mitigation**:
- Test on low-end devices weekly
- Object pooling from start
- LOD system for distant entities

### Risk: Scope creep
**Mitigation**:
- Strict MVP definition
- Cut features if behind schedule
- Multiplayer deferred to v2

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Load Time | < 3 seconds | Lighthouse |
| FPS | 60 stable | Chrome DevTools |
| Time on Site | > 2 minutes | Analytics |
| Projects Viewed | > 3 per visit | Event tracking |
| Mobile Users | > 30% | Analytics |
| Bounce Rate | < 40% | Analytics |

---

## Post-Launch Roadmap

### v1.1 (Month 2)
- [ ] Achievement system
- [ ] Visitor guestbook (rune stones)
- [ ] Dark/light mode toggle

### v1.2 (Month 3)
- [ ] Boss battles for each world
- [ ] Equipment/loot system (cosmetic)
- [ ] Speed run timer

### v2.0 (Future)
- [ ] Multiplayer (WebRTC)
- [ ] Level editor for visitors
- [ ] NFT integration (just kidding)

---

*"Ang lalaking may hangarin, nagiging bayani."*  
*(A man with determination becomes a hero.)* 🇵🇭

**Let's build this legend.** ⚔️
