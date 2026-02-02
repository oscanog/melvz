# 📋 TypeScript Migration Plan & Stack Upgrade Analysis

> ✅ **MIGRATION COMPLETE** - February 2, 2026  
> This project has been successfully migrated from JavaScript to TypeScript with all dependencies upgraded.

## 🔴 Outdated Dependencies Analysis (Pre-Migration)

| Package | Current | Latest | Status | Upgrade Priority |
|---------|---------|--------|--------|------------------|
| **react** | 18.3.1 | 19.2.4 | ⚠️ Major behind | High |
| **react-dom** | 18.3.1 | 19.2.4 | ⚠️ Major behind | High |
| **vite** | 5.4.8 | 6.2.0 | ⚠️ Major behind | High |
| **@vitejs/plugin-react** | 4.3.2 | 4.4.0 | Minor behind | Medium |
| **kaplay** | 3001.0.0-beta.8 | 3001.0.0 (stable) | ⚠️ Beta → Stable | High |
| **framer-motion** | 11.11.1 | 12.29.2 | ⚠️ Major behind | Medium |
| **jotai** | 2.10.0 | 2.17.0 | Minor behind | Low |
| **eslint** | 9.12.0 | 9.25.0 | ⚠️ Outdated | Medium |
| **typescript** | ❌ Not installed | 5.9.3 | ❌ Missing | Critical |

### ⚠️ Breaking Changes to Note

#### React 18 → 19
- **New JSX Transform**: No changes needed for Vite projects
- **useId**: Can replace custom ID generation
- **Actions**: New form action handling (optional)
- **Server Components**: Not applicable for static portfolio
- **Ref cleanup functions**: New pattern for cleanup

#### Vite 5 → 6
- **Node.js requirement**: 18+ → 20+
- **Environment API**: New experimental API (not breaking)
- **JSON handling**: Stricter JSON parsing
- **Module resolution**: Some edge case changes

#### Kaplay Beta → Stable
- **TypeScript support**: Much improved type definitions
- **API stability**: Beta APIs now finalized
- **Better autocomplete**: IDE support enhanced

---

## 🎯 Migration Strategy: Phased Approach

### Phase 0: Preparation & Backup (1-2 hours)
**Goal**: Ensure safe migration with rollback capability

#### Tasks:
1. **Create a migration branch**
   ```bash
   git checkout -b typescript-migration
   ```

2. **Backup current working state**
   ```bash
   git tag pre-typescript-migration
   ```

3. **Run existing build to confirm baseline**
   ```bash
   npm run build
   ```

4. **Install TypeScript as dev dependency**
   ```bash
   npm install -D typescript @types/react @types/react-dom
   ```

