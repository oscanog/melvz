# Melvz Portfolio

Interactive developer portfolio built with React, TypeScript, Vite, Kaplay, Jotai, and Convex.

The public experience starts as a resume page and transitions into a 2D career-game walkthrough. Portfolio content now has a Convex-backed admin path so details can be edited without touching React code.

## Tech Stack

- React 19
- TypeScript 5.9
- Vite 6
- Kaplay 3001
- Jotai
- Convex
- Framer Motion

## Development

```bash
npm install
npm run dev
```

`npm run dev` initializes Convex if needed, then runs `convex dev` and the Vite localhost server in parallel through `convex dev --start "vite"`.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Convex Setup

Link/create the Convex project and start localhost:

```bash
npm run dev
```

Convex manages the generated deployment URL for Vite during dev. For manual overrides, use `.env.local`:

```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

Set the admin passcode in Convex:

```bash
npx convex env set ADMIN_PASSCODE "your-private-passcode"
```

Seed the current portfolio content:

```bash
npx convex run seed:portfolio '{"adminPasscode":"your-private-passcode"}'
```

Open admin editor:

```text
http://localhost:5173/#admin
```

The public app still renders fallback content if `VITE_CONVEX_URL` is missing or Convex has no seeded data.

## Content Workflow

- Public content source: Convex `portfolio` singleton document.
- Fallback source: `src/content/fallbackPortfolio.ts`.
- Admin route: `/#admin`.
- Admin auth: Convex `ADMIN_PASSCODE` creates a short-lived session token.
- Profile image uploads use Convex File Storage.
- Admin editing shows the bond-paper resume with inline edit controls after login.
- Resume content auto-flows into additional bond-paper pages when one page is not enough.

## GSD Workflow

Project `.gsd/` follows GSD team-mode layout:

```text
.gsd/
  PREFERENCES.md
  PROJECT.md
  REQUIREMENTS.md
  DECISIONS.md
  KNOWLEDGE.md
  RUNTIME.md
  milestones/
```

Planning docs are tracked. Runtime DB/log/worktree files are ignored in `.gitignore`.

## Credits

Player character asset is a slightly modified version of the asset hosted here: https://gibbongl.itch.io/8-directional-gameboy-character-template
