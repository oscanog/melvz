---
version: 1
mode: team
planning_depth: deep
token_profile: budget
skill_discovery: suggest
git:
  commit_docs: true
  isolation: none
  pre_merge_check: true
  auto_push: false
verification_commands:
  - npm run typecheck
  - npm run lint
  - npm run build
---

# GSD Preferences

Project uses GSD team mode so planning artifacts are reviewable in git while runtime state stays local.

