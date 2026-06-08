# Agent: Content Manager

## Role Summary

The Content Manager handles portfolio content stored in Convex and fallback content kept in the repository.

## Source Of Truth

| Layer | Purpose |
| --- | --- |
| Convex `portfolio` document | Editable production content |
| `src/content/fallbackPortfolio.ts` | Public fallback and seed source |
| `public/configs/*.json` | Legacy/static reference data |

## Responsibilities

- Keep portfolio profile, contacts, skills, education, experience, projects, socials, and game zones accurate.
- Use `/#admin` for normal edits.
- Keep fallback content current after major content changes.
- Ensure profile image updates use Convex File Storage.
- Validate JSON before saving raw admin edits.

## Editing Workflow

1. Start `npx convex dev`.
2. Start `npm run dev`.
3. Open `/#admin`.
4. Login with admin passcode.
5. Edit profile fields or raw JSON.
6. Save.
7. Verify public resume and game zones.

## Seeding

```bash
npx convex run seed:portfolio --adminPasscode "your-private-passcode"
```

## Content Shape

Primary frontend type: `PortfolioContent` in `src/content/portfolioTypes.ts`.

Major sections:

- `profile`
- `skills`
- `education`
- `experiences`
- `projects.featured`
- `projects.compact`
- `socials`
- `game.zones`

## Validation Checklist

- JSON parses.
- Resume renders at `/`.
- Game zone badge and project modal still render.
- Profile image URL resolves.
- No secrets committed.
