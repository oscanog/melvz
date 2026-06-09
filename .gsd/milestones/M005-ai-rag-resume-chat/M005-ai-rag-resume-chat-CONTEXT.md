# M005 AI RAG Resume Chat Context

## Purpose

Add an AI chat system to `melvz` so public visitors can ask questions about Melvin Nogoy's resume, skills, work history, projects, game zones, and contact links. The chat must use Convex as the portfolio source of truth, preserve static fallback behavior, and protect all admin-only writes and AI configuration server-side.

This document is based on a code scan of `C:\projects\convex\luxurious`, especially its AI/RAG implementation in:

- `convex/aiAgent.ts`
- `convex/aiSettings.ts`
- `convex/aiSecrets.ts`
- `convex/aiCrypto.ts`
- `convex/aiEmbeddings.ts`
- `convex/aiDbEmbeddings.ts`
- `convex/aiDbEmbeddingActions.ts`
- `convex/aiKnowledge.ts`
- `convex/aiKnowledgeActions.ts`
- `convex/aiPgvector.ts`
- `src/components/ai/AiChatBadge.tsx`
- `src/pages/admin/AiSettingsPage.tsx`
- `src/pages/admin/AiKnowledgePage.tsx`
- `.gsd/milestones/M019-AI-AGENT-INFRASTRUCTURE/`
- `.gsd/milestones/M020-AI-ROBUST-INTELLIGENCE/`

The goal is not to copy `luxurious` blindly. `luxurious` is a larger authenticated trading workspace with users, finance, org chart members, uploaded documents, and role-based visibility. `melvz` is a public portfolio with a hidden passcode admin workflow. The correct `melvz` design should reuse the good architectural patterns and simplify anything that is unnecessary for a resume chat.

## Current `melvz` Baseline

`melvz` is a Vite, React, TypeScript, Kaplay, Jotai, and Convex app.

Current Convex-backed portfolio state:

- `convex/schema.ts` has:
  - `portfolio`
  - `portfolioRevisions`
  - `adminSessions`
- `convex/portfolio.ts` exposes public portfolio content.
- `convex/admin.ts` protects writes with a server-side admin passcode session.
- `src/content/PortfolioContentProvider.tsx` loads Convex content when available and falls back to checked-in static content.
- `convex/defaultPortfolio.ts` and `src/content/fallbackPortfolio.ts` preserve public usability without Convex.
- `/#admin` is the hidden admin route.
- `/#admin/history` and `/#admin/history/<revisionId>` support revision history and rollback.

Current security decision:

- `ADMIN_PASSCODE` creates short-lived admin sessions.
- Admin mutations validate session tokens server-side.
- No OAuth dependency yet.

That means M005 should keep passcode admin for AI settings instead of importing `@convex-dev/auth` unless a later milestone decides to replace admin auth.

## What `luxurious` AI/RAG Does

`luxurious` has a production AI layer with these main parts:

1. Admin-managed AI settings.
2. Server-side encrypted provider key.
3. Floating chat UI.
4. Convex action for chat calls.
5. Persistent chat threads and messages.
6. Usage tracking and settings audit logs.
7. Embeddings for app records.
8. Vector search using Convex vector indexes.
9. Optional uploaded knowledge ingestion.
10. Optional Neon/Postgres pgvector retrieval.
11. Tool calling for live workspace facts.
12. Lightweight thread memory for follow-up questions.

### `luxurious` AI Settings Pattern

`convex/aiSettings.ts` stores one settings document keyed as `default`.

Default settings include:

- provider: `deepseek`
- base URL: `https://api.deepseek.com`
- default model: `deepseek-v4-flash`
- premium model option: `deepseek-v4-pro`
- temperature
- max output tokens
- daily message limit
- monthly token limit
- enabled scopes
- enabled skills
- enabled flag

Public settings query returns only safe metadata:

- provider
- base URL
- selected model
- has API key boolean
- masked key preview
- limits
- enabled scopes
- enabled skills
- enabled flag

It does not return the encrypted API key or plaintext API key.

Admin settings query and mutations are server-gated. `luxurious` uses authenticated users and admin role checks. `melvz` should use `sessionToken` and the existing `assertAdmin` pattern instead.

### `luxurious` Secret Pattern

`convex/aiSecrets.ts` accepts a provider key in a Convex action, validates it, encrypts it, and calls an internal mutation to save it.

