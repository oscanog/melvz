# M005 AI Knowledge Scope

## Purpose

This file explains what the current `melvz` AI chat knows, where that knowledge comes from, and what is not included yet.

This is for boss review. It describes current implemented scope, not future promises.

## Current Status

The AI chat is currently a resume and portfolio assistant.

It is designed to answer questions about Melvin Nogoy using the same portfolio content that powers the public resume and game walkthrough.

The current AI knowledge source is:

- Convex `portfolio` document when Convex has saved portfolio content.
- Checked-in `convex/defaultPortfolio.ts` fallback when no Convex portfolio row exists.

The AI does not yet use vector embeddings, uploaded PDFs, external web search, or admin revision history as knowledge.

## Current AI Knowledge Sources

### 1. Public Resume Profile

The AI can know:

- Full name.
- Professional title.
- Public contact lines.
- Resume profile summary.
- Public profile image metadata is not used as text knowledge.

Source path:

- `convex/aiContext.ts`
- `convex/portfolio.ts`
- `convex/defaultPortfolio.ts`
- Convex `portfolio.content`

### 2. Skills

The AI can know skill groups and listed skills.

Current examples may include:

- Frontend skills.
- Backend skills.
- Desktop tooling.
- Database skills.
- QA and operations skills.

Exact values come from current portfolio content, not hardcoded AI memory.

### 3. Education

The AI can know listed education entries:

- Degree.
- School.
- Period.
- Detail text.

### 4. Experience

The AI can know listed work experience:

- Role title.
- Period.
- Description.

It can answer questions like:

- What government work has Melvin done?
- What QA experience is listed?
- What full stack experience is listed?
- Which roles mention Convex, Laravel, React, or other stack items?

### 5. Projects

The AI can know listed projects from:

- Featured projects.
- Compact projects.

For each project, the AI can know:

- Project name.
- Period.
- Stack.
- Description.
- Public project links if present.

It can answer questions like:

- Which projects use React?
- Which projects involve Convex?
- Which project is best to show admin tooling?
- What is the strongest backend project?

### 6. Social Links

The AI can know public social/contact links that are part of portfolio content.

It should only use public contact links from the portfolio context.

It must not invent private phone numbers, emails, accounts, or references.

### 7. Game Zones

The AI can know the game walkthrough zones:

- Zone year.
- Zone role.
- Zone short description.
- Zone project names and stacks.
- Left/right zone data is not used deeply, but the zone content is visible in context.

It can answer questions like:

- Where in the game can I find project work?
- What career phase does each zone represent?
- What projects appear in the game?

## Current Backend Knowledge Builder

Current file:

- `convex/aiContext.ts`

Current function:

- `getPortfolioContextForAction`

Current behavior:

1. Reads the Convex `portfolio` row with key `main`.
2. If missing, uses `defaultPortfolio`.
3. Converts portfolio content into plain text lines.
4. Sends those lines to `convex/aiAgent.ts`.
5. `aiAgent` includes those lines in the system prompt as `Portfolio context`.

Current hard limit:

- Context is sliced to `16000` characters.

This keeps prompt size bounded.

## Current Chat Behavior

Current file:

- `convex/aiAgent.ts`

Current action:

- `sendMessage`

Current behavior:

1. Validates message.
2. Hashes local visitor chat key.
3. Loads AI settings.
4. Checks whether AI is enabled.
5. Checks whether public chat is enabled.
6. Checks whether provider key exists.
7. Applies daily anonymous message limit.
8. Creates or updates AI chat thread.
9. Stores user message.
10. Loads recent messages.
11. Loads current portfolio context.
12. Calls the provider chat completion endpoint.
13. Stores assistant message and token usage.
14. Returns answer to frontend.

## Current Frontend Entry Point

Current file:

- `src/components/ai/ResumeAiChat.tsx`

Mounted in:

- `src/ReactUI.tsx`

Current UI:

- Floating AI chat badge.
- Public chat panel.
- Disabled state when AI is missing provider key or disabled.
- Error panel.
- Retry.
- Copy answer.
- Lightweight markdown rendering.

## Current Admin Controls

Current file:

- `src/components/AdminPage.tsx`

Current admin AI controls:

