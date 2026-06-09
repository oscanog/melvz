# M007 — AI Chat Session History

Visitors and admins can browse past chat sessions in a ChatGPT-style sidebar/modal.
Clicking a past session restores its messages so the user can continue the conversation.
A "New Chat" button starts a fresh thread.

## Existing Infrastructure

- `aiChatThreads` table already stores `visitorKeyHash`, `title`, `updatedAt`, `createdAt`.
- `aiChatMessages` table stores messages with `threadId`, indexed by `by_threadId_and_createdAt`.
- Frontend uses a `clientThreadKey` in localStorage, hashed server-side to `visitorKeyHash`.
- Thread title is auto-set to the first 64 chars of the first user message.

## Slice 1 — Backend Queries

- [x] Add `listThreads` query: takes `clientThreadKey`, returns threads for that visitor ordered by `updatedAt` desc, limit 30.
- [x] Add `getThreadMessages` query: takes `clientThreadKey` + `threadId`, returns all messages for that thread (user+assistant only).
- [x] Both queries hash the key server-side and verify ownership.

## Slice 2 — Chat Session UI

- [x] Add a clock/history icon button in the chat header → opens a "Chat Sessions" modal.
- [x] Modal lists past sessions: title, relative time (e.g. "2 hours ago"), message preview.
- [x] Clicking a session loads its messages into the chat and sets the active `threadId`.
- [x] "New Chat" button at the top clears messages and resets `threadId` to `undefined`.
- [x] Active session is highlighted in the list.

## Slice 3 — Polish & Styling

- [x] Style the session list modal matching existing `.resume-ai-panel` design language.
- [x] Empty state when no past sessions exist.
- [x] Truncate long titles with ellipsis.
- [x] Smooth open/close transitions.

## Slice 4 — Inline Save Button (Bonus Feature)

- [x] Add `onSaveDraft` and `hasPendingSave` to `ResumeAiChat`.
- [x] Display a save bar inside the chat panel when there are unsaved AI changes.
- [x] Auto-generate the save message based on AI tool proposals (e.g., "AI: edit Education — Updated graduation date").
- [x] `AdminPage` handles the actual `admin.updatePortfolio` mutation to persist changes.

## Slice 5 — Auto-Generated AI Session Naming

- [x] When a new chat session begins, use the DeepSeek LLM (via an internal Convex action) to read the very first user message.
- [x] Automatically generate a short, 4-5 word summary title.
- [x] Update the `aiChatThreads` table so the sidebar displays this human-readable title instead of a raw message truncation.

## Files Expected To Change

| File | Change |
|------|--------|
| `convex/aiSettings.ts` | Add `updateThreadTitle` mutation |
| `convex/aiAgent.ts` | Add `generateThreadTitle` internal action, call it on new threads |
| `src/components/ai/ResumeAiChat.tsx` | Session history modal, thread switching, new chat button |
| `style.css` | Session list modal styles |
