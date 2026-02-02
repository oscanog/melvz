# ⚛️ Agent: Frontend Developer

## Role Summary
The Frontend Developer owns all **React components**, UI overlays, styling, and the React-Game integration layer.

## Responsibilities

### Primary
- React component development
- Modal dialogs (Social, Email, Project)
- UI overlay and positioning
- CSS styling and responsiveness
- State management with Jotai
- Event handling between React and Kaplay

### Secondary
- Form handling (Email form)
- Accessibility considerations
- Mobile responsiveness
- Animation with Framer Motion

## Technical Stack
- **Framework:** React 19.2.4 (TypeScript)
- **Build Tool:** Vite 6.2.0
- **State:** Jotai 2.17.0
- **Animation:** Framer Motion 12.29.2
- **Styling:** CSS (style.css)
- **Language:** TypeScript 5.9.3

> **Note:** Migration from JavaScript to TypeScript is **complete**!

## Key Files

| File | Purpose |
|------|---------|
| `src/main.jsx` | React app entry point |
| `src/ReactUI.jsx` | Main UI component |
| `src/reactComponents/CameraController.jsx` | Camera zoom controls |
| `src/reactComponents/SocialModal.jsx` | Social link modal |
| `src/reactComponents/EmailModal.jsx` | Contact form modal |
| `src/reactComponents/ProjectModal.jsx` | Project details modal |
| `src/store.js` | Jotai atoms definition |
| `style.css` | Global styles |

## Code Patterns

### Modal Component Pattern
```jsx
// Pattern from reactComponents/ProjectModal.jsx
import { useAtom } from "jotai";
import { isProjectModalOpenAtom, currentProjectAtom } from "../store";

export default function ProjectModal() {
  const [isOpen, setIsOpen] = useAtom(isProjectModalOpenAtom);
  const [project] = useAtom(currentProjectAtom);

  if (!isOpen || !project) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal content */}
      </div>
    </div>
  );
}
```

### Jotai Atom Definition
```javascript
// Pattern from src/store.js
import { atom } from "jotai";

// Simple atoms
export const cameraZoomValueAtom = atom(0.8);
export const isSocialModalOpenAtom = atom(false);

// Derived atoms (if needed)
export const isAnyModalOpenAtom = atom((get) => {
  return get(isSocialModalOpenAtom) || 
         get(isEmailModalOpenAtom) || 
         get(isProjectModalOpenAtom);
});
```

### Camera Controller Pattern
```jsx
// Camera zoom with Jotai
import { useAtom } from "jotai";
import { cameraZoomValueAtom } from "../store";

export default function CameraController() {
  const [zoom, setZoom] = useAtom(cameraZoomValueAtom);

  return (
    <div className="camera-controls">
      <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))}>+</button>
      <span>{Math.round(zoom * 100)}%</span>
      <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))}>-</button>
    </div>
  );
}
```

## State Atoms Reference

| Atom | Type | Purpose |
|------|------|---------|
| `cameraZoomValueAtom` | number | Camera zoom level (0.3 - 1.5) |
| `isSocialModalOpenAtom` | boolean | Social modal visibility |
| `isEmailModalOpenAtom` | boolean | Email modal visibility |
| `isProjectModalOpenAtom` | boolean | Project modal visibility |
| `currentProjectAtom` | object | Currently selected project data |
| `selectedSocialAtom` | object | Currently selected social link |
| `store` | JotaiStore | Direct store access for non-React code |

## CSS Architecture

### Key Classes
```css
/* style.css patterns */
.controls-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  /* ... */
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
}
```

### Color Palette (from constants.js)
```css
:root {
  --color-1: #2d1b2e; /* Dark purple */
  --color-2: #57334c; /* Medium purple */
  --color-3: #8f5d6a; /* Rose */
  /* Match PALETTE in src/constants.js */
}
```

## Common Tasks

### Add a New Modal
1. Create component in `src/reactComponents/`
2. Add atom in `src/store.js`
3. Include in `src/ReactUI.jsx`
4. Add styles to `style.css`

### Style a Game-triggered Element
```jsx
// Use Jotai to bridge game and React
useEffect(() => {
  // Subscribe to game events if needed
  return () => {
    // Cleanup
  };
}, []);
```

### Responsive Considerations
- The game canvas handles its own scaling
- React UI should use relative units
- Test modals on mobile viewport sizes

## Integration with Game

### Triggering Modals from Game
The game uses `store.set()` directly:
```javascript
// In game code
import { store, isModalOpenAtom } from "./store";

// Open modal
store.set(isModalOpenAtom, true);
```

### React Responds to Game State
React components use `useAtom()` to react to changes:
```jsx
const [isOpen] = useAtom(isModalOpenAtom);
// Component re-renders when game changes the atom
```

## Collaboration Points

### With Game Developer
- Define Jotai atoms for shared state
- Coordinate modal open/close behavior
- Ensure UI doesn't block game input

### With Graphics Developer
- Apply Framer Motion animations
- Coordinate visual transitions

### With Content Manager
- Use JSON data in components
- Ensure content matches game data

### With Document Lead
- Document component props
- Maintain component examples
