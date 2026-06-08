# M001 Convex Portfolio Admin Context

## Goal

Move portfolio details into Convex so Melvin/admin can edit content without code changes, while keeping the public portfolio stable and visually unchanged.

## Scope

- Convex schema, queries, mutations, admin session, image upload, and seed mutation.
- React content provider with Convex data and fallback content.
- Hidden admin page at `/#admin`.
- Resume and Silicon Valley game zone content read from shared portfolio content.
- GSD `.gsd` organization and Caveman repo rules.
- README and agent docs update.

## Constraints

- No public write mutations.
- No secrets in browser bundle.
- Public app must not blank if Convex URL is missing.
- Existing game flow and tests should keep working.

## Done

- App builds.
- Public resume and game zones render from Convex/fallback selector.
- Admin passcode session can save content.
- Image upload path stores Convex storage ID and public query resolves URL.
- Docs explain setup, seeding, admin editing, and GSD workflow.

