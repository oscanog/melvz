# M002 Mobile-First Admin Redesign Roadmap

## Slice 1 - Planning Docs

- Add M002 milestone context and roadmap.
- Update project requirements and decisions to mark full structured admin as active.
- Update README/admin docs with the new CMS workflow.

## Slice 2 - Admin State Model

- Keep one `PortfolioContent` draft object in React state.
- Track dirty, saving, saved, failed, and validation states.
- Validate required fields before Convex save.
- Preserve local edits when save fails.

## Slice 3 - Mobile-First Editor

- Replace tabbed raw JSON layout with dashboard plus section navigation.
- Add structured editors for profile, contacts, skills, education, experience, projects, game zones, image, preview, and advanced JSON.
- Add add/edit/delete/reorder controls for nested lists.
- Keep Advanced JSON hidden from the first admin screen.

## Slice 4 - Responsive Visual System

- Replace admin CSS with a neutral work-focused shell.
- Use single-column mobile screens and sticky save bar.
- Add desktop sidebar, editor pane, and right status/preview rail.
- Ensure touch targets are large and controls do not overflow at 375px.

## Slice 5 - Verification

- Run `npx convex codegen`.
- Run `npm run typecheck`, `npm run lint`, and `npm run build`.
- Start `npm run dev` and verify `/#admin` on mobile and desktop widths.
- Confirm public fallback page still renders.

