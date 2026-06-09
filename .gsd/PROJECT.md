# Project

## Summary

`melvz` is Melvin Nogoy's interactive developer portfolio. It is a Vite, React, TypeScript, Kaplay, and Jotai app that starts as a resume page and transitions into a 2D career-game walkthrough.

## Current Direction

Portfolio details must become editable through Convex instead of hardcoded React and static JSON. Public visitors should see the same polished portfolio, while Melvin or an approved admin can update content through a hidden admin route.

## Users

- Public visitors and recruiters viewing the portfolio.
- Melvin/admin editing portfolio content.
- Developers maintaining the app and its GSD planning docs.

## Constraints

- Keep public page usable if Convex is not configured or temporarily unavailable.
- Keep admin mutations protected by a server-side passcode/session flow.
- Keep GSD runtime files local; commit only human-reviewable `.gsd` planning artifacts.
- Keep Caveman rules active for concise agent communication, but code, commit messages, and docs remain normal.

## Rough Milestones

- `M001-convex-portfolio-admin`: Convex content source, admin editor, image upload, seed path, docs, and local AI workflow setup.
- `M002-mobile-first-admin-redesign`: Modern structured mobile-first CMS editor replacing raw JSON as the primary admin workflow.
- `M003-inline-resume-admin`: Inline visual editing directly on the bond-paper resume for authenticated admins.
- `M004-resume-history-rollback`: GitHub-like Convex revision history and admin rollback for resume content and images.