`convex/aiCrypto.ts` uses:

- Node runtime action/helper.
- `AI_SETTINGS_MASTER_KEY` server env var.
- SHA-256 derived key.
- AES-256-GCM.
- Random 12-byte IV.
- Auth tag.
- Versioned payload format.

Important rule:

- React never sees the plaintext provider key after form submit.
- Convex queries never return plaintext.
- Errors must not include secrets.

This is directly useful for `melvz`.

### `luxurious` Chat Action Pattern

`convex/aiAgent.ts` is a Node Convex action.

High-level flow:

1. Authenticate user.
2. Validate message length.
3. Load AI settings.
4. Ensure AI is enabled.
5. Ensure encrypted provider key exists.
6. Check usage windows before provider call.
7. Persist user message.
8. Load recent thread messages.
9. Load thread memory.
10. Build system prompt.
11. Retrieve semantic context if enabled.
12. Decrypt API key server-side.
13. Call provider chat completions endpoint.
14. Execute model tool calls when requested.
15. Save assistant message.
16. Save usage event.
17. Update thread memory.
18. Return content, model, thread id, and activity metadata.

For `melvz`, public visitors probably do not have authenticated Convex users. M005 should decide whether visitor chat is anonymous, admin-only, or hybrid. The likely best v1:

- Public visitor chat is anonymous but rate-limited by a client-generated anonymous thread id and coarse server-side limits.
- Admin AI settings remain passcode protected.
- Admin-only knowledge upload remains passcode protected.
- The assistant may answer from public portfolio data only unless admin is signed in.

### `luxurious` Tool Calling Pattern

`luxurious` gives the model function tools:

- `searchNetwork`
- `getNetworkAnalytics`
- `getLatestAsset`
- `semanticSearch`
- `getFinanceHistory`

The action loops up to 5 steps:

1. Call model with tools.
2. If model asks for a tool, execute it with Convex queries.
3. Append tool result as a tool message.
4. Call model again.
5. Stop when model returns final content.

This is strong for complex workspace data, but `melvz` can start smaller. Resume chat has fewer data domains, so tool calling can be minimal:

- `getResumeSummary`
- `searchPortfolio`
- `getProjectDetails`
- `getExperienceDetails`
- `getSkillEvidence`
- `getContactLinks`

The v1 can also skip model tool calling and inject bounded structured context directly. However, the `luxurious` scan shows tool calling is better for follow-up questions and precise project/experience lookups. Recommendation: implement simple tool calling early, but keep tool set small.

### `luxurious` Thread Memory Pattern

`luxurious` stores memory fields on `aiChatThreads`:

- `threadSummary`
- `activeScopes`
- `activeEntities`
- `lastIntent`
- `lastToolResults`

This fixed follow-up problems like:

- User asks about one person.
- User then asks "how about Maylyn?"
- AI remembers prior intent and uses the right tool instead of guessing.

For `melvz`, thread memory should remember:

- Active project name.
- Active employer/experience.
- Active skill category.
- Last intent, such as `project_details`, `skill_evidence`, `contact`, `resume_summary`, `game_navigation`.
- Last retrieved facts.

Example:

- Visitor: "What React work has Melvin done?"
- AI: answers from projects and experience.
- Visitor: "What about Convex?"
- AI should infer the same evidence-style question and search Convex-related resume records.

### `luxurious` Embedding Pattern

`luxurious` has a generic `aiDbEmbeddings` table.

It embeds meaningful records from several tables:

- `networkMembers`
- `memberAssets`
- `financialAccounts`
- `financialTransactions`
- `academyLessons`
- `aiKnowledgeChunks`

Each embedded row stores:

- source table
- source id
- optional access owner/profile info
- title
- content
- embedding model
- embedding dimension
- embedding vector
- checksum
- updated timestamp

Embeddings are created by an internal action:

- Load source record through an internal query.
- Convert it into a stable text record.
- Call embedding provider.
- Validate vector dimension.
- Upsert embedding.

The code currently uses `VECTOR_DIMENSION = 1024`. One `luxurious` GSD note mentions 1536 dimensions, but the actual implementation uses 1024. For future work, actual code and configured embedding model must be source of truth.

For `melvz`, embeddable source records should be:

- `portfolio` content sections.
- Resume profile summary.
- Contact links.
- Skill groups.
- Education entries.
- Experience entries.
- Project entries.
- Social links.
- Game zones.
- Optional uploaded knowledge chunks.
- Optional revision metadata for admin-only queries, if later needed.

