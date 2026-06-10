# M010: Live Project Showcase via Iframe Embedding

## Objective
Let visitors interact with live, deployed project demos directly inside the portfolio at `melvz.com/project/:slug` — without merging codebases or duplicating builds.

---

## Tech Stack Analysis

### Melvz (Portfolio Host)
| Aspect | Detail |
|--------|--------|
| Framework | Vite + React 19 |
| Routing | **None** — single-page app, no `react-router` |
| Backend | Convex (separate deployment) |
| Hosting | Vercel (assumed from Convex + Vite pattern) |
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

1. **Separate Convex deployments** — Luxurious has its own Convex backend (`VITE_CONVEX_URL`). Melvz has its own. They can't share a single `ConvexReactClient`.
2. **Auth isolation** — Luxurious requires `@convex-dev/auth` login. Melvz is a public portfolio. Mixing auth providers in one React tree is fragile.
3. **CSS collision** — Luxurious uses Tailwind v4 with `@tailwindcss/vite` plugin. Melvz uses vanilla CSS. Running both in the same bundle will cause class conflicts.
4. **Bundle size** — Luxurious pulls ~15+ heavy deps (Leaflet, Recharts, Fabric, pdfjs). Importing them into melvz would bloat the portfolio bundle from ~200KB to 2MB+.
5. **Independent deploy cycles** — Boss updates luxurious separately. Coupling it to the portfolio deploy pipeline creates a maintenance nightmare.

---

## Recommended Approach: `<iframe>` Embedding

Each project is already deployed independently (e.g., `luxurious.vercel.app`). The portfolio simply wraps it in a full-viewport `<iframe>` at `/project/:slug`.

```
melvz.com/project/luxurious  →  <iframe src="https://luxurious.vercel.app" />
melvz.com/project/lib-mgmt   →  <iframe src="https://lib-mgmt.vercel.app" />
```

### Why This Works
- **Zero coupling** — Each project stays its own repo, its own Convex, its own Vercel deployment.
- **Auth works** — The iframe loads the full app. Visitors log into luxurious within the iframe independently.
- **CSS isolation** — iframe is a separate browsing context. No style bleeding.
- **Instant scalability** — Adding a new project = adding 1 entry to a config array. No code changes to guest projects.

### Limitations & Mitigations
| Limitation | Mitigation |
|------------|------------|
| `X-Frame-Options` / CSP may block iframe | Configure Vercel response headers on guest projects to allow framing from `melvz.com` |
| No SEO for iframe content | Add meta tags + project description above/around the iframe on the portfolio side |
| Mobile UX may feel nested | Make iframe truly fullscreen with a minimal "← Back to Portfolio" floating bar |
| Cookie/auth in iframe (3rd-party) | Safari blocks 3rd-party cookies by default. May need `SameSite=None; Secure` or a subdomain strategy |

---

## Implementation Slices

### Slice 1: Add Routing to Melvz
- Install `react-router-dom` in melvz.
- Wrap the app in `BrowserRouter`.
- Route `/` → existing `LandingPage`.
- Route `/project/:slug` → new `ProjectShowcasePage`.
- Update Vercel config with SPA rewrite for `/project/*`.

### Slice 2: Project Registry & Showcase Page
- Create a simple registry (JSON or Convex table):
  ```ts
  { slug: "luxurious", name: "Luxurious Trading Group", url: "https://luxurious.vercel.app", description: "..." }
  ```
- Build `ProjectShowcasePage`:
  - Lookup slug from registry.
  - Render a minimal header bar (project name + "← Back to Portfolio" link).
  - Full-viewport `<iframe>` below.
  - 404 fallback for unknown slugs.

### Slice 3: Guest Project Headers
- On each guest project's Vercel deployment, add response headers:
  ```json
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "X-Frame-Options", "value": "ALLOW-FROM https://melvz.com" },
          { "key": "Content-Security-Policy", "value": "frame-ancestors 'self' https://melvz.com" }
        ]
      }
    ]
  }
  ```

### Slice 4: Project Cards on Resume
- Add a "Live Demos" section or link icons on existing project cards in the resume.
- Clicking a project with a live demo navigates to `/project/:slug`.

---

## Considerations
- **Performance**: The iframe loads the entire guest app. First load may be slow for heavy projects. Consider a loading skeleton.
- **Mobile**: On small screens, the iframe may feel cramped. Could offer a "Open in new tab" fallback for mobile.
- **Future**: If we want tighter integration (e.g., shared theme), we could explore Module Federation or micro-frontends. But for a portfolio showcase, iframe is the pragmatic, zero-maintenance choice.
