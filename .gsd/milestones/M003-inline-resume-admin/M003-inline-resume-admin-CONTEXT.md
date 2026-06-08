# M003 Inline Resume Admin Context

## Problem

The structured admin CMS still feels separate from the portfolio. The boss wants the admin to edit the actual bond-paper resume directly, similar to inline editing in modern visual tools.

## Goal

When an admin logs in at `/#admin`, show the same resume paper with inline edit controls for resume content. Public visitors still see the read-only portfolio.

## Product Direction

- Inline editing on the resume paper itself.
- Add, delete, and reorder resume list items directly where they appear.
- Keep Convex passcode sessions and existing save mutation.
- Use more bond-paper pages automatically when content exceeds one page.

## Scope

- Profile, contacts, profile image, skills, education, experience, featured projects, and compact projects.
- Game zones and social links remain outside this milestone unless they are displayed on the resume.