5. **Create tsconfig.json** (conservative settings)
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "useDefineForClassFields": true,
       "lib": ["ES2020", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "skipLibCheck": true,
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "jsx": "react-jsx",
       "strict": false,
       "noUnusedLocals": false,
       "noUnusedParameters": false,
       "noFallthroughCasesInSwitch": false,
       "allowJs": true,
       "checkJs": false
     },
     "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.js", "src/**/*.jsx"],
     "references": [{ "path": "./tsconfig.node.json" }]
   }
   ```

6. **Create tsconfig.node.json**
   ```json
   {
     "compilerOptions": {
       "composite": true,
       "skipLibCheck": true,
       "module": "ESNext",
       "moduleResolution": "bundler",
       "allowSyntheticDefaultImports": true
     },
     "include": ["vite.config.js"]
   }
   ```

**✅ Phase 0 Success Criteria**:
- [ ] TypeScript installed without errors
- [ ] `npx tsc --noEmit` runs (may show errors, that's OK)
- [ ] Original build still works

---

### Phase 1: Type Declaration Files (2-3 hours)
**Goal**: Add type definitions without touching source files

#### Tasks:

1. **Create type declaration folder structure**
   ```
   src/
   └── types/
       ├── kaplay.d.ts
       ├── store.d.ts
       └── index.d.ts
   ```

2. **Create Kaplay type declarations** (`src/types/kaplay.d.ts`)
   ```typescript
   // Basic Kaplay type stubs for gradual migration
   declare module 'kaplay' {
     import { Vec2 } from 'kaplay';
     
     export interface KaplayCtx {
       vec2: (x: number, y: number) => Vec2;
       add: (components: any[]) => any;
       sprite: (name: string, options?: any) => any;
       pos: (pos: Vec2 | number, y?: number) => any;
       scale: (s: number) => any;
       anchor: (anchor: string) => any;
       area: (options?: any) => any;
       body: (options?: any) => any;
       color: (color: any) => any;
       text: (text: string, options?: any) => any;
       rect: (w: number, h: number, options?: any) => any;
       circle: (radius: number) => any;
       opacity: (o: number) => any;
       offscreen: (options: any) => any;
       mask: (type: string) => any;
       outline: (width: number, color: any) => any;
       tween: (from: any, to: any, duration: number, onUpdate: (val: any) => void, easing: any) => Promise<void>;
       easings: { linear: any };
       onUpdate: (callback: () => void) => { cancel: () => void };
       onCollide: (tag: string, callback: (obj: any) => void) => { cancel: () => void };
       onClick: (tag: string, callback: (obj: any) => void) => void;
       width: () => number;
       height: () => number;
       center: () => Vec2;
       camPos: (pos?: Vec2) => Vec2;
       camScale: (scale?: Vec2) => Vec2;
       toWorld: (pos: Vec2) => Vec2;
       mousePos: () => Vec2;
       time: () => number;
       loadSprite: (name: string, src: string, options?: any) => void;
       loadFont: (name: string, src: string) => void;
       loadShaderURL: (name: string, vert?: string | null, frag?: string) => void;
       Color: { fromHex: (hex: string) => any };
       Rect: new (pos: Vec2, w: number, h: number) => any;
       fixed: () => any;
       uvquad: (w: number, h: number) => any;
       shader: (name: string, uniformCallback?: () => any) => any;
       get: (tag: string) => any[];
       onMouseDown: (callback: (btn: string) => void) => void;
     }
     
     export interface Vec2 {
       x: number;
       y: number;
       eq: (other: Vec2) => boolean;
       sub: (other: Vec2) => Vec2;
       unit: () => Vec2;
       scale: (s: number) => Vec2;
     }
     
     export interface GameObj {
       pos: Vec2;
       opacity: number;
       width: number;
       height: number;
       children: GameObj[];
       opacityTrickleDown?: { cancel: () => void };
       direction: Vec2;
       directionName: string;
       getCurAnim: () => { name: string };
       play: (anim: string, options?: any) => void;
       move: (vec: Vec2) => void;
       applyImpulse: (vec: Vec2) => void;
       use: (comp: any) => void;
       onUpdate: (callback: () => void) => void;
       onCollide: (tag: string, callback: (obj: any) => void) => { cancel: () => void };
       add: (components: any[]) => GameObj;
     }
     
     declare function kaplay(options?: any): KaplayCtx;
     export default kaplay;
   }
   ```

3. **Create store type declarations** (`src/types/store.d.ts`)
   ```typescript
   import { PrimitiveAtom } from 'jotai';
   
   export interface ProjectLink {
     id: number;
     name: string;
     link: string;
   }
   
   export interface ProjectData {
     title: string;
     links: ProjectLink[];
   }
   
   export interface CameraZoomValue {
     value: number;
   }
   
   export const isSocialModalVisibleAtom: PrimitiveAtom<boolean>;
   export const selectedLinkAtom: PrimitiveAtom<string | null>;
   export const selectedLinkDescriptionAtom: PrimitiveAtom<string>;
   export const isEmailModalVisibleAtom: PrimitiveAtom<boolean>;
   export const emailAtom: PrimitiveAtom<string>;
   export const isProjectModalVisibleAtom: PrimitiveAtom<boolean>;
   export const chosenProjectDataAtom: PrimitiveAtom<ProjectData>;
   export const cameraZoomValueAtom: PrimitiveAtom<CameraZoomValue>;
   ```

4. **Create constants type declarations** (`src/types/constants.d.ts`)
   ```typescript
   export interface Palette {
     color1: string;
     color2: string;
     color3: string;
   }
   
   export const PALETTE: Palette;
   export const DIAGONAL_FACTOR: number;
   export const ZOOM_MAX_BOUND: number;
   export const ZOOM_MIN_BOUND: number;
   ```

5. **Update vite.config.js to support TS**
   ```javascript
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";
   
   // https://vitejs.dev/config/
   export default defineConfig({
     base: "/new-2d-portfolio",
     plugins: [react()],
     esbuild: {
       loader: 'tsx',
       include: [/\.tsx?$/],
     },
   });
   ```

**✅ Phase 1 Success Criteria**:
- [ ] All `.d.ts` files created
- [ ] `npx tsc --noEmit` shows reduced errors
- [ ] Build still works

---

### Phase 2: Utility & Constants Migration (1-2 hours)
**Goal**: Convert simple files to TypeScript first

#### Tasks:

1. **Rename and convert `constants.js` → `constants.ts`**
   ```typescript
   export interface Palette {
     color1: string;
     color2: string;
     color3: string;
   }
   
   export const PALETTE: Palette = {
     color1: "#272946",
     color2: "#aaea6c",
     color3: "#e7ffee",
   } as const;
   
   export const DIAGONAL_FACTOR = 1 / Math.sqrt(2);
   export const ZOOM_MAX_BOUND = 2;
   export const ZOOM_MIN_BOUND = 0.2;
   ```

2. **Rename and convert `utils.js` → `utils.ts`**
   ```typescript
   import { KaplayCtx, GameObj } from 'kaplay';
   
   export async function makeAppear(k: KaplayCtx, gameObj: GameObj): Promise<void> {
     await k.tween(
       gameObj.opacity,
       1,
       0.5,
       (val: number) => {
         gameObj.opacity = val;
         for (const child of gameObj.children) {
           child.opacity = gameObj.opacity;
         }
       },
       k.easings.linear
     );
   
     if (gameObj.opacityTrickleDown) gameObj.opacityTrickleDown.cancel();
   }
   
   export function opacityTrickleDown(parent: GameObj, indirectChildren: GameObj[]): void {
     parent.opacityTrickleDown = parent.onUpdate(() => {
       for (const indirectChild of indirectChildren) {
         indirectChild.opacity = parent.opacity;
       }
     });
   }
   ```

3. **Rename and convert `kaplayCtx.js` → `kaplayCtx.ts`**
   ```typescript
   import kaplay, { KaplayCtx } from "kaplay";
   
   export default function makeKaplayCtx(): KaplayCtx {
     return kaplay({
       global: false,
       pixelDensity: 2,
       touchToMouse: true,
       debug: false,
       debugKey: "f1",
       canvas: document.getElementById("game") as HTMLCanvasElement,
     });
   }
   ```

4. **Update all imports** to use `.ts` extensions (Vite handles this)

**✅ Phase 2 Success Criteria**:
- [ ] All utility files are `.ts`
- [ ] `npm run build` passes
- [ ] Dev server works

---

### Phase 3: Store Migration (1 hour)
**Goal**: Convert Jotai store with proper typing

#### Tasks:

1. **Rename `store.js` → `store.ts`**
   ```typescript
   import { atom, createStore, PrimitiveAtom } from "jotai";
   
   export interface ProjectLink {
     id: number;
     name: string;
     link: string;
   }
   
   export interface ProjectData {
     title: string;
     links: ProjectLink[];
   }
   
   export interface CameraZoomValue {
     value: number;
   }
   
   export const isSocialModalVisibleAtom: PrimitiveAtom<boolean> = atom(false);
   export const selectedLinkAtom: PrimitiveAtom<string | null> = atom(null);
   export const selectedLinkDescriptionAtom: PrimitiveAtom<string> = atom("");
   
   export const isEmailModalVisibleAtom: PrimitiveAtom<boolean> = atom(false);
   export const emailAtom: PrimitiveAtom<string> = atom("");
   
   export const isProjectModalVisibleAtom: PrimitiveAtom<boolean> = atom(false);
   export const chosenProjectDataAtom: PrimitiveAtom<ProjectData> = atom({
     title: "",
     links: [{ id: 0, name: "", link: "" }],
   });
   
   export const cameraZoomValueAtom: PrimitiveAtom<CameraZoomValue> = atom({ value: 1 });
   
   export const store = createStore();
   ```

**✅ Phase 3 Success Criteria**:
- [ ] Store is fully typed
- [ ] No Jotai-related type errors

---

### Phase 4: React Components Migration (2-3 hours)
**Goal**: Convert all `.jsx` files to `.tsx`

#### Tasks:

1. **`CameraController.jsx` → `CameraController.tsx`**
   ```typescript
   import { useAtom } from "jotai";
   import { cameraZoomValueAtom, CameraZoomValue } from "../store";
   import { ZOOM_MAX_BOUND, ZOOM_MIN_BOUND } from "../constants";
   
   export default function CameraController(): JSX.Element {
     const [camZoomValue, setCamZoomValue] = useAtom(cameraZoomValueAtom);
   
     return (
       <div className="camera-controller">
         <button
           className="camera-controller-btn"
           onClick={() => {
             const newZoomValue = camZoomValue.value + 0.2;
   
             if (
               newZoomValue <= ZOOM_MAX_BOUND &&
               newZoomValue >= ZOOM_MIN_BOUND
             ) {
               setCamZoomValue({ value: newZoomValue });
             }
           }}
         >
           +
         </button>
         <button
           className="camera-controller-btn"
           onClick={() => {
             const newZoomValue = camZoomValue.value - 0.2;
             if (
               newZoomValue <= ZOOM_MAX_BOUND &&
               newZoomValue >= ZOOM_MIN_BOUND
             ) {
               setCamZoomValue({ value: newZoomValue });
             }
           }}
         >
           -
         </button>
       </div>
     );
   }
   ```

2. **`SocialModal.jsx` → `SocialModal.tsx`**
   ```typescript
   import { useAtom, useAtomValue } from "jotai";
   import {
     isSocialModalVisibleAtom,
     selectedLinkAtom,
     selectedLinkDescriptionAtom,
   } from "../store";
   
   interface ButtonConfig {
     id: number;
     name: string;
     handler: () => void;
   }
   
   export default function SocialModal(): JSX.Element | null {
     const [isVisible, setIsVisible] = useAtom(isSocialModalVisibleAtom);
     const selectedLink = useAtomValue(selectedLinkAtom);
     const selectedLinkDescription = useAtomValue(selectedLinkDescriptionAtom);
   
     const buttons: ButtonConfig[] = [
       {
         id: 0,
         name: "Yes",
         handler: () => {
           window.open(selectedLink ?? "", "_blank");
           setIsVisible(false);
         },
       },
       {
         id: 1,
         name: "No",
         handler: () => {
           setIsVisible(false);
         },
       },
     ];
   
     if (!isVisible) return null;
   
     return (
       <div className="modal">
         <div className="modal-content">
           <h1>Do you want to open this link?</h1>
           <span>{selectedLink}</span>
           <p>{selectedLinkDescription}</p>
           <div className="modal-btn-container">
             {buttons.map((button) => (
               <button
                 key={button.id}
                 className="modal-btn"
                 onClick={button.handler}
               >
                 {button.name}
               </button>
             ))}
           </div>
         </div>
       </div>
     );
   }
   ```

3. **`EmailModal.jsx` → `EmailModal.tsx`**
   ```typescript
   import { useState } from "react";
   import { useAtom, useAtomValue } from "jotai";
   import { isEmailModalVisibleAtom, emailAtom } from "../store";
   
   interface ButtonConfig {
     id: number;
     name: string;
     handler: () => void;
   }
   
   export default function EmailModal(): JSX.Element | null {
     const [isVisible, setIsVisible] = useAtom(isEmailModalVisibleAtom);
     const email = useAtomValue(emailAtom);
     const [onCopyMessage, setOnCopyMessage] = useState<string>("");
   
     const buttons: ButtonConfig[] = [
       {
         id: 0,
         name: "Yes",
         handler: () => {
           navigator.clipboard.writeText(email);
           setOnCopyMessage("Email copied to clipboard!");
         },
       },
       {
         id: 1,
         name: "No",
         handler: () => {
           setIsVisible(false);
         },
       },
     ];
   
     if (!isVisible) return null;
   
     return (
       <div className="modal">
         <div className="modal-content">
           <h1>Copy my email to your clipboard?</h1>
           <span>{email}</span>
           <p>{onCopyMessage}</p>
           <div className="modal-btn-container">
             {buttons.map((button) => (
               <button
                 key={button.id}
                 className="modal-btn"
                 onClick={button.handler}
               >
                 {button.name}
               </button>
             ))}
           </div>
         </div>
       </div>
     );
   }
   ```

4. **`ProjectModal.jsx` → `ProjectModal.tsx`**
   ```typescript
   import { useAtomValue, useAtom } from "jotai";
   import { isProjectModalVisibleAtom, chosenProjectDataAtom, ProjectLink } from "../store";
   
   export default function ProjectModal(): JSX.Element | null {
     const projectData = useAtomValue(chosenProjectDataAtom);
     const [isVisible, setIsVisible] = useAtom(isProjectModalVisibleAtom);
   
     if (!isVisible) return null;
   
     return (
       <div className="modal">
         <div className="modal-content">
           <h1>{projectData.title}</h1>
           <div className="modal-btn-container">
             {projectData.links.map((linkData: ProjectLink) => (
               <button
                 key={linkData.id}
                 className="modal-btn"
                 onClick={() => {
                   window.open(linkData.link, "_blank");
                 }}
               >
                 {linkData.name}
               </button>
             ))}
             <button
               className="modal-btn"
               onClick={() => {
                 setIsVisible(false);
               }}
             >
               Close
             </button>
           </div>
         </div>
       </div>
     );
   }
   ```

5. **`ReactUI.jsx` → `ReactUI.tsx`**
   ```typescript
   import CameraController from "./reactComponents/CameraController";
   import SocialModal from "./reactComponents/SocialModal";
   import EmailModal from "./reactComponents/EmailModal";
   import ProjectModal from "./reactComponents/ProjectModal";
   
   export default function ReactUI(): JSX.Element {
     return (
       <>
         <p className="controls-message">Tap/Click around to move</p>
         <CameraController />
         <SocialModal />
         <EmailModal />
         <ProjectModal />
       </>
     );
   }
   ```

6. **`main.jsx` → `main.tsx`**
   ```typescript
   import { StrictMode } from "react";
   import { createRoot } from "react-dom/client";
   import ReactUI from "./ReactUI";
   import { Provider } from "jotai";
   import { store } from "./store";
   import initGame from "./initGame";
   
   const ui = document.getElementById("ui") as HTMLElement;
   const root = createRoot(ui);
   root.render(
     <StrictMode>
       <Provider store={store}>
         <ReactUI />
       </Provider>
     </StrictMode>
   );
   
   initGame();
   ```

**✅ Phase 4 Success Criteria**:
- [ ] All React components are `.tsx`
- [ ] No JSX-related type errors
- [ ] Dev server and build work

---

### Phase 5: Game Components Migration (3-4 hours)
**Goal**: Convert game entity files to TypeScript

#### Tasks:

1. **`Icon.js` → `Icon.ts`**
   ```typescript
   import { KaplayCtx, GameObj, Vec2 } from "kaplay";
   import { PALETTE } from "../constants";
   
   export interface ImageData {
     name: string;
     width: number;
     height: number;
   }
   
   export default function makeIcon(
     k: KaplayCtx,
     parent: GameObj,
     posVec2: Vec2,
     imageData: ImageData,
     subtitle: string
   ): [GameObj, GameObj] {
     const icon = parent.add([
       k.sprite(imageData.name, {
         width: imageData.width,
         height: imageData.height,
       }),
       k.anchor("center"),
       k.pos(posVec2),
       k.opacity(0),
       k.offscreen({ hide: true, distance: 300 }),
     ]);
   
     const subtitleText = icon.add([
       k.text(subtitle, { font: "ibm-bold", size: 32 }),
       k.color(k.Color.fromHex(PALETTE.color1)),
       k.anchor("center"),
       k.pos(0, 100),
       k.opacity(0),
     ]);
   
     return [icon, subtitleText];
   }
   ```

2. **`Section.js` → `Section.ts`**
   ```typescript
   import { KaplayCtx, GameObj, Vec2 } from "kaplay";
   import { PALETTE } from "../constants";
   
   export default function makeSection(
     k: KaplayCtx,
     posVec2: Vec2,
     sectionName: string,
     onCollide?: (section: GameObj) => void
   ): GameObj {
     const section = k.add([
       k.rect(200, 200, { radius: 10 }),
       k.anchor("center"),
       k.area(),
       k.pos(posVec2),
       k.color(PALETTE.color1),
       sectionName,
     ]);
   
     section.add([
       k.text(sectionName, { font: "ibm-bold", size: 64 }),
       k.color(PALETTE.color1),
       k.anchor("center"),
       k.pos(0, -150),
     ]);
   
     if (onCollide) {
       const onCollideHandler = section.onCollide("player", () => {
         onCollide(section);
         onCollideHandler.cancel();
       });
     }
   
     return section;
   }
   ```

3. **`Player.js` → `Player.ts`** (Most Complex)
   ```typescript
   import { KaplayCtx, GameObj, Vec2 } from "kaplay";
   import { DIAGONAL_FACTOR } from "../constants";
   import {
     isEmailModalVisibleAtom,
     isProjectModalVisibleAtom,
     isSocialModalVisibleAtom,
     store,
   } from "../store";
   
   export interface PlayerData {
     direction: Vec2;
     directionName: string;
   }
   
   export default function makePlayer(
     k: KaplayCtx,
     posVec2: Vec2,
     speed: number
   ): GameObj & PlayerData {
     const player = k.add([
       k.sprite("player", { anim: "walk-down" }),
       k.scale(8),
       k.anchor("center"),
       k.area({ shape: new k.Rect(k.vec2(0), 5, 10) }),
       k.body(),
       k.pos(posVec2),
       "player",
       {
         direction: k.vec2(0, 0),
         directionName: "walk-down",
       },
     ]) as GameObj & PlayerData;
   
     let isMouseDown = false;
     const game = document.getElementById("game") as HTMLCanvasElement;
     
     game.addEventListener("focusout", () => {
       isMouseDown = false;
     });
     game.addEventListener("mousedown", () => {
       isMouseDown = true;
     });
     game.addEventListener("mouseup", () => {
       isMouseDown = false;
     });
     game.addEventListener("touchstart", () => {
       isMouseDown = true;
     });
     game.addEventListener("touchend", () => {
       isMouseDown = false;
     });
   
     player.onUpdate(() => {
       // ... rest of the implementation with types
     });
   
     return player;
   }
   ```

4. Convert remaining game components:
   - `SocialIcon.js` → `SocialIcon.ts`
   - `EmailIcon.js` → `EmailIcon.ts`
   - `SkillIcon.js` → `SkillIcon.ts`
   - `ProjectCard.js` → `ProjectCard.ts`
   - `WorkExperienceCard.js` → `WorkExperienceCard.ts`

5. **`initGame.js` → `initGame.ts`**
   - Add interfaces for JSON data structures
   - Type the fetch responses

**✅ Phase 5 Success Criteria**:
- [ ] All game files are `.ts`
- [ ] Game runs without errors
- [ ] All entities work correctly

---

### Phase 6: Strict Type Checking (2-3 hours)
**Goal**: Enable strict mode and fix all remaining errors

#### Tasks:

1. **Update `tsconfig.json`**
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "useDefineForClassFields": true,
       "lib": ["ES2020", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "skipLibCheck": true,
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "jsx": "react-jsx",
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true
     },
     "include": ["src/**/*.ts", "src/**/*.tsx"],
     "references": [{ "path": "./tsconfig.node.json" }]
   }
   ```

