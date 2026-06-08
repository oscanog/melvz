# M002 Mobile-First Admin Redesign Context

## Problem

The first Convex admin shipped a functional editor, but the primary workflow exposed raw portfolio JSON and only a few profile fields. It is not acceptable for a boss/admin editing portfolio content on mobile.

## Goal

Replace the admin with a modern, mobile-first CMS-style editor while keeping the existing Convex backend, passcode session, storage upload flow, fallback content, and `/#admin` route.

## Product Direction

- Mobile first: usable at 375px width with no horizontal scroll.
- Structured editor first: profile, image, contacts, skills, education, experience, projects, and game zones are editable without JSON.
- Desktop enhanced: sidebar, editor pane, and preview/status rail.
- Advanced JSON remains available only as an escape hatch.
- Save state is visible and edits survive failed saves.

## Constraints

- Do not require a Convex schema migration.
- Keep all writes protected by existing Convex admin session validation.
- Keep public portfolio and game content rendering from the same `PortfolioContent` model.
- Keep GSD runtime files ignored and milestone docs tracked.

