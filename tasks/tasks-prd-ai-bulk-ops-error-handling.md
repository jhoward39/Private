## Relevant Files

- `lib/openai.ts` - Builds prompt, parses/normalises LLM output.
- `app/api/ai/bulk-preview/route.ts` - Creates drafts and returns operations; will emit authoritative IDs.
- `app/api/ai/bulk-preview/[operationId]/route.ts` - Accept/Reject handlers; needs ID-handling tweaks.
- `types/ai.ts` - Shared Operation types; will gain optional inbound ID.
- `app/page.tsx` - Stores previewOps; will consume updated operation objects.

### Notes
- Unit tests should live next to code (e.g., `openai.test.ts`).
- Use `npx jest` to run tests.

## Tasks

- [ ] 1.0 Tighten LLM prompt in `lib/openai.ts`
  - [x] 1.1 Add one-shot example that illustrates correct operation schema.
  - [x] 1.2 Explicitly list required keys (`title`, `dueDate`, `duration`) and forbid synonyms.
  - [x] 1.3 Reduce temperature to 0.1 and set `response_format: { type: "json_object" }` when supported.

- [ ] 2.0 Implement normalisation layer for common key synonyms
  - [x] 2.1 Create a `normalizeOperation` util in `lib/openai.ts` that maps `task|name→title`, `date→dueDate`, `days→duration`.
  - [x] 2.2 Integrate normalisation before validation in `getPreviewOperations`.
  - [ ] 2.3 Add Jest tests covering mapping and dropping unknown keys.

- [ ] 3.0 Return authoritative IDs from bulk-preview API
  - [x] 3.1 Patch ADD_TASK with authoritative taskId after creation.
  - [x] 3.2 For `ADD_DEPENDENCY`, confirm `fromId`/`toId` are DB IDs and patch operation if needed.
  - [x] 3.3 Response already returns updated operations list with authoritative IDs.
  - [x] 3.4 Update `types/ai.ts`: make `id` optional on inbound, required on outbound.

- [ ] 4.0 Update Accept/Reject endpoints & client storage to use new IDs
  - [ ] 4.1 Modify `[operationId]/route.ts` to rely on IDs returned from step 3 and remove `payload.taskId` requirement.
  - [ ] 4.2 After preview, replace `previewOps` in the client with server-returned list.
  - [ ] 4.3 Ensure Accept All / Reject All loops use these IDs and refresh timeline on completion.
  - [ ] 4.4 Add error handling that marks failed Accept/Reject in diff panel.

- [ ] 5.0 Add detailed console logging for raw, normalised, and final operations
  - [ ] 5.1 Log raw LLM JSON (`LLM raw content`).
  - [ ] 5.2 Log normalised array (`Normalised ops`).
  - [x] 5.3 Log server-returned ops with IDs (`Server ops`).
  - [x] 5.4 Guard logs behind `process.env.NODE_ENV !== "production"`.

