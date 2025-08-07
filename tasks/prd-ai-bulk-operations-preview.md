# AI Prompt Bulk Operations Preview

## 1. Introduction / Overview
Today, users must perform timeline edits one at a time through three separate input fields (title, start date, duration). The new "AI Prompt Bulk Operations Preview" feature lets users type a plain-English prompt (e.g., “Delete tasks 5 & 7 and add ‘Design review’ after task 12”) and instantly preview the resulting changes on the timeline **before** committing them to the database.  
The feature’s core goal is to improve editing speed and confidence by turning natural-language instructions into a structured list of operations that can be individually approved or rejected.

## 2. Goals
1. Convert a user prompt into a structured list containing only *Add Task*, *Delete Task*, *Add Dependency*, or *Delete Dependency* operations.  
2. Render every successful operation in the timeline preview in **< 1 second** for projects of up to **1 000 tasks**.  
3. Allow a user to approve or reject any operation with **≤ 2 clicks** per operation.  
4. Persist only *approved* operations to the production database; rejected or unreviewed items are discarded.  
5. Clearly surface errors (e.g., circular dependencies) without blocking the rest of the operation set.

## 3. User Stories
1. **As a project manager**, I want to describe multiple edits in plain English so that I can update the project faster than using individual forms.
2. **As a casual user**, I want to preview AI-generated changes on the timeline before saving them so that I don’t accidentally break my schedule.
3. **As a power user**, I want to accept or reject each AI-suggested change individually so that I stay in full control of my project data.

## 4. Functional Requirements
1. **UI Toggle**  
   1.1 A "Try Me" button appears next to the existing "Add Task" bar.  
   1.2 Clicking "Try Me" hides the three-field form and shows a single-line text input plus a "Go" button.  
   1.3 Users can exit AI mode and return to the normal form via an "×" icon or *Esc* key.

2. **Prompt Processing**  
   2.1 On "Go", the frontend sends the prompt, project ID, and current timeline context to `/api/ai/bulk-preview`.  
   2.2 The backend calls OpenAI (GPT-4o) with a system prompt that instructs the model to return a JSON array of operations. Only the following operation types are allowed:

```json
{
  "type": "ADD_TASK" | "DELETE_TASK" | "ADD_DEPENDENCY" | "DELETE_DEPENDENCY",
  "payload": {},
  "id": "uuid-v4"
}
```
   2.3 Unsupported or ambiguous instructions must be omitted; the model should not invent new operation types.

3. **Draft Application & Validation**  
   3.1 The server applies operations **inside a transaction** with `isDraft = true` flags on new or modified rows.  
   3.2 All *DELETE* operations execute first; then *ADD* operations run.  
   3.3 After application, the server runs existing circular-dependency detection logic.  
   3.4 Operations that still cause a circular dependency are recorded with `status = "failed"` and a reason; the rest continue.

4. **Response Payload**
```ts
interface PreviewResponse {
  operations: Array<
    {
      id: string;
      type: "ADD_TASK" | "DELETE_TASK" | "ADD_DEPENDENCY" | "DELETE_DEPENDENCY";
      status: "success" | "failed";
      message?: string; // only when failed
    }
  >;
  timeline: TimelineGraph; // includes draft nodes/edges
}
```

5. **Timeline Preview**  
   5.1 The frontend renders draft tasks with a dashed border; draft dependencies with a dashed arrow.  
   5.2 Failed operations appear in a diff list with a red "!" icon and tooltip containing the failure reason.  
   5.3 Each row shows **Accept ✓ / Reject ✗** buttons.  
   5.4 "Accept All" and "Reject All" buttons sit at the top of the list.

6. **Approval Flow**  
   6.1 Clicking *Accept* sends `PATCH /api/ai/bulk-preview/{operationId}` which flips `isDraft ➜ false` and commits the change.  
   6.2 Clicking *Reject* sends `DELETE /api/ai/bulk-preview/{operationId}` which removes the draft row.  
   6.3 After all operations are resolved, the diff list closes and the timeline reverts to normal editing mode.

7. **Performance**  
   7.1 For projects ≤ 1 000 tasks, the round-trip time (prompt ➝ preview render) must be < 1 s in 95 th percentile.  
   7.2 Server endpoints must stream updates if processing exceeds 500 ms.

## 5. Non-Goals (Out of Scope)
- Updating existing task attributes (title, dates, duration) via AI (future work).  
- Undo/Redo after final approval.  
- AI prompt-writing assistance or wizard-style UI.  
- Support for 3rd-party timeline export/import.

## 6. Design Considerations (Optional)
- The single-input bar should reuse the existing form’s width to avoid layout shifts.  
- Draft items can reuse Tailwind utility classes (e.g., `border-dashed`, `opacity-50`).  
- Diff list can slide up from the bottom similar to the current Task Modal for visual consistency.  
- Accessibility: all Accept/Reject controls must be keyboard-navigable.

## 7. Technical Considerations (Optional)
- **LLM Provider:** OpenAI; use model `gpt-4o-mini` (or latest cost-effective model) with temperature 0.2.  
- **Auth:** Endpoints inherit existing NextAuth session middleware.  
- **Schema Changes:** add `isDraft:boolean` default `false` to `Task` and `Dependency` tables.  
- **Operation Ordering:** Apply DELETEs first, then ADDs to minimize circular-dependency false positives.  
- **Cleanup:** Cron job deletes orphaned drafts older than 24 h.  
- **Rate Limits:** 10 preview requests per user per hour to control OpenAI cost.  
- **Error Handling:** Return HTTP 207 Multi-Status when some operations fail.  
- **Security:** Validate JSON operation schema before execution to avoid prompt injection.

## 8. Success Metrics
| Metric | Target |
|---|---|
| Preview render time | < 1 s P95 for ≤ 1 000 tasks |
| Clicks per operation approval | ≤ 2 |
| Draft cleanup job | removes 100 % of drafts > 24 h old |
| Unhandled errors | 0 in Sentry for first 30 days |

## 9. Open Questions
1. Should drafts be visible to collaborators in real time or isolated per user?  
2. What is the exact JSON schema for `payload` in each operation type?  
3. Where in the UI should error messages live—toast notifications, inline diff list, or both?  
4. How long should the AI mode remain active after an unsuccessful preview? (auto-exit?)

