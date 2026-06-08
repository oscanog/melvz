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

For production, deploy with Vercel using `vercel.json`. Vercel needs `CONVEX_DEPLOY_KEY`; Convex production needs `ADMIN_PASSCODE`.

## Editing

1. Start app: `npm run dev`.
2. Visit `/#admin`.
3. Enter admin passcode.
4. Edit the bond-paper resume directly with inline controls.
5. Add, delete, or reorder contacts, skills, education, experience, and projects where they appear.
6. Save content with the top admin bar.

## Admin UX

- Admin sees the same resume design as the public portfolio, but editable.
- Profile image upload is attached to the resume photo.
- Overflow content creates additional bond-paper pages.
- Failed saves keep the draft in the browser so edits are not lost.

## Fallback

If Convex is not configured, public app uses `src/content/fallbackPortfolio.ts`. Keep fallback current enough to render a complete portfolio.

## Security

- Do not put `ADMIN_PASSCODE` in frontend env vars.
- Admin mutations validate session tokens in Convex.
- Public query is read-only.
- Rotate passcode if exposed.
