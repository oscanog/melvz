# Local AI Tooling

## GSD

Source docs: `C:\projects\ai\gsd-2\docs\user-docs`.

This repo follows GSD team mode:

- Track `.gsd/PREFERENCES.md`, `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`, `.gsd/DECISIONS.md`, `.gsd/KNOWLEDGE.md`, `.gsd/RUNTIME.md`, and milestone docs.
- Ignore runtime DB/log/worktree/report files.
- Use `token_profile: budget`.
- Use `git.isolation: none` for Vite/Convex dev compatibility.

Useful GSD commands after global install:

```bash
gsd
/gsd prefs project
/gsd auto
/gsd doctor
```

## Caveman

Source repo: `C:\projects\ai\caveman`.

Preferred local install from project root:

```bash
node C:\projects\ai\caveman\bin\install.js --with-init --only codex --non-interactive
```

Repo-level `AGENTS.md` keeps concise communication rules active. Code, docs, and commit messages still use normal readable style.

