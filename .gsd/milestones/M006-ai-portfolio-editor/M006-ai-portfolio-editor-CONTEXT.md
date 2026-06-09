# M006 AI Portfolio Editor - Context

## What This Is

AI chat badge in `/#admin` gains portfolio editing powers.
Admin talks naturally → AI proposes structured edits → admin confirms → Convex portfolio updated.

## Why

Manual inline editing exists (M003). But typing "add a new project called X with React stack" into chat is faster than finding the right section, clicking add, filling fields.

AI becomes a natural language admin interface for the resume.

## Dependencies

- M003 inline resume admin (portfolio content structure).
- M004 resume history rollback (revision trail for AI edits).
- M005 AI chat (existing chat badge, agent, settings, provider key).

## Key Decisions

1. AI edits Convex portfolio content only. `defaultPortfolio.ts` untouched.
2. Every AI edit creates a revision with `createdBy: "ai-admin"`.
3. Tool-calling architecture. AI returns structured proposals, not raw text edits.
4. Confirmation required for every mutation. No auto-apply.
5. Bulk deletes require typed "DELETE" confirmation.
6. Public chat stays read-only. Edit tools only sent to provider when admin session valid.
7. All mutations flow through existing `admin.updatePortfolio` — same security boundary.
