# M011: Project Showcase Admin Management

## Problem
Admin must redeploy code to add/remove live project demos. Hardcoded `PROJECT_REGISTRY` in `ProjectShowcasePage.tsx` is not scalable. Also, M010 created a `demoSlug` field on `PortfolioProject` AND a separate static registry — two sources of truth for the same data. Fix both.

## Solution
Single Convex table `projectShowcases` becomes the source of truth for iframe URLs. Remove the hardcoded registry. Remove `demoSlug` from `PortfolioProject` type — project name matching or explicit linking handled by the showcase table. Admin manages entries from `#admin/showcases`.

---

## Schema: `projectShowcases`

| Field | Type | Purpose |
|-------|------|---------|
| `slug` | `string` | URL key, unique. Used in `#project/:slug`. Indexed. |
| `name` | `string` | Display name in header bar and admin list |
| `url` | `string` | Full iframe target URL (e.g. `https://luxurious.vercel.app`) |
| `description` | `string` | Short blurb shown above iframe |
| `stack` | `string` | Tech stack label |
| `thumbnailUrl` | `optional string` | Preview image for future card grid |
| `sortOrder` | `number` | Controls display order. Lower = first. |
| `isActive` | `boolean` | Soft-delete toggle. Inactive = hidden from visitors, visible in admin. |
| `createdAt` | `number` | Timestamp. |
| `updatedAt` | `number` | Timestamp. |

**Indexes**: `by_slug` on `slug`, `by_active` on `isActive`.

**Auth**: All mutations validate admin session using existing passcode pattern from `admin.ts`.

**Duplicate slug**: `upsertShowcase` rejects if slug already exists on a different document.

---

## Slices

### Slice 1 — Backend CRUD
- [x] Add `projectShowcases` table + indexes to `convex/schema.ts`.
- [x] Create `convex/showcases.ts` with:
  - `list` query (all entries, for admin).
  - `getBySlug` query (active only, for public page).
  - `upsert` mutation (create or update, admin-gated).
  - `remove` mutation (hard delete, admin-gated).
  - `toggleActive` mutation (flip `isActive`, admin-gated).
- [x] Seed migration: insert the existing Luxurious entry into the new table.

### Slice 2 — Admin UI at `#admin/showcases`
- [x] Add "Showcases" button to admin navbar in `AdminPage.tsx`.
- [x] Hash route `#admin/showcases` renders a dedicated `ShowcaseManager` component.
- [x] **List view**: Table with columns: Name, Slug, URL, Active toggle, Edit/Delete buttons. Sorted by `sortOrder`.
- [x] **Add/Edit form**: Modal with inputs for all fields. Slug auto-generated from name but editable. URL validated as https.
- [x] **Delete**: Confirmation prompt before hard delete.

### Slice 3 — Frontend Refactor
- [x] `ProjectShowcasePage.tsx`: Replace `PROJECT_REGISTRY` dict with `useQuery(api.showcases.getBySlug, { slug })`.
- [x] Show loading skeleton while query resolves.
- [x] Show styled 404 if query returns `null`.
- [x] Remove `demoSlug` from `PortfolioProject` type in `portfolioTypes.ts`.
- [x] Update `LandingPage.tsx`: project name links now look up the showcase table (or simply link if the project name matches a known slug via a lightweight query).

### Slice 4 — Cleanup
- [x] Delete `convex/addLuxuriousProject.ts` (one-off seed script, no longer needed).
- [x] Remove `demoSlug` from `defaultPortfolio.ts` Luxurious entry.
- [x] Remove the Luxurious entry's `demoSlug` from production Convex data.

---

## Edge Cases

| Case | Handling |
|------|----------|
| Duplicate slug on upsert | Reject with `ConvexError("Slug already in use")` |
| Target URL is down | Iframe shows its own error. No portfolio-side fix needed. |
| Admin enters non-https URL | Frontend validation blocks submit. Backend also rejects. |
| No showcases exist | Public page shows "No demos available" instead of blank |

---

## Files Expected To Change

| File | Change |
|------|--------|
| `convex/schema.ts` | Add `projectShowcases` table + indexes |
| `convex/showcases.ts` | New file — CRUD queries/mutations |
| `src/components/AdminPage.tsx` | Add "Showcases" nav button, route to `#admin/showcases` |
| `src/components/ShowcaseManager.tsx` | New file — admin list + add/edit modal |
| `src/components/ProjectShowcasePage.tsx` | Replace hardcoded dict with Convex query |
| `src/components/LandingPage.tsx` | Update project link logic |
| `src/content/portfolioTypes.ts` | Remove `demoSlug` field |
| `convex/defaultPortfolio.ts` | Remove `demoSlug` from Luxurious entry |
| `convex/addLuxuriousProject.ts` | Delete file |
| `style.css` | Add showcase manager styles |
