# ✅ TypeScript Migration Quick Checklist

## Pre-Migration
- [ ] `git checkout -b typescript-migration`
- [ ] `git tag pre-typescript-migration`
- [ ] `npm run build` passes

## Phase 0: Setup (1-2h)
- [ ] `npm install -D typescript @types/react @types/react-dom`
- [ ] Create `tsconfig.json`
- [ ] Create `tsconfig.node.json`
- [ ] `npx tsc --noEmit` runs (errors OK)

## Phase 1: Types (2-3h)
- [ ] Create `src/types/kaplay.d.ts`
- [ ] Create `src/types/store.d.ts` (optional)
- [ ] Update `vite.config.js`

## Phase 2: Utils (1-2h)
- [ ] `constants.js` → `constants.ts`
- [ ] `utils.js` → `utils.ts`
- [ ] `kaplayCtx.js` → `kaplayCtx.ts`
- [ ] `npm run build` passes

## Phase 3: Store (1h)
- [ ] `store.js` → `store.ts`
- [ ] Add interfaces for atoms

## Phase 4: React (2-3h)
- [ ] `CameraController.jsx` → `CameraController.tsx`
- [ ] `SocialModal.jsx` → `SocialModal.tsx`
- [ ] `EmailModal.jsx` → `EmailModal.tsx`
- [ ] `ProjectModal.jsx` → `ProjectModal.tsx`
- [ ] `ReactUI.jsx` → `ReactUI.tsx`
- [ ] `main.jsx` → `main.tsx`
- [ ] `index.html` → update script src to `.tsx`

## Phase 5: Game (3-4h)
- [ ] `Icon.js` → `Icon.ts`
- [ ] `Section.js` → `Section.ts`
- [ ] `Player.js` → `Player.ts`
- [ ] `SocialIcon.js` → `SocialIcon.ts`
- [ ] `EmailIcon.js` → `EmailIcon.ts`
- [ ] `SkillIcon.js` → `SkillIcon.ts`
- [ ] `ProjectCard.js` → `ProjectCard.ts`
- [ ] `WorkExperienceCard.js` → `WorkExperienceCard.ts`
- [ ] `initGame.js` → `initGame.ts`

## Phase 6: Strict (2-3h)
- [ ] Update `tsconfig.json` with `"strict": true`
- [ ] Fix all type errors
- [ ] `npx tsc --noEmit` passes with 0 errors

## Phase 7: Upgrade (2h)
- [ ] Update `package.json` versions
- [ ] `rm -rf node_modules package-lock.json`
- [ ] `npm install`
- [ ] `npm run build` passes

## Phase 8: Cleanup (1h)
- [ ] Remove all `.js` and `.jsx` files from `src/`
- [ ] Update `README.MD`
- [ ] Update agent docs
- [ ] Final commit

## Testing
- [ ] Player moves correctly
- [ ] Camera zooms in/out
- [ ] All modals open/close
- [ ] Social links work
- [ ] Email copies to clipboard
- [ ] Project cards display
- [ ] Skill icons bounce
- [ ] No console errors
- [ ] Styles unchanged

## Migration Complete! 🎉
