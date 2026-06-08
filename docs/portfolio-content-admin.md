# Portfolio Content Admin

## Purpose

Portfolio details live in Convex so Melvin/admin can update the resume, game zones, project details, social links, and profile image without code changes.

## Setup

1. Run `npm run dev`.
2. Let `convex dev --start "vite"` run Convex and the Vite localhost server together.
3. Set `ADMIN_PASSCODE` in Convex:

```bash
npx convex env set ADMIN_PASSCODE "your-private-passcode"
```

4. Seed current content:

```bash
npx convex run seed:portfolio '{"adminPasscode":"your-private-passcode"}'
```

## Editing

1. Start app: `npm run dev`.
2. Visit `/#admin`.
3. Enter admin passcode.
4. Use the structured CMS sections for profile, image, contacts, skills, education, experience, projects, and game zones.
5. Use the sticky save action when the editor shows unsaved changes.
6. Use Advanced JSON only for import/export or emergency edits.

## Admin UX

- Mobile uses one-column screens with large controls and a sticky save bar.
- Desktop uses sidebar navigation, a main editor pane, and a status/preview rail.
- Raw JSON is hidden under Advanced and is not the default editing path.
- Failed saves keep the draft in the browser so edits are not lost.

## Fallback

If Convex is not configured, public app uses `src/content/fallbackPortfolio.ts`. Keep fallback current enough to render a complete portfolio.

## Security

- Do not put `ADMIN_PASSCODE` in frontend env vars.
- Admin mutations validate session tokens in Convex.
- Public query is read-only.
- Rotate passcode if exposed.
