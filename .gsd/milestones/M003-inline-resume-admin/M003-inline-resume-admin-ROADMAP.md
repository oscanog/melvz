# M003 Inline Resume Admin Roadmap

## Slice 1 - Milestone And Docs

- Add M003 milestone docs.
- Update project requirements and decisions for inline editing.
- Update README/admin docs so `/#admin` is described as the visual resume editor.

## Slice 2 - Inline Admin State

- Keep a `PortfolioContent` draft in admin state.
- Track dirty, saving, saved, failed, and validation states.
- Preserve draft edits when save fails.
- Save through existing `api.admin.updatePortfolio`.

## Slice 3 - Bond-Paper Editor

- Replace the admin CMS shell with the resume paper view.
- Add inline inputs and textareas where resume fields are shown.
- Add inline add/delete/reorder controls for contacts, skills, education, experience, and projects.
- Keep profile image upload available from the resume photo.

## Slice 4 - Auto Pages

- Split resume content into ordered blocks.
- Estimate page capacity from content size and create page 2, page 3, etc. as needed.
- Keep each page styled as bond paper.

## Slice 5 - Verification

- Run typecheck, lint, build, and Convex codegen.
- Verify `/#admin` login/edit/save flow.
- Verify mobile and desktop layouts.
- Verify public portfolio stays read-only.

