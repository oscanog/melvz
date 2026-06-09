# M004 Resume History And Rollback Roadmap

## Slice 1 - Milestone And Docs

- Add M004 milestone docs.
- Update project requirements and decisions for Convex-backed commit history.
- Record that GitHub-like means UI and workflow, not real GitHub repository commits.

## Slice 2 - Convex Revision Storage

- Add a separate `portfolioRevisions` table.
- Store commit-like metadata: portfolio key, timestamp, author, message, kind, parent revision, content snapshot, and optional rollback source.
- Store profile image storage IDs with each revision so rollback can restore text and images together.
- Add an index for listing revisions newest first by portfolio key and creation time.

## Slice 3 - Save And Image Revision Writes

- Update `updatePortfolio` so every successful save requires a non-empty message and creates a revision using that message as the title.
- Update `setProfileImage` so every successful image change creates a revision.
- Preserve existing public portfolio read behavior and static fallback behavior.

## Slice 4 - Rollback API

- Add an admin-only rollback mutation.
- Validate the session token server-side before rollback.
- Restore the live portfolio row from the selected revision.
- Create a new rollback revision after restore so rollback itself is auditable.
- Add revision detail query that returns selected revision metadata, parent metadata, changed files, and JSON text needed for line diffs.

## Slice 5 - GitHub-Like Admin History Routes

- Add a `Show history` button in the `/#admin` action bar.
- Navigate from `/#admin` to `/#admin/history`.
- Group revisions by date and render commit-like rows with short hash, message, author, relative time, kind, copy button, and rollback button.
- Make each commit row/title open `/#admin/history/<revisionId>`.
- Render commit detail with title, branch badge, parent/commit hashes, changed-file count, file list, and line-style JSON diffs.
- Use confirmation before rollback and keep failures visible without discarding draft edits.

## Slice 6 - Save Message Dialog

- Replace direct resume save with a required save-message dialog.
- Keep profile image upload using automatic `Update profile image` revision message.

## Slice 7 - Verification

- Run Convex codegen.
- Run TypeScript checks and production build.
- Verify admin save requires a message and creates a revision with that title.
- Verify image upload creates a revision.
- Verify `Show history` opens `/#admin/history`.
- Verify commit click opens `/#admin/history/<revisionId>` with changed files and diffs.
- Verify rollback restores content and profile image IDs and creates a rollback revision.
- Verify public portfolio remains read-only.
