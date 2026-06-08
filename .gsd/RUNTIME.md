# Runtime

## Local App

- Dev server: `npm run dev`
- Dev command runs Convex and Vite together: `convex dev --start "vite"`
- Default Vite URL: `http://localhost:5173`
- Existing Playwright config targets: `http://localhost:5174`

## Production Hosting

- Host frontend on Vercel.
- Vercel build command: `npx convex deploy --cmd-url-env-var-name VITE_CONVEX_URL --cmd 'npm run build'`
- Vercel env var: `CONVEX_DEPLOY_KEY`
- Convex production env var: `ADMIN_PASSCODE`
- GitHub Pages workflow is removed.

## Convex

- Start local Convex sync and Vite: `npm run dev`
- Codegen: `npx convex codegen`
- Deploy: `npx convex deploy`
- Frontend env var: `VITE_CONVEX_URL`
- Backend env var: `ADMIN_PASSCODE`
- Admin route: `/#admin`

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npx convex codegen`

## Local AI Tooling

- Caveman source: `C:\projects\ai\caveman`
- GSD source/docs: `C:\projects\ai\gsd-2`
- Project token profile: `budget`
