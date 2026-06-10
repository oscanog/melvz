# M010: Live Project Showcase via Iframe Embedding

## Objective
Let visitors interact with live, deployed project demos directly inside the portfolio at `melvz.com/#project/:slug` — without merging codebases or duplicating builds.

**Status: ✅ Shipped (basic version). Management system deferred to M011.**

---

## Tech Stack Analysis

### Melvz (Portfolio Host)
| Aspect | Detail |
|--------|--------|
| Framework | Vite + React 19 |
| Routing | Hash-based (`#admin`, `#project/:slug`) — no `react-router` |
| Backend | Convex (separate deployment) |
| Hosting | Vercel |
| CSS | Vanilla CSS |

### Luxurious (Guest Project)
| Aspect | Detail |
|--------|--------|
| Framework | Vite 8 + React 19 |
| Routing | `react-router-dom` v7 with `BrowserRouter` |
| Auth | `@convex-dev/auth` (login required for most routes) |
| Backend | Convex (its own separate deployment) |
| Hosting | Vercel (`vercel.json` with SPA rewrite) |
| CSS | Tailwind CSS v4 |
| Heavy deps | Leaflet, XY Flow, Recharts, Fabric.js, pdfjs-dist, lightweight-charts |

---

## Why NOT Merge Codebases

1. **Separate Convex deployments** — each app has its own `VITE_CONVEX_URL`.
2. **Auth isolation** — Luxurious uses `@convex-dev/auth`. Melvz is public.
3. **CSS collision** — Tailwind v4 vs vanilla CSS.
4. **Bundle size** — Luxurious pulls ~15 heavy deps. Would bloat portfolio from ~200KB to 2MB+.
5. **Independent deploy cycles** — coupling them creates maintenance nightmare.

---

## Implementation (What Shipped)

### Slice 1: Hash Routing ✅
- Used existing hash-based routing pattern (`window.location.hash`).
- Added `#project/:slug` handling in `ReactUI.tsx`.
- No `react-router-dom` needed — kept it simple.

### Slice 2: Showcase Page ✅
- Created `ProjectShowcasePage.tsx` with hardcoded `PROJECT_REGISTRY`.
- Header bar: "← Back to Portfolio" + project name + "Open in New Tab ↗".
- Full-viewport `<iframe>`.
- 404 fallback for unknown slugs.

### Slice 3: Guest Project Headers ✅
- Updated `luxurious/vercel.json` with `Content-Security-Policy: frame-ancestors` and `X-Frame-Options`.
- Allows framing from `melvz.com` and `localhost:*` for dev.

### Slice 4: Resume Project Links ✅
- Added `demoSlug` field to `PortfolioProject` type.
- Project names with `demoSlug` render as clickable links → `#project/:slug`.
- Luxurious entry added to `defaultPortfolio.ts` and production DB.

---

## Known Debt (Addressed by M011)
- `PROJECT_REGISTRY` is hardcoded — needs database migration.
- `demoSlug` on `PortfolioProject` creates dual source of truth with the registry.
- No admin UI to manage showcases without code changes.
- One-off `addLuxuriousProject.ts` seed script should be deleted.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/ProjectShowcasePage.tsx` | New — iframe viewer with header |
| `src/components/LandingPage.tsx` | Project names conditionally linked |
| `src/content/portfolioTypes.ts` | Added `demoSlug` to `PortfolioProject` |
| `src/ReactUI.tsx` | Added `#project/:slug` hash routing |
| `convex/defaultPortfolio.ts` | Added Luxurious featured project entry |
| `convex/addLuxuriousProject.ts` | One-off seed (to be deleted in M011) |
| `style.css` | Showcase container + link styles |
| `luxurious/vercel.json` | Frame-ancestors CSP headers |