2. **Fix all strict mode errors**
   - Add null checks
   - Fix implicit any types
   - Handle optional chaining properly

**✅ Phase 6 Success Criteria**:
- [ ] `strict: true` enabled
- [ ] `npx tsc --noEmit` passes with 0 errors

---

### Phase 7: Dependency Upgrade (2 hours)
**Goal**: Upgrade all outdated dependencies

#### Tasks:

1. **Update package.json**
   ```json
   {
     "dependencies": {
       "framer-motion": "^12.29.2",
       "jotai": "^2.17.0",
       "kaplay": "^3001.0.0",
       "react": "^19.2.4",
       "react-dom": "^19.2.4"
     },
     "devDependencies": {
       "@eslint/js": "^9.25.0",
       "@types/react": "^19.0.0",
       "@types/react-dom": "^19.0.0",
       "@vitejs/plugin-react": "^4.4.0",
       "eslint": "^9.25.0",
       "eslint-plugin-react": "^7.37.5",
       "eslint-plugin-react-hooks": "^5.2.0",
       "eslint-plugin-react-refresh": "^0.4.19",
       "globals": "^16.0.0",
       "typescript": "^5.9.3",
       "vite": "^6.2.0"
     }
   }
   ```

2. **Clean install**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Test everything**
   ```bash
   npm run dev     # Test dev server
   npm run build   # Test production build
   npm run preview # Test preview
   ```

