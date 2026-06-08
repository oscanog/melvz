# M001 Convex Portfolio Admin Roadmap

## Slice 1 - GSD And Tooling Foundation

- Create `.gsd` tutorial layout.
- Add project preferences with `mode: team`, `planning_depth: deep`, and `token_profile: budget`.
- Add selective GSD runtime ignore rules.
- Add Caveman repo rules and local tooling notes.

## Slice 2 - Convex Backend

- Install `convex`.
- Add schema for singleton portfolio document and admin sessions.
- Add public portfolio query.
- Add passcode session mutation.
- Add protected update and profile-image upload mutations.
- Add seed mutation using current fallback portfolio content.

## Slice 3 - Content Layer

- Define TypeScript portfolio content types.
- Extract current hardcoded resume/game data into fallback content.
- Add selectors for resume, social, and game-zone views.
- Wrap app in Convex provider only when `VITE_CONVEX_URL` exists.

## Slice 4 - Public UI Integration

- Update resume page to render from shared portfolio content.
- Update game HUD/modal zone reads to use shared content.
- Preserve existing loading and game transition behavior.

## Slice 5 - Admin UI

- Add `/#admin` route.
- Add passcode login.
- Add profile image upload.
- Add JSON editor and focused fields for common profile edits.
- Save through protected Convex mutation.

## Slice 6 - Docs And Verification

- Update README and agent docs.
- Add content admin guide and local AI tooling guide.
- Run typecheck, lint, build, and Convex codegen.
- Smoke-test public page and admin flow.