Do not embed whole `portfolio.content` as one blob only. It is too coarse. Convert it into section chunks so vector search can return precise context.

### `luxurious` Knowledge Upload Pattern

`luxurious` has admin UI for:

- PDF upload.
- Image upload with vision extraction.
- Direct text knowledge.
- TXT upload.

Backend flow:

1. Admin generates Convex storage upload URL.
2. React uploads file to Convex storage.
3. Action creates a pending knowledge document.
4. Action extracts text.
5. Action chunks text.
6. Mutation writes chunks.
7. Scheduler embeds each chunk.
8. Document becomes ready or failed.

This is useful but probably not required for `melvz` v1. Resume chat can first answer from existing portfolio content. Knowledge upload can be v2 if Melvin wants admin-uploaded supporting docs like:

- PDF resume variants.
- Certificates.
- Recommendation letters.
- Case study documents.
- Project writeups.

### `luxurious` pgvector Pattern

`luxurious` also has `convex/aiPgvector.ts` using Neon serverless Postgres.

It searches `ai_knowledge_chunks` with:

- `AI_POSTGRES_URL` or `POSTGRES_URL`.
- `@neondatabase/serverless`.
- SQL vector distance.
- scope filters.
- bounded limit.

This is more infrastructure than `melvz` needs for v1. Convex native vector index is enough for portfolio-scale data. Add pgvector only if:

- knowledge corpus grows large,
- there are many uploaded files,
- vector data needs portable Postgres ownership,
- future AI tools need cross-app references.

Recommendation for `melvz`:

- V1: Convex vector index only.
- V2: Optional uploaded knowledge docs stored in Convex and embedded into the same Convex vector table.
- V3: Optional pgvector if corpus or query volume outgrows Convex-only design.

### `luxurious` Floating Chat UI Pattern

`src/components/ai/AiChatBadge.tsx` implements:

- Fixed bottom-right badge.
- Open/closed panel.
- Message list.
- Pending composing phrases.
- Typewriter effect.
- Markdown rendering for headings, lists, code, links, quotes, and tables.
- Copy button with smart copy.
- Error panel with retry.
- Disabled state when AI missing config.

This is reusable conceptually, but `melvz` UI should match portfolio style:

- Public resume view should get a small floating chat control that does not cover resume content on mobile.
- Game mode could expose an in-world "Ask Resume AI" interaction or keep the same floating panel.
- Admin route can show richer diagnostics and configuration.
- Avoid overwhelming public visitors with workspace/admin wording.

Public empty state should be portfolio-specific:

- "Ask about Melvin's work, skills, projects, or contact details."

Not:

- "Ask anything about your workspace."

## Recommended `melvz` Product Behavior

### Public Visitor Chat

Public visitors can ask:

- "What does Melvin specialize in?"
- "Show projects using React."
- "Does he have QA experience?"
- "What government or institutional work has he done?"
- "What is his strongest backend experience?"
- "How do I contact him?"
- "Summarize his resume for a recruiter."
- "Which project best shows Convex or admin tooling?"
- "Where in the game can I find projects?"

Assistant should answer only from portfolio data and safe static context. It should not invent private details, salary, availability, secrets, or unlisted contact info.

### Admin Chat

Admin can optionally use chat for editing guidance:

- "Draft a better project description for attendance tracker."
- "Which resume section is too long?"
- "Suggest stronger bullet points."
- "What changed since last revision?"

Admin write operations must not be automatic in v1. Chat may suggest edits but must not call `updatePortfolio` unless a later milestone creates explicit admin action tools with confirmation.

### Fallback Behavior

If Convex is unavailable:

- Public portfolio still renders from static fallback content.
- AI chat should show "AI unavailable" or hide itself.
- No provider key should ever be stored in frontend env vars to make offline fallback work.

If AI provider key is missing:

- Public chat disabled with short safe message.
- Admin settings page shows missing key.

If embedding env vars are missing:

- Chat can still answer by injecting bounded portfolio context.
- Retrieval-specific features are disabled.

If vector index has no rows:

- Chat can call `getPortfolioContext` and answer from structured content.
- Admin can run reindex/backfill.

## Recommended Architecture For M005

### Layer Responsibilities

