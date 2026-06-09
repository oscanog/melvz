# M004 Resume History And Rollback Context

## Problem

The admin can edit resume data in Convex, but there is no simple way to see what changed over time or roll back a bad save. The boss wants a GitHub-like history page for resume data where every save is treated like a commit.

## Goal

Authenticated admins can click a `Show history` button in `/#admin`, browse commit-like resume revisions at `/#admin/history`, inspect a changed-file diff at `/#admin/history/<revisionId>`, and restore any previous revision without needing developer help.

## Product Direction

- Use Convex as the history source of truth.
- Create one revision for every admin content save.
- Create revision entries for profile image changes and rollbacks.
- Require a save message before resume content saves; use it as the revision title.
- Match the GitHub commits and commit detail feel: date groups, commit rows/cards, short hashes, author, relative time, changed files, and line-style JSON diffs.
- Keep rollback admin-only and protected by server-side session validation.

## Scope

- Resume content stored in the `portfolio` Convex row.
- Profile image storage IDs, including display, 2x, blur, and archive variants.
- History browsing and rollback in admin-scoped hash routes: `/#admin/history` and `/#admin/history/<revisionId>`.

## Out Of Scope

- Writing real commits to the GitHub repository.
- Public visitor access to history.
- Exact Git patch format.
