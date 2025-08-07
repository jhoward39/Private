# AI Bulk Operations Reliability Improvements

## 1. Introduction / Overview
The current AI Prompt Bulk Operations Preview occasionally returns malformed operations (e.g., wrong payload keys) and fails to apply Accept/Reject actions because IDs are missing. This PRD proposes a reliability layer that (1) normalises common key synonyms, (2) tightens the LLM prompt, and (3) ensures Accept/Reject always succeeds by generating the authoritative IDs on the server and returning them to the client.

## 2. Goals
1. Ensure 100 % of syntactically valid LLM operations reach the timeline preview (auto-mapping common key synonyms).
2. Eliminate 500-level errors from Accept/Reject endpoints by always returning server-generated IDs.
3. Keep UI unchanged except for existing error badges; additional feedback stays in the console only.

## 3. User Stories
1. **As a user**, I want the AI preview to work even if I phrase dates or titles differently so I don’t have to re-prompt.  
2. **As a user**, when I click Accept or Accept All, the change should apply without server errors.  
3. **As a developer**, I want console logs to show raw and normalised operations so I can debug edge cases quickly.

## 4. Functional Requirements
1. **Prompt Tuning**  
   1.1 System prompt explicitly lists required keys (`title`, `dueDate`, `duration`) and forbids alternatives.  
   1.2 Adds one-shot example in the prompt that shows correct schema.

2. **Normalisation Layer**  
   2.1 Before validation, map common synonyms:  
   • `task` → `title`  
   • `name` → `title`  
   • `date` → `dueDate`  
   • `days` → `duration`  
   2.2 Unknown keys are removed; operation proceeds if required keys are present.  
   2.3 After normalisation, console-log both raw and final objects.

3. **Server-Side ID Generation**  
   3.1 For `ADD_TASK` and `ADD_DEPENDENCY`, the server creates the draft row, captures the DB auto-ID, and returns an updated Operations list with authoritative `taskId` / `fromId` + `toId`.  
   3.2 Client stores the returned operations for subsequent PATCH/DELETE.

4. **Accept / Reject Endpoints**  
   4.1 Accept:  
   • `ADD_*` → flips `isDraft:false` using server IDs.  
   • `DELETE_*` → deletes draft rows.  
   4.2 Reject:  
   • `ADD_*` → deletes draft rows.  
   • `DELETE_*` → flips `isDraft:false` to restore.  
   4.3 Endpoints return `{ success:true }` or `{ error:"…" }` JSON.

5. **Logging & Feedback**  
   5.1 Console logs:  
   • Raw LLM JSON  
   • Normalised operations  
   • Server-generated Operations with IDs  
   5.2 No new UI elements; existing error badge remains.

## 5. Non-Goals
- No UI toast notifications.  
- No retry loops beyond the first normalisation pass.  
- No schema changes outside `isDraft` already implemented.

## 6. Technical Considerations
- Normalisation implemented in `lib/openai.ts` before validation.  
- Use `crypto.randomUUID()` only as fallback; prefer DB IDs.  
- Update TypeScript types to make `id` optional on inbound operations and required on outbound.  
- Accept/Reject endpoints must refresh tasks/dependencies to reflect committed changes.

## 7. Success Metrics
- Developer (you) confirms behaviour is “good” via manual testing.  
- Zero console errors during Accept / Reject in 10 consecutive trial runs.

## 8. Open Questions
1. Any additional synonyms to map?  
2. Should normalisation warn (console) when keys are dropped?