| Layer | Responsibility |
| --- | --- |
| React | Floating public chat panel, admin AI settings page, optional knowledge page later |
| Convex queries | Public settings, public portfolio context, thread messages, admin-safe reads |
| Convex mutations | Admin settings updates, chat thread/message persistence, embedding upserts |
| Convex actions | Provider calls, embedding calls, tool loop, key encryption/decryption |
| Convex storage | Optional uploaded knowledge files in later slice |
| Static fallback | Public portfolio remains usable without Convex |

### Provider Choice

`luxurious` uses DeepSeek V4 with direct OpenAI-compatible fetch. `melvz` can do the same first because it avoids adding a larger AI SDK dependency.

Default settings:

- provider: `deepseek`
- base URL: `https://api.deepseek.com`
- default model: `deepseek-v4-flash`
- premium model: `deepseek-v4-pro`
- temperature: `0.4` for resume factual answers
- max output tokens: `900`
- daily anonymous message limit: conservative
- daily admin message limit: higher

Alternative provider support can be added later by generalizing names. For v1, keep one provider to reduce risk.

### Required Server Env Vars

Convex backend:

- `ADMIN_PASSCODE` already exists.
- `AI_SETTINGS_MASTER_KEY` for encrypting provider keys.
- `AI_EMBEDDING_BASE_URL` if vector search is enabled.
- `AI_EMBEDDING_API_KEY` if vector search is enabled.
- `AI_EMBEDDING_MODEL` if vector search is enabled.

Do not use:

- `VITE_DEEPSEEK_API_KEY`
- `VITE_OPENAI_API_KEY`
- any public provider key variable

### Convex Schema Additions

Add these tables to `convex/schema.ts`.

#### `aiSettings`

Singleton keyed by `default`.

Fields:

- `key`: string
- `provider`: string
- `baseUrl`: string
- `defaultModel`: string
- `encryptedApiKey`: optional string
- `apiKeyPreview`: optional string
- `apiKeyRotatedAt`: optional number
- `temperature`: number
- `maxOutputTokens`: number
- `dailyAnonymousMessageLimit`: number
- `dailyAdminMessageLimit`: number
- `monthlyTokenLimit`: number
- `enabledScopes`: array of strings
- `enabledSkills`: array of strings
- `isEnabled`: boolean
- `showPublicChat`: boolean
- `updatedAt`: number
- `updatedBy`: optional string

Indexes:

- `by_key` on `["key"]`

#### `aiChatThreads`

For anonymous and admin conversations.

Fields:

- `clientThreadKey`: optional string
- `adminSessionTokenHash`: optional string
- `visitorKeyHash`: optional string
- `title`: string
- `threadSummary`: string
- `activeScopes`: array of strings
- `activeEntities`: array of strings
- `lastIntent`: string
- `lastToolResults`: string
- `createdAt`: number
- `updatedAt`: number

Indexes:

- `by_clientThreadKey` on `["clientThreadKey"]`
- `by_updatedAt` on `["updatedAt"]`

Privacy note:

- Do not store raw IP address.
- Do not store raw admin session token.
- If a visitor identifier is needed, store a hash.

#### `aiChatMessages`

Fields:

- `threadId`: id of `aiChatThreads`
- `role`: `"user" | "assistant" | "system"`
- `content`: string
- `model`: optional string
- `provider`: optional string
- `inputTokens`: optional number
- `outputTokens`: optional number
- `totalTokens`: optional number
- `error`: optional string
- `createdAt`: number

Indexes:

- `by_threadId_and_createdAt` on `["threadId", "createdAt"]`

#### `aiUsageEvents`

Fields:

- `threadId`: optional id of `aiChatThreads`
- `visitorKeyHash`: optional string
- `adminSessionTokenHash`: optional string
- `provider`: string
- `model`: string
- `inputTokens`: number
- `outputTokens`: number
- `status`: `"success" | "error" | "blocked"`
- `createdAt`: number

Indexes:

- `by_visitorKeyHash_and_createdAt` on `["visitorKeyHash", "createdAt"]`
- `by_adminSessionTokenHash_and_createdAt` on `["adminSessionTokenHash", "createdAt"]`
- `by_createdAt` on `["createdAt"]`

#### `aiSettingsAuditEvents`

Fields:

- `adminSessionTokenHash`: string
- `action`: string
- `safeDetails`: string
- `createdAt`: number

Indexes:

- `by_createdAt` on `["createdAt"]`