**✅ Phase 7 Success Criteria**:
- [ ] All dependencies at latest versions
- [ ] No peer dependency warnings
- [ ] Build passes

---

### Phase 8: Cleanup & Documentation (1 hour)
**Goal**: Remove old files and update documentation

#### Tasks:

1. **Remove old `.js` and `.jsx` files**
   ```bash
   # After confirming everything works
   find src -name "*.js" -o -name "*.jsx" | xargs rm
   ```

2. **Update `index.html`**
   ```html
   <script type="module" src="src/main.tsx"></script>
   ```

3. **Update `.gitignore`**
   ```
   # TypeScript
   *.tsbuildinfo
   ```

4. **Update `README.MD`**
   - Add TypeScript to tech stack
   - Update setup instructions

5. **Update agent documentation**
   - Update `agents/frontend-developer.md`
   - Update `agents/game-developer.md`

**✅ Phase 8 Success Criteria**:
- [ ] No `.js`/`.jsx` files remain in `src/`
- [ ] Documentation updated
- [ ] Clean git history

---

## 📊 Migration Timeline Summary

| Phase | Duration | Risk Level | Can Rollback? |
|-------|----------|------------|---------------|
| 0: Preparation | 1-2 hrs | Low | ✅ Yes |
| 1: Type Declarations | 2-3 hrs | Low | ✅ Yes |
| 2: Utilities | 1-2 hrs | Low | ✅ Yes |
| 3: Store | 1 hr | Low | ✅ Yes |
| 4: React Components | 2-3 hrs | Medium | ⚠️ Partial |
| 5: Game Components | 3-4 hrs | High | ⚠️ Partial |
| 6: Strict Mode | 2-3 hrs | Medium | ✅ Yes |
| 7: Dependencies | 2 hrs | High | ⚠️ Partial |
| 8: Cleanup | 1 hr | Low | ❌ No |

**Total Estimated Time**: 15-22 hours

---

## 🔄 Rollback Strategy

### If issues arise during Phases 0-3:
```bash
git checkout main -- .
npm install
```

### If issues arise during Phases 4-5:
```bash
# Revert specific files
git checkout main -- src/components/Player.js
# Rename back and adjust imports
```

### If issues arise during Phase 7 (dependency upgrade):
```bash
# Restore old package.json
git checkout main -- package.json package-lock.json
npm install
```

---

## ✅ Pre-Migration Checklist

- [ ] All tests pass (if any)
- [ ] Build succeeds on current code
- [ ] All features work in dev mode
- [ ] Git working directory is clean
- [ ] Migration branch created
- [ ] Team members notified

## ✅ Post-Migration Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] Dev server starts without errors
- [ ] Player movement works
- [ ] All modals open/close correctly
- [ ] Camera zoom works
- [ ] All icons and cards render
- [ ] Social links open correctly
- [ ] Email modal copies to clipboard
- [ ] Project modal displays projects
- [ ] No console errors
- [ ] Styles unchanged
