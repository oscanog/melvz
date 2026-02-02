# 🎮 Agent: Game Developer

## Role Summary
The Game Developer owns all **Kaplay game engine** code, handling game logic, player mechanics, entities, and the game world.

## Responsibilities

### Primary
- Player movement and controls
- Game entity creation and management
- Collision detection and physics
- Camera control and zoom
- Section layouts and positioning
- Game state integration with Jotai

### Secondary
- Sprite loading and animation
- Game performance optimization
- Input handling (keyboard/mouse/touch)
- Game world boundaries

## Technical Stack
- **Engine:** Kaplay (Kaboom.js successor) v3001.0.0-beta.8
- **Language:** JavaScript (ES Modules)
- **State:** Jotai atoms for React-Game bridge

## Key Files

| File | Purpose |
|------|---------|
| `src/initGame.js` | Game initialization, scene setup |
| `src/kaplayCtx.js` | Kaplay context configuration |
| `src/entities/Player.js` | Player entity logic |
| `src/components/Section.js` | Game section components |
| `src/components/SocialIcon.js` | Social icon entities |
| `src/components/SkillIcon.js` | Skill icon entities |
| `src/components/ProjectCard.js` | Project card entities |
| `src/components/WorkExperienceCard.js` | Experience card entities |
| `src/components/EmailIcon.js` | Email icon entity |
| `src/utils.js` | Game utilities |
| `src/constants.js` | Game constants (PALETTE, etc.) |

## Code Patterns

### Creating a Component
```javascript
// Pattern from src/components/Section.js
export default function makeSection(k, pos, sectionName, onAddChildren) {
  const section = k.add([
    k.pos(pos),
    k.area(),
    "section",
  ]);

  // Section label
  section.add([
    k.text(sectionName, { font: "ibm-bold", size: 48 }),
    k.color(k.Color.fromHex(PALETTE.color1)),
    k.pos(0, -80),
  ]);

  onAddChildren(section);
  return section;
}
```

### Player Movement Pattern
```javascript
// Player controls with 8-directional animation
k.onMouseDown((mouseBtn) => {
  if (mouseBtn !== "left") return;
  
  const worldMousePos = k.toWorld(k.mousePos());
  const player = k.get("player")[0];
  
  if (!player) return;
  
  // Calculate direction and set animation
  const dir = worldMousePos.sub(player.pos).unit();
  player.setMovementDir(dir);
});
```

### State Integration
```javascript
// Import from store.js
import { cameraZoomValueAtom, store } from "./store";

// Read state
const cameraZoomValue = store.get(cameraZoomValueAtom);

// Update state
store.set(cameraZoomValueAtom, 0.5);
```

## Game Architecture

### Scene Layout
```
Section 1: About/Socials (Top)
    ↑
Section 2: Skills (Left) ← Player Spawn → Section 3: Experience (Right)
    ↓
Section 4: Projects (Bottom)
```

### Entity Tags Used
| Tag | Purpose |
|-----|---------|
| `player` | Player character |
| `section` | Game sections |
| `social-icon` | Clickable social links |
| `skill-icon` | Bouncy skill icons |
| `project-card` | Clickable project cards |
| `work-experience-card` | Experience entries |
| `email-icon` | Email contact |

## Common Tasks

### Add a New Section
1. Create section component in `src/components/`
2. Add section call in `initGame.js`
3. Position using `k.vec2(x, y)` relative to center

### Modify Player Behavior
1. Edit `src/entities/Player.js`
2. Update speed: default is 700
3. Animation frames are in sliceX: 4, sliceY: 8

### Add New Entity Type
1. Create file in `src/components/`
2. Export default function that takes `k, parent, pos, ...`
3. Use `parent.add([...components])` pattern
4. Add tag for identification

## Integration with React

### Opening Modals from Game
```javascript
// Use Jotai store to trigger React modals
import { store, isProjectModalOpenAtom, currentProjectAtom } from "./store";

// In game component
k.onClick("project-card", (projectCard) => {
  store.set(currentProjectAtom, projectCard.projectData);
  store.set(isProjectModalOpenAtom, true);
});
```

## Performance Considerations
- Use `k.fixed()` for UI elements
- Limit physics bodies
- Use `k.uvquad()` with shader for animated backgrounds

## Collaboration Points

### With Frontend Developer
- Coordinate on Jotai atoms for state sharing
- Discuss modal triggering from game events

### With Graphics Developer
- Implement shader backgrounds
- Apply visual effects to entities

### With Content Manager
- Consume JSON configs for dynamic content
- Ensure entity positions match data

### With Document Lead
- Document game mechanics
- Maintain entity creation patterns