#### `aiPortfolioEmbeddings`

Convex vector table for resume and portfolio chunks.

Fields:

- `sourceType`: union/string, such as `profile`, `skill`, `experience`, `project`, `contact`, `gameZone`, `knowledge`
- `sourceKey`: string
- `title`: string
- `content`: string
- `metadata`: optional string
- `embeddingModel`: string
- `embeddingDimension`: number
- `embedding`: array of numbers
- `checksum`: string
- `updatedAt`: number

Indexes:

- `by_sourceType_and_sourceKey` on `["sourceType", "sourceKey"]`

Vector index:

- `by_embedding` on `embedding`
- dimensions must match selected embedding model

Important:

- Pick one embedding dimension and enforce it.
- Do not mix dimensions in the same vector index.
- If provider changes dimension, create a migration path.

### Convex Backend Files

Recommended new files:

- `convex/aiCrypto.ts`
- `convex/aiSettings.ts`
- `convex/aiSecrets.ts`
- `convex/aiEmbeddings.ts`
- `convex/aiPortfolioEmbeddings.ts`
- `convex/aiPortfolioEmbeddingActions.ts`
- `convex/aiContext.ts`
- `convex/aiAgent.ts`

Optional later:

- `convex/aiKnowledge.ts`
- `convex/aiKnowledgeActions.ts`

### `convex/aiCrypto.ts`

Use the `luxurious` pattern:

- Node runtime.
- AES-256-GCM.
- `AI_SETTINGS_MASTER_KEY`.
- Versioned payload.
- Fail closed if env var missing or too short.

### `convex/aiSettings.ts`

Public reads:

- `getPublicSettings`
  - returns `hasApiKey`, `apiKeyPreview`, model, enabled flag, public chat flag
  - never returns encrypted key

Admin reads:

- `getAdminSettings`
  - requires `sessionToken`
  - returns safe settings metadata and audit rows

Admin mutations:

- `updateSettings`
  - requires `sessionToken`
  - validates numbers and arrays
  - writes audit event

Internal functions:

- `getSettingsForAction`
- `saveEncryptedKey`
- `saveUsageEvent`
- `createUserMessage`
- `saveAssistantMessage`
- `getRecentMessages`
- `getThreadMemory`
- `updateThreadMemory`
- `getUsageWindow`

### `convex/aiSecrets.ts`

Action:

- `saveProviderKey`

Args:

- `sessionToken`
- `apiKey`

Behavior:

- Validate admin session with existing passcode session pattern.
- Trim and validate key.
- Encrypt in action.
- Save encrypted key through internal mutation.
- Return masked preview only.

### `convex/aiEmbeddings.ts`

Action/helper:

- `embedQuery(text: string)`

Behavior:

- Read `AI_EMBEDDING_BASE_URL`, `AI_EMBEDDING_API_KEY`, `AI_EMBEDDING_MODEL`.
- Return `null` if env missing.
- Call embeddings endpoint.
- Return vector array only.
- Log safe provider failure, no secrets.

### `convex/aiPortfolioEmbeddings.ts`

Responsibilities:

- Convert portfolio content into embeddable chunks.
- Store embeddings.
- Delete stale embeddings.
- Return accessible vector results.

Embeddable chunk examples:

- `profile.summary`
  - title: `Resume summary`
  - content: name, role, summary, current focus
- `profile.contact.email`
  - title: `Contact email`
  - content: safe public email/contact line
- `skills.frontend`
  - title: `Frontend skills`
  - content: category and skill list
- `experience.0`
  - title: employer and role
  - content: role, company, period, body bullets
- `project.featured.0`
  - title: project name
  - content: stack, description, links
- `game.zone.projects`
  - title: game zone
  - content: zone label and project cards

Do not include:

- Admin session tokens.
- Provider settings.
- Internal revision data for public chat.
- Any private env vars.

### `convex/aiPortfolioEmbeddingActions.ts`

Internal actions:

- `embedPortfolioChunk`
- `backfillPortfolioEmbeddings`
- `deletePortfolioEmbedding`
- `testEmbed`

Trigger points:

- After `updatePortfolio`, schedule embedding refresh.
- After rollback, schedule embedding refresh.
- After seed, optionally schedule embedding refresh.

Important Convex rule:

- Actions cannot use `ctx.db`.
- Actions must call internal queries/mutations.
- Keep Node runtime only in files with actions.