- Open `AI settings` from `/#admin`.
- Rotate provider key.
- Select DeepSeek model.
- Set temperature.
- Set max output tokens.
- Set public daily limit.
- Set admin daily limit.
- Set monthly token limit.
- Enable or disable AI.
- Show or hide public chat badge.

Current backend files:

- `convex/aiSettings.ts`
- `convex/aiSecrets.ts`
- `convex/aiCrypto.ts`

Security:

- Provider key is encrypted server-side.
- Provider key is never returned by public query.
- Frontend only sees key presence and masked suffix.

## Current AI Settings Tables

Current schema additions:

- `aiSettings`
- `aiSettingsAuditEvents`
- `aiChatThreads`
- `aiChatMessages`
- `aiUsageEvents`

Purpose:

- Store AI runtime settings.
- Store safe settings audit events.
- Store anonymous chat threads.
- Store messages.
- Store usage and limit events.

## Current Provider Scope

Current default provider:

- DeepSeek-compatible chat completions API.

Current default base URL:

- `https://api.deepseek.com`

Current default model:

- `deepseek-v4-flash`

Admin-selectable model:

- `deepseek-v4-flash`
- `deepseek-v4-pro`

Required Convex environment variable:

- `AI_SETTINGS_MASTER_KEY`

Required admin action:

- Save provider API key in `/#admin` AI settings.

## What AI Does Not Know Yet

The current AI does not know:

- Uploaded PDFs.
- Certificates.
- Recommendation letters.
- Private notes.
- Admin revision history.
- Git commit history.
- GitHub repository data beyond portfolio text.
- Live website analytics.
- Browser state.
- Screenshots.
- External websites.
- Latest news.
- Real-time job market data.
- Any data not present in the portfolio context.

## What AI Cannot Do Yet

The current AI cannot:

- Search the web.
- Read files from the repo at chat time.
- Use vector search.
- Use RAG over uploaded documents.
- Apply resume edits automatically.
- Save portfolio changes.
- Roll back resume revisions.
- Upload files.
- Send emails.
- Access private server secrets.

## Current RAG Status

Current implementation is not full RAG yet.

Current status:

- Structured context injection: implemented.
- Chat persistence: implemented.
- Admin key/settings: implemented.
- Public chat UI: implemented.
- Convex vector embeddings: not implemented yet.
- Uploaded knowledge documents: not implemented yet.
- Tool calling: not implemented yet.
- Thread memory summarization: basic fields exist, not advanced yet.

Better name for current stage:

- `AI resume chat with structured portfolio context`

Not yet:

- `Full RAG chat`

## Why This Is Enough For First Demo

The portfolio data is small.

The AI can receive the important resume, skill, experience, project, social, and game-zone text directly in the prompt.

That means first demo can answer normal recruiter questions without vector search.

Vector search becomes useful later when knowledge grows.

## Planned Next Knowledge Expansion

### Phase 1 - Portfolio Chunk Embeddings

Add embeddings for:

- Profile summary.
- Skill groups.
- Education entries.
- Experience entries.
- Projects.
- Social links.
- Game zones.

Expected new table:

- `aiPortfolioEmbeddings`

Expected benefit:

- Better retrieval for precise questions.
- Smaller prompt context.
- Better answers when portfolio grows.

### Phase 2 - Tool Calling

Add tools:

- `searchPortfolio`
- `getProjectDetails`
- `getExperienceDetails`
- `getSkillEvidence`
- `getContactLinks`

Expected benefit:

- Better factual answers.
- Better follow-up handling.
- Better "does he know X?" answers with evidence.

### Phase 3 - Uploaded Knowledge

Optional admin knowledge upload:

- PDF resume variants.
- Certificates.
- Case studies.
- Project writeups.
- Recommendation letters.

Expected new tables:

- `aiKnowledgeDocuments`
- `aiKnowledgeChunks`

Expected benefit:

- AI can answer from supporting documents, not only the public resume.

## Boss Summary

Current AI knows the public portfolio only.

It knows:

- Resume profile.
- Contacts.
- Skills.
- Education.
- Experience.
- Projects.
- Social links.
- Game zones.

It does not yet know:

- Uploaded PDFs.
- External web data.
- Private admin history.
- Vector-indexed knowledge.

Current AI is safe first slice:

- Server-side provider key.
- Admin-controlled enable/disable.
- Public chat badge.
- Portfolio-only answers.
- No AI write access.

