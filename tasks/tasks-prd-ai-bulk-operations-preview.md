## Relevant Files

- `app/page.tsx` - Contains current Add Task form that needs the AI "Try Me" toggle.
- `app/components/Timeline/` - Renders tasks and dependencies; will display draft nodes/edges.
- `app/components/TaskModal.tsx` - Existing modal pattern to reuse for diff list overlay.
- `app/api/ai/bulk-preview/route.ts` (new) - Server route to call OpenAI and return preview payload.
- `prisma/schema.prisma` - Add `isDraft` boolean to `Task` and `Dependency` models.
- `lib/dependencies.ts` - Where circular-dependency logic lives; ensure it supports drafts.
- `lib/openai.ts` (new) - Encapsulate OpenAI calls and prompt building.
- 

### Notes

- Unit tests should live alongside code files, e.g., `bulk-preview.test.ts` next to the API route.
- Use `npx jest` to run all tests or target specific files.

## Tasks

- [ ] 1.0 Implement UI toggle for AI Prompt mode in the Add Task bar
  - [x] 1.1 Add "Try Me" button next to existing Add Task fields in `app/page.tsx`.
  - [x] 1.2 Replace three-field form with single text input + "Go" button when AI mode is active.
  - [x] 1.3 Button toggles text to "Back" (×) when AI mode is active to exit AI mode.
  - [x] 1.4 Preserve unsent text when toggling between modes.

- [ ] 2.0 Build `/api/ai/bulk-preview` endpoint with OpenAI integration
  - [x] 2.1 Create `app/api/ai/bulk-preview/route.ts` with POST handler.
  - [x] 2.2 Implement `lib/openai.ts` helper that sends prompt + context to GPT-4o and returns JSON.
  - [x] 2.3 Define `Operation` and `PreviewResponse` TypeScript interfaces shared by client & server.
  - [x] 2.4 Validate model output against allowed operation types and strip invalid entries.

- [ ] 3.0 Add draft application & validation logic plus DB schema migrations
  - [x] 3.1 Add `isDraft boolean @default(false)` to `Todo` and `TaskDependency` in `schema.prisma`; run migration.
  - [x] 3.2 In `/api/ai/bulk-preview` handler, apply DELETE operations first, then ADD operations in a transaction, setting `isDraft = true`.
  - [x] 3.3 Extend `lib/dependencies.ts` circular-dependency checker to include draft nodes/edges.
  - [x] 3.4 Mark operations that still create cycles with `status: "failed"` and reason.
  - [x] 3.5 Expose PATCH (accept) and DELETE (reject) handlers on `/api/ai/bulk-preview/[operationId]`.
  - [x] 3.6 When PATCH runs, flip `isDraft` to false and persist; when DELETE runs, remove draft rows.

- [ ] 4.0 Create timeline preview & diff list UI with accept/reject controls, delete or re-add when operation is rejected
  - [x] 4.1 Display draft tasks with `border-dashed` and reduced opacity; draft dependencies with dashed arrows.
  - [x] 4.2 Build diff list overlay (OperationDiffPanel) listing each operation with status icon and Accept ✓ / Reject ✗ buttons.
  - [x] 4.3 Add "Accept All" and "Reject All" bulk action buttons.
  - [x] 4.4 Hook Accept/Reject buttons to PATCH/DELETE endpoints; update timeline in real time.
  - [x] 4.5 Show red "!" icon and tooltip for failed operations.