### `convex/aiContext.ts`

Internal queries/tools:

- `getPortfolioContext`
- `searchPortfolioTool`
- `getProjectDetailsTool`
- `getExperienceDetailsTool`
- `getSkillEvidenceTool`
- `getContactLinksTool`

All queries must be bounded. Avoid `.collect()` over future unbounded tables. For current single portfolio document, fetching one row by `key` is acceptable.

### `convex/aiAgent.ts`

Public action:

- `sendMessage`

Args:

- `threadId`: optional `v.id("aiChatThreads")`
- `clientThreadKey`: optional string
- `message`: string
- `sessionToken`: optional string for admin mode

Behavior:

1. Trim and validate message.
2. Reject empty message.
3. Enforce max input length, such as 2000 chars public and 4000 admin.
4. Load public/admin settings.
5. Ensure AI enabled.
6. Ensure provider key exists.
7. Apply usage limits.
8. Create or load thread.
9. Save user message.
10. Load recent messages, max 12 to 18.
11. Load thread memory.
12. Retrieve portfolio context:
    - Try vector search if embeddings configured and rows exist.
    - Fall back to structured portfolio context.
13. Build system prompt.
14. Decrypt provider key.
15. Call chat completion endpoint.
16. Optionally execute small tool loop.
17. Save assistant message.
18. Save usage event.
19. Update memory.
20. Return thread id, content, model, and activity.

### Suggested System Prompt

The system prompt should be factual and portfolio-scoped:

```text
You are Melvin Nogoy's portfolio assistant.
Answer only from the provided portfolio, resume, project, skill, contact, and game context.
Be concise, useful, and recruiter-friendly.
If the user asks for private data, secrets, salary, references, or anything not present in context, say that the portfolio does not provide that information.
If the user asks how to contact Melvin, use only public contact links in the context.
If the user asks about a project or skill, cite the relevant project, experience, or skill group by name.
Do not invent dates, employers, metrics, or claims.
```

Admin mode can add:

```text
The admin may ask for editing suggestions. Suggestions are drafts only. Do not claim that content was saved unless an explicit save tool confirms it.
```

### Suggested Tools

V1 can use this tool set:

- `searchPortfolio`
  - semantic or keyword search over resume chunks
- `getProjectDetails`
  - find one project by name/stack
- `getExperienceDetails`
  - find one job/role/employer
- `getSkillEvidence`
  - answer "does Melvin know X?" with supporting evidence
- `getContactLinks`
  - return public contact links

Return activity metadata to UI:

- kind: `search` or `tool`
- name
- status
- label
- detail
- count

This allows UI chips like:

- `Searched projects`
- `Read skills`
- `Checked contact links`

## Retrieval Strategy

### V1 Recommended Retrieval

Use hybrid fallback:

1. Vector search over `aiPortfolioEmbeddings` when embedding env vars are configured.
2. Structured context fallback from the current `portfolio` row.
3. Static fallback content only on the frontend if Convex unavailable.

This gives AI best-effort behavior without requiring vector setup on day one.

### Chunking Rules

Portfolio content is small, but chunk precision matters.

Recommended chunk sizes:

- Profile summary: one chunk.
- Each skill category: one chunk.
- Each experience: one chunk.
- Each featured project: one chunk.
- Each compact project: one chunk.
- Each game zone: one chunk.
- Contact links: one chunk.

Keep chunks under roughly 1500 to 2500 chars.

### Keyword Fallback

If vector search unavailable:

- Search lowercased chunk content for query words.
- Prefer exact matches in title, stack, company, role, and skill names.
- Return top 6 chunks.
- Always include profile summary and contact chunk when relevant.

This fallback is enough for early public chat.

## Frontend Design

### Public Chat Component

Recommended files:

- `src/components/ai/ResumeAiChat.tsx`
- `src/components/ai/MarkdownMessage.tsx`
- `src/components/ai/aiChatTypes.ts`

Behavior:

- Fixed bottom-right on desktop.
- Bottom sheet on mobile.
- Does not cover important resume action buttons.
- Hidden or disabled when AI disabled or key missing.
- Stores `clientThreadKey` in local storage.
- Shows short empty state.
- Shows pending state.
- Shows assistant markdown.
- Shows safe error panel.
- Has retry.
- Has copy answer.

Public copy:

