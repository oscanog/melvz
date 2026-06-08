# Decisions

## D001 - Convex Owns Editable Portfolio Content

Status: Accepted

Use Convex as the editable source of truth for portfolio content. Keep checked-in fallback data so the public app remains resilient without a live Convex deployment.

## D002 - Admin Passcode Session For V1

Status: Accepted

Use `ADMIN_PASSCODE` in Convex environment variables. The client sends the passcode once to create a short-lived admin session token. Mutations validate the session token server-side.

## D003 - Convex File Storage For Profile Image

Status: Accepted

Use generated Convex upload URLs for profile image updates. Store the returned storage ID in the portfolio document and resolve it to a public URL in the read query.

## D004 - GSD Team Mode With Local Runtime

Status: Accepted

Track `.gsd` planning markdown in git. Ignore database, runtime, logs, worktrees, reports, and continuation files.

## D005 - Structured Admin Before Raw JSON

Status: Accepted

Use a mobile-first structured CMS editor as the primary portfolio update workflow. Keep raw JSON under Advanced for import/export and emergency edits only.

## D006 - Inline Resume Editing Wins For Boss Workflow

Status: Accepted

For the boss-facing admin flow, show the actual bond-paper resume and add inline edit controls. This supersedes a separate CMS dashboard as the primary editing experience.
