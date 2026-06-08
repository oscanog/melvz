# Requirements

## Active

| ID | Requirement | Acceptance |
| --- | --- | --- |
| R001 | Store full portfolio content in Convex. | Resume, contacts, skills, experience, projects, social links, game zones, and profile image metadata can be read from Convex. |
| R002 | Preserve static fallback content. | Public app renders useful portfolio content before Convex is configured or while data is loading. |
| R003 | Add hidden admin editor. | `/#admin` shows passcode login and content editing UI. |
| R004 | Protect writes server-side. | Admin save/image mutations require a valid session token created from `ADMIN_PASSCODE`. |
| R005 | Support profile image update. | Admin can upload an image through Convex File Storage and public resume uses the stored image URL. |
| R006 | Seed Convex from current portfolio content. | A documented seed mutation/script inserts current fallback content into Convex. |
| R007 | Organize GSD project state. | `.gsd` follows GSD tutorial layout and `.gitignore` keeps runtime files local. |
| R008 | Document content workflow. | README and agent docs explain Convex setup, admin editing, seeding, and GSD/caveman workflow. |
| R009 | Provide a mobile-first structured admin CMS. | Admin can edit profile, image, contacts, skills, education, experience, projects, and game zones without using raw JSON. |
| R010 | Keep admin save state visible. | Admin sees saved, unsaved, saving, failed, and validation states; failed saves do not discard edits. |

## Deferred

| ID | Requirement | Notes |
| --- | --- | --- |
| R011 | Full OAuth admin auth. | Passcode session is v1; OAuth can replace it later. |

## Out Of Scope

- Replacing Kaplay game mechanics.
- Migrating to Next.js.