- Title: `Ask Melvin AI`
- Placeholder: `Ask about skills, projects, work history...`
- Empty state: `Ask about Melvin's resume, projects, skills, or contact links.`

### Admin AI Settings UI

Recommended file:

- `src/components/admin/AiSettingsPanel.tsx` or route-like hash page under `#admin/ai`

Since current app uses hash routing:

- Add `#admin/ai-settings`
- Or embed in existing `/#admin` as an admin panel section

Sections:

- Provider and model.
- API key status and rotation.
- Temperature and max tokens.
- Public chat enabled toggle.
- Daily anonymous/admin limits.
- Retrieval enabled toggle.
- Embedding status.
- Audit events.

Admin UI must pass `sessionToken` to AI settings queries/mutations.

### Mounting

Public route:

- Mount chat inside `ReactUI` or a top-level component where public portfolio is visible.
- Hide on `#admin/history` if it interferes with history UI, or keep admin mode only.

Admin route:

- Admin settings accessible from `/#admin`.
- Chat can remain public-mode unless admin mode is explicitly implemented.

## Security Rules

Hard rules:

- No provider key in frontend env vars.
- No provider key in React state after successful submit beyond transient input field.
- No plaintext provider key in Convex query result.
- No AI settings writes without server-side admin session validation.
- No chat tool can write portfolio content in v1.
- No public chat can read revision history or admin session data.
- No raw IP storage unless privacy policy supports it.
- No unbounded chat history reads.
- No unbounded vector results.
- No provider request/response logs containing secrets.

Public chat data policy:

- User messages are stored in Convex if chat persistence is enabled.
- Add visible notice later if production privacy needs it.
- Consider short retention or admin purge later.

Rate limiting:

- `luxurious` limits by authenticated user.
- `melvz` public visitors need a different key.
- V1 can rate limit by `clientThreadKey` hash and daily usage events.
- This is not abuse-proof because visitors can clear local storage.
- Stronger rate limiting requires server-visible IP/header access through HTTP endpoint or an auth layer.

## Implementation Slices

### Slice 1 - GSD And Requirements

- Add this M005 context file.
- Add an M005 roadmap file later when implementation starts.
- Update `.gsd/REQUIREMENTS.md` with AI chat requirements.
- Update `.gsd/DECISIONS.md` with provider/key/retrieval decisions after final provider choice.
- Update `.gsd/RUNTIME.md` with AI env vars after implementation.

### Slice 2 - Convex AI Settings And Encryption

- Add `aiSettings`, `aiSettingsAuditEvents`, and possibly `aiUsageEvents`.
- Add `aiCrypto.ts`.
- Add `aiSettings.ts`.
- Add `aiSecrets.ts`.
- Use existing `adminSessions` table and server-side validation.
- Verify encrypted key cannot be read through public query.

### Slice 3 - Basic Chat Without RAG

- Add `aiChatThreads` and `aiChatMessages`.
- Add `aiAgent.ts` action.
- Build structured context from `portfolio` row.
- Call provider with direct fetch.
- Persist messages and usage.
- Add frontend chat panel.

This slice proves provider, settings, persistence, and UI.

### Slice 4 - Portfolio Chunking And Embeddings

- Add `aiPortfolioEmbeddings` vector table.
- Add chunk materializer from `PortfolioContent`.
- Add embedding helper and backfill action.
- Schedule re-embedding after portfolio save and rollback.
- Add vector search to `aiAgent`.

### Slice 5 - Tool Calling And Memory

- Add small tool set.
- Add loop for model tool calls.
- Add memory fields to `aiChatThreads`.
- Store active skill/project/employer and last intent.
- Return activity metadata for UI chips.

### Slice 6 - Admin Settings UI

- Add admin AI settings panel/page.
- Add key rotation form.
- Add enable/disable toggle.
- Add model/temperature/limit controls.
- Add audit event list.

### Slice 7 - Optional Knowledge Upload

Only if needed:

- Add `aiKnowledgeDocuments`.
- Add `aiKnowledgeChunks`.
- Add upload URL mutation.
- Add TXT/PDF upload.
- Add chunk ingestion action.
- Embed chunks into `aiPortfolioEmbeddings` or a separate table.

Keep this out of v1 unless user specifically wants uploadable PDFs.

### Slice 8 - Verification

