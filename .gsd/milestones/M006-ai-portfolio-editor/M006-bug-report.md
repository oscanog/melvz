# M006 AI Editor Bug Report

## The Issue
The tester clicked "Apply" on an AI-proposed change (e.g., updating the Education graduation date), but the database was not updated. The tester reported: "my boss is so angry, the ai didnt update the database after approved of tester".

## What Was Attempted (The Failed Solution)
1. **Identified an asynchronous state closure bug**: In `ResumeAiChat.tsx`'s `handleApplyProposal`, `targetProposal` was being assigned *inside* the asynchronous React `setMessages` updater function, but evaluated synchronously immediately after.
2. **The Fix Attempted**: Extracted `targetProposal` synchronously using a `for` loop over the `messages` array, added `messages` to the `useCallback` dependency array, and then updated the state and called the backend.

## Why The Solution Didn't Work
The user reported that the solution still didn't fix the core issue. Here are the likely reasons why it failed or remains broken:

### 1. The `AdminPage` Draft Overwrite Issue
- `AdminPage.tsx` manages a local `draft` state and a `dirty` flag.
- When the AI calls `admin.updatePortfolio`, it updates the Convex database directly.
- `AdminPage` listens to `content` via `usePortfolioContent()`. If `dirty` is `true` (because the admin clicked an inline field), `AdminPage` **ignores** the new database `content` and keeps showing the old `draft`.
- If the admin subsequently clicks "Save" on the main page, their stale `draft` overwrites the AI's changes in the database.
- **Fix needed**: The AI chat should not update the database directly if it's operating inside the inline editor. Instead, it should apply its changes to the `AdminPage`'s `draft` state and let the admin click "Save" to commit everything.

### 2. LLM Tool Hallucination / Partial Data
- In `applyProposalToContent`, we completely replace the existing array:
  ```typescript
  case "education":
    return {
      ...content,
      education: Array.isArray(d.education) ? d.education : content.education,
    };
  ```
- The prompt tells the AI to "Provide the full replacement education array". However, LLMs often hallucinate or provide partial data (e.g., only the single item that changed).
- If the LLM only provided the changed education item, the rest of the education history gets wiped out. If it provided the wrong schema entirely, the array replacement silently corrupts the data or fails.

### 3. Missing `await` or Error Swallowing
- If `updatePortfolio` failed on the backend, the `try/catch` in `handleApplyProposal` marks the proposal as `failed`, but the UI doesn't make it aggressively obvious if the user scrolls away.
- Alternatively, maybe the provider request payload was malformed and the tool call never even reached the "pending" UI state properly, though the screenshot showed the UI card did render.

## Learnings & Mistakes
- **Mistake**: Blindly assumed the bug was solely the React state closure without holistically looking at the `AdminPage` architecture. `ResumeAiChat` and `AdminPage` are fighting over the source of truth.
- **Mistake**: Mutating the backend database directly from a child component while the parent component (`AdminPage`) has a complex unsaved `draft` state.
- **Learning**: Always trace data flow end-to-end. If the AI is an "assistant to the admin", it should behave like the admin—editing the draft, not circumventing the admin's save button.
- **Learning**: LLMs cannot be trusted to rewrite entire arrays perfectly. The tool architecture should probably use surgical JSON patches (e.g., `updateItemAt(index)`) rather than full array replacements to minimize data loss.

## Instructions for the Next AI
1. Read `src/components/AdminPage.tsx` and understand the `draft` and `dirty` state.
2. Refactor `ResumeAiChat.tsx` to accept a `currentDraft` and `onApplyDraft` prop when in admin mode, so the AI patches the *draft* instead of directly calling `updatePortfolio`.
3. Check the `aiAgent.ts` tool schema and `applyProposalToContent` logic to ensure it's robust against partial array responses from the LLM.

---

## The Real Fix (Applied)

### Root Cause
The chat component was calling `updatePortfolio` directly (writing to Convex DB), but `AdminPage` maintains a local `draft` state that only syncs from DB when `dirty === false`. This created two competing sources of truth.

### Architecture Change
1. **Removed direct DB writes from the chat**. `ResumeAiChat` no longer imports `useMutation(api.admin.updatePortfolio)`.
2. **Added `onApplyDraft` callback prop** — `AdminPage` passes a callback that sets the local `draft` state, marks `dirty = true`, and pre-fills the save message with the AI revision hint.
3. **Apply is now synchronous** — no async `await` needed, no "applying" spinner state. Clicking Apply instantly patches the draft. The admin sees the change in the inline editor and clicks Save when ready.
4. **Same save flow as manual edits** — revision history, `createdBy`, and validation all go through the existing `AdminPage.save()` path.

### Files Changed
| File | Change |
|------|--------|
| `src/components/ai/ResumeAiChat.tsx` | Removed `useMutation`, added `onApplyDraft` prop, made `handleApplyProposal` synchronous |
| `src/components/AdminPage.tsx` | Passes `onApplyDraft` callback that patches draft + sets dirty + pre-fills save message |

### Why This Fixes It
- No more source-of-truth conflict between chat and admin editor.
- The admin always sees the AI's changes in the inline editor before committing.
- Save message is pre-filled with the AI's revision hint (e.g. "AI: edit Education — Updated graduation date").
- If the admin rejects the visual result, they can click Reset to discard.
