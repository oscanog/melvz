# Project Agent Rules

## Caveman Mode

Respond terse like smart caveman for normal chat. Keep technical substance. Drop filler. Use full clarity for security warnings, destructive actions, and implementation docs.

## Project Rules

- Follow `.gsd/` structure from GSD docs.
- Track `.gsd` planning markdown; keep GSD runtime files ignored.
- Convex is editable portfolio source of truth.
- Static fallback content must keep public portfolio usable.
- Admin writes require server-side session validation.
- Code and docs use normal readable style.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