- Run `npx convex codegen`.
- Run `npm run typecheck`.
- Run `npm run build`.
- Run lint if practical.
- Verify public portfolio still works without Convex.
- Verify public chat disabled when key missing.
- Verify key save requires admin session.
- Verify encrypted key not returned.
- Verify chat answers from current portfolio.
- Verify AI refuses private/unlisted claims.
- Verify save/rollback reindexes embeddings.
- Verify mobile chat panel does not cover critical resume content.

## Acceptance Criteria

M005 is complete when:

- Public visitors can open AI chat from the portfolio.
- Chat answers factual resume/project/skill/contact questions using Convex portfolio content.
- Chat does not expose provider key, admin session, revision history, or private server data.
- Admin can save/rotate provider key without plaintext returning to React.
- Admin can enable/disable public chat.
- Chat degrades safely when AI key, embedding env, or Convex data is missing.
- Portfolio static fallback still renders without Convex.
- Resume save and rollback schedule embedding refresh or mark embeddings stale.
- Typecheck/build pass or known unrelated failures are documented.

## Open Questions

- Should public chat be visible on first load, or only after clicking a small badge?
- Should chat responses be stored permanently, or should anonymous threads expire?
- Should admin chat be allowed to suggest edits only, or eventually apply edits with confirmation?
- Which provider should be used for production: DeepSeek only, or a provider-agnostic OpenAI-compatible config?
- Which embedding model should be chosen, and what dimension will schema enforce?
- Should uploaded PDFs/certificates be in v1, or after resume chat works?
- Should there be a public privacy notice before storing visitor chat messages?

## Strong Recommendation

Build M005 in this order:

1. Admin AI settings and encrypted key.
2. Basic portfolio chat using structured Convex context.
3. Public floating chat UI.
4. Portfolio chunk embeddings with Convex vector search.
5. Tool calling and thread memory.
6. Optional knowledge uploads.

Reason:

- `melvz` portfolio content is small.
- Structured context gives useful chat quickly.
- Convex vector search can improve precision later without adding Postgres.
- pgvector is not needed until corpus grows.
- Admin security must come before any provider key storage.

## Lessons From `luxurious` To Keep

- Keep provider calls in Convex actions, never React.
- Encrypt API keys at rest.
- Return only key preview and `hasApiKey`.
- Persist messages and usage for observability.
- Keep retrieval bounded.
- Use thread memory for follow-up questions.
- Use tool calling for precise facts.
- Show safe provider errors in the UI.
- Add activity metadata so users know when search/tools ran.
- Schedule embedding updates after source data changes.

## Lessons From `luxurious` To Simplify

- Do not start with pgvector unless needed.
- Do not add authenticated users just for public chat.
- Do not copy finance/org/network tools.
- Do not add image/PDF ingestion until resume chat works.
- Do not allow AI write tools in v1.
- Do not make admin settings depend on `@convex-dev/auth`; use current passcode session.

## Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Provider key leaks to frontend | Critical | Server-only actions, encrypted storage, safe public queries |
| AI invents resume claims | High | Strict system prompt, bounded context, tool answers from source data |
| Public abuse drives cost | High | Conservative limits, disable toggle, usage events, optional stronger HTTP/IP limit later |
| Embedding dimension mismatch | Medium | Store dimension, validate before upsert, one vector index dimension |
| Convex unavailable | Medium | Hide/disable AI and keep static portfolio fallback |
| Chat panel hurts mobile UX | Medium | Bottom sheet layout, viewport testing |
| Admin chat writes bad content | Medium | No write tools in v1 |
| Stale embeddings after edits | Medium | Schedule reindex after save, image update not needed unless image metadata text changes, rollback refresh |

## Draft M005 Roadmap Shape

When implementation starts, create `M005-ai-rag-resume-chat-ROADMAP.md` with:

- Slice 1 - Docs and decisions.
- Slice 2 - AI settings schema and encryption.
- Slice 3 - Provider key rotation.
- Slice 4 - Basic chat action and message persistence.
- Slice 5 - Public chat UI.
- Slice 6 - Portfolio chunk materializer.
- Slice 7 - Convex vector embedding/backfill.
- Slice 8 - Tool calling and memory.
- Slice 9 - Verification and production env notes.

## Final Design Bias

`luxurious` proves the full system works, but `melvz` should be lean. Resume chat does not need a heavy RAG stack on day one. Start with server-side AI settings, safe provider calls, and structured Convex portfolio context. Then add Convex vector search once chat is working. Keep pgvector and uploaded knowledge as later options.
