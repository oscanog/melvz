# 🤖 Agent Team - 2D Portfolio Project

## Project Overview
This is a **developer portfolio as a 2D game** built with:
- **Frontend Framework:** React 18 + Vite
- **Game Engine:** Kaplay (Kaboom.js successor)
- **State Management:** Jotai
- **Animations:** Framer Motion
- **Graphics:** Custom GLSL shaders, sprite-based
- **Styling:** CSS with custom color palette

## Agent Team Structure

| Agent | Role | Primary Focus |
|-------|------|---------------|
| [Document Lead](./document-lead.md) | 📚 Documentation Owner | All project documentation, README, guides |
| [Game Developer](./game-developer.md) | 🎮 Game Logic | Kaplay engine, player mechanics, entities, collisions |
| [Frontend Developer](./frontend-developer.md) | ⚛️ React/UI | React components, modals, UI overlays, styling |
| [Graphics Developer](./graphics-developer.md) | 🎨 Visual Effects | GLSL shaders, sprite animations, visual polish |
| [Content Manager](./content-manager.md) | 📝 Content | JSON configs, portfolio data, text content |
| [DevOps Engineer](./devops-engineer.md) | 🚀 Build & Deploy | Vite config, build optimization, CI/CD, deployment |

## Collaboration Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCUMENT LEAD                            │
│              (Maintains all documentation)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   GAME DEV   │ │  FRONTEND    │ │   GRAPHICS   │
│  (Kaplay)    │ │   (React)    │ │   (GLSL)     │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌──────────────────┐
              │  CONTENT MANAGER │
              │  (JSON configs)  │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  DEVOPS ENGINEER │
              │ (Build/Deploy)   │
              └──────────────────┘
```

## 📚 Migration Resources

This project is currently being migrated from JavaScript to TypeScript with updated dependencies.

| Document | Purpose |
|----------|---------|
| [OUTDATED_STACK_ANALYSIS.md](./OUTDATED_STACK_ANALYSIS.md) | Current vs latest dependency versions |
| [TYPESCRIPT_MIGRATION_PLAN.md](./TYPESCRIPT_MIGRATION_PLAN.md) | 8-phase detailed migration plan |
| [TYPESCRIPT_MIGRATION_CHECKLIST.md](./TYPESCRIPT_MIGRATION_CHECKLIST.md) | Quick reference checklist |

### Migration Status
- **Current**: JavaScript (React 18, Vite 5, Kaplay Beta)
- **Target**: TypeScript (React 19, Vite 6, Kaplay Stable)
- **Estimated Duration**: 15-22 hours

## Quick Reference

### File Organization
```
src/
├── components/          # Game components (Kaplay)
├── entities/            # Game entities (Player, etc.)
├── reactComponents/     # React UI components
├── initGame.js          # Game initialization
├── ReactUI.jsx          # Main React UI
├── store.js             # Jotai state management
├── constants.js         # Game constants
└── utils.js             # Utility functions

public/
├── configs/             # JSON data files
├── sprites/             # Game sprites
├── logos/               # Technology logos
├── fonts/               # Custom fonts
└── shaders/             # GLSL shader files
```

### Key Technologies
| Tech | Version | Purpose |
|------|---------|---------|
| React | 18.3.1 | UI framework |
| Vite | 5.4.8 | Build tool |
| Kaplay | 3001.0.0-beta.8 | Game engine |
| Framer Motion | 11.11.1 | Animations |
| Jotai | 2.10.0 | State management |

## Communication Rules

1. **Document Lead** must be consulted for any documentation changes
2. **Game Developer** owns everything in Kaplay context (`k.`)
3. **Frontend Developer** owns everything React/DOM-related
4. **Graphics Developer** handles visual effects and shader modifications
5. **Content Manager** handles all JSON config updates
6. **DevOps Engineer** handles build configuration and deployment

## Getting Started

Each agent has their own detailed skill document. Refer to the individual agent files for:
- Specific responsibilities
- Technical stack details
- Code patterns and conventions
- Contribution guidelines
