# M006 AI Portfolio Editor

## Goal

Admin opens AI chat badge while on `/#admin`. AI detects admin session.
Admin tells AI what to change in portfolio. AI proposes changes with confirmation.
Admin approves → portfolio updated + revision created. Admin rejects → nothing happens.

Public visitors never see edit capability.

## Slice 1 - Milestone And Docs ✅

- [x] Add M006 milestone docs.
- [x] Update M005 knowledge scope to reference M006 as "AI write access" next step.
- [x] Document editable field map and confirmation contract.

## Slice 2 - Admin AI Mode Detection ✅

- [x] Detect when AI chat badge is mounted inside `/#admin` with valid admin session.
- [x] Pass `sessionToken` to AI agent action when admin mode is active.
- [x] Backend validates admin session server-side before enabling edit tools.
- [x] Public visitors use existing read-only chat path. No edit tools exposed.
- [x] Add `isAdminMode` flag to chat thread context.

## Slice 3 - AI Tool-Calling Architecture ✅

- [x] Add tool-calling support to `aiAgent.ts` provider request.
- [x] Define portfolio mutation tools the AI can invoke:
  - `proposeProfileEdit` — edit name, title, summary, contacts.
  - `proposeSkillsEdit` — add/remove/reorder skill groups and items.
  - `proposeEducationEdit` — add/edit/remove education entries.
  - `proposeExperienceEdit` — add/edit/remove experience entries.
  - `proposeProjectEdit` — add/edit/remove featured and compact projects.
  - `proposeSocialsEdit` — add/edit/remove social links.
  - `proposeGameZoneEdit` — add/edit/remove game zones and zone projects.
- [x] Each tool returns a structured proposal, not a direct mutation.
- [x] AI system prompt includes admin-only editing instructions when `isAdminMode` is true.
- [x] Tools only included in provider request when admin session is validated.

## Slice 4 - Confirmation UI ✅

- [x] When AI proposes a change, render a confirmation card in chat.
- [x] Confirmation card shows:
  - Section being changed (e.g. "Experience", "Skills").
  - Action type: Add / Edit / Delete.
  - Summary of what changes (human-readable diff).
  - Before/after preview for edits.
  - List of items being added or removed.
- [x] Two buttons: **Apply** and **Reject**.
- [x] Apply calls `admin.updatePortfolio` with patched content + auto-generated revision message.
- [x] Reject dismisses the card. AI acknowledges rejection.
- [x] Card is non-interactive after decision (greyed out with result label).

## Slice 5 - Portfolio Patching And Revision Trail ✅

- [x] Build `applyProposal` utility that patches current portfolio content with AI proposal.
- [x] Reads current portfolio content from Convex.
- [x] Merges proposed changes into content blob.
- [x] Calls `admin.updatePortfolio` with patched content.
- [x] Revision message format: `"AI: <action> <section> — <summary>"`.
  - Example: `"AI: added project 'MelvzBot' to featured projects"`.
  - Example: `"AI: updated profile summary"`.
  - Example: `"AI: removed skill group 'Desktop'"`.
- [x] Revision `createdBy` set to `"ai-admin"` to distinguish from manual admin edits.
- [x] All AI edits are rollback-safe through existing M004 history system.

## Slice 6 - Delete Safety ✅

- [x] When AI proposes a delete action, confirmation card shows enhanced warning.
- [x] Bulk deletes (e.g. "delete all experiences") require explicit typed confirmation.
  - Card shows: "This will remove N items. Type DELETE to confirm."
- [x] Single-item deletes show standard confirm with item preview.
- [x] AI must never auto-apply deletes. Always require confirmation card.

## Slice 7 - Verification ✅

- [x] Run typecheck, lint, build, and Convex codegen.
- [x] Verify admin AI edit flow end-to-end:
  - Add a skill → confirm → verify portfolio updated + revision created.
  - Edit profile summary → confirm → verify diff correct.
  - Delete a project → confirm with warning → verify removed.
  - Reject a proposal → verify no mutation.
- [x] Verify public chat remains read-only. No edit tools in public mode.
- [x] Verify AI edits appear in `/#admin/history` with `ai-admin` author.
- [x] Verify rollback of AI edits works through existing history UI.

## Editable Fields Map

| Section | Fields | Operations |
|---------|--------|------------|
| `profile` | name, title, summary, contacts[] | Edit |
| `skills` | label, items[] per group | Add / Edit / Remove / Reorder |
| `education` | degree, school, period, detail | Add / Edit / Remove |
| `experiences` | role, period, description | Add / Edit / Remove |
| `projects.featured` | name, period, stack, description | Add / Edit / Remove |
| `projects.compact` | name, period, stack, description | Add / Edit / Remove |
| `socials` | name, description, url/address | Add / Edit / Remove |
| `game.zones` | id, year, role, kiss, projects[], etc. | Add / Edit / Remove |

## Files Expected To Change

| File | Change |
|------|--------|
| `convex/aiAgent.ts` | Add tool-calling, admin mode branching |
| `convex/aiContext.ts` | Admin edit system prompt builder |
| `convex/admin.ts` | Optional: `createdBy` field for AI revisions |
| `src/components/ai/ResumeAiChat.tsx` | Admin mode detection, confirmation card UI |
| `src/components/AdminPage.tsx` | Pass session context to AI chat |
| `src/ReactUI.tsx` | Admin mode prop threading |

## Security Boundaries

- AI edit tools only available when `sessionToken` passes `assertAdmin` server-side.
- No edit tools sent to provider for public visitors.
- All mutations go through existing `admin.updatePortfolio` with session validation.
- Provider API key never exposed to frontend.
- AI cannot bypass confirmation step. Frontend must receive explicit admin click.

## Not In Scope

- Editing `defaultPortfolio.ts` fallback file. AI edits Convex content only.
- Profile image changes via AI chat. Use existing image upload UI.
- Vector embeddings or RAG. That stays in M005 future phases.
- Multi-step wizard flows. One proposal per message.
