# Cursor AI session notes

This folder holds documentation written during Cursor agent sessions so work survives beyond a single chat.

## Sessions

| Doc | Topic | Chat |
|-----|-------|------|
| [resident-change-requests-and-editing.md](./resident-change-requests-and-editing.md) | Admin/AD resident editing, `ResidentChangeRequest`, move/delete, confirmations, types | [Resident editing & change requests](38953a2b-cb91-498a-b208-ab431ed87fa1) |
| [bulk-import-and-batch-approval.md](./bulk-import-and-batch-approval.md) | Shared bulk import, batch approve/reject on admin queue | [Bulk import & batch approval](0abf59a0-e5ee-497e-af7f-18b420914b92) |
| [bulk-import-ai-mapping-analysis.md](./bulk-import-ai-mapping-analysis.md) | Bulk import architecture review; Gemini/AI mapping recommendation (analysis only) | — |
| [resident-approve-duplicate-check-fix.md](./resident-approve-duplicate-check-fix.md) | Fix 409 on approve when `findDuplicateFlags` matched the pending request itself | [Resident approve 409 fix](a814d9cf-df17-4d66-a88e-5995d5f87078) |
| [sa-workflow-implementation.md](./sa-workflow-implementation.md) | Codebase overview, GA admin-approval audit, SA role plan + full implementation | — |
| [admin-workflow-implementation.md](./admin-workflow-implementation.md) | Admin role plan + full implementation: API, UI shell, staff CRUD/deactivate, community pickers, AD display labels | — |
| [ga-ad-and-admin-structure.md](./ga-ad-and-admin-structure.md) | GA/AD full workflow, resident approval queue, admin community/section/room CRUD, GA incidents & search fixes | — |

## How to use these docs

1. **Continue work** — Open a new Cursor chat and `@`-mention the relevant `.md` file (e.g. `@_cursor-ai/resident-change-requests-and-editing.md`).
2. **Find the original chat** — In Cursor, open Chat history and search by topic or use the chat link in each doc’s header (format: `[title](uuid)`).
3. **Local transcript** — Agent transcripts (when available):

   ```
   ~/.cursor/projects/home-sopuru-Code-next-ra/agent-transcripts/<chat-uuid>/<chat-uuid>.jsonl
   ```

## Adding new session docs

When an agent completes a substantial feature:

1. Add `<feature-name>.md` under `_cursor-ai/`.
2. Include: decisions, architecture, API/UI map, files changed, test checklist, and a **chat link** with the session UUID.
3. Add a row to the table above.
