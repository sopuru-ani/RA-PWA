# Resident Change Requests & Admin/AD Editing

Session documentation for resident management: editable residents at Admin and GA/AD levels, approval workflow, room moves, and confirmation dialogs.

**Cursor chat:** [Resident editing & change requests](38953a2b-cb91-498a-b208-ab431ed87fa1)

---

## How to reopen this chat later

1. **In Cursor** — Open Chat history and search for topics like *resident change*, *ResidentChangeRequest*, *move resident*, or *ConfirmActionDialog*. This session’s transcript ID is `38953a2b-cb91-498a-b208-ab431ed87fa1`.
2. **From the repo** — Read this file under `_cursor-ai/` and `@`-mention it in a new chat to restore context.
3. **Transcript file (local)** — Full message log (if present on your machine):

   ```
   ~/.cursor/projects/home-sopuru-Code-next-ra/agent-transcripts/38953a2b-cb91-498a-b208-ab431ed87fa1/38953a2b-cb91-498a-b208-ab431ed87fa1.jsonl
   ```

4. **Related prior work** — Bulk import and batch approval are documented separately: `_cursor-ai/bulk-import-and-batch-approval.md`.

---

## Session flow

| Phase | What happened |
|-------|----------------|
| 1. Architecture review | Mapped existing resident list/detail, GA add-request flow, `ResidentAdditionRequest`, room capacity via `attachVacancyToRooms`. Produced implementation plan (no code). |
| 2. Implementation | User confirmed decisions; built `ResidentChangeRequest`, room validation, admin edit/move/delete, GA update/remove requests, confirmation dialogs. |
| 3. Type fix | `ResidentChangeRequestItem` was missing `notes` (and other fields) — real TS error, aligned with Mongoose/API shape. |

---

## Product decisions (confirmed)

| Topic | Decision |
|-------|----------|
| Pending vacancy | Yes — pending `add`/`update` placements that target a room **reserve** capacity |
| Email / student ID updates | Allowed via GA request + admin approval (rare) |
| Placement changes | **Admin only** via Move; PATCH rejects `community`/`section`/`room` |
| Removal | Hard delete (`findByIdAndDelete`) |
| Model name | `ResidentChangeRequest` (Mongo collection name kept as `residentadditionrequests` for existing data) |
| Confirmations | AlertDialog on all new destructive/submit actions |

---

## Permissions summary

### Admin

- Edit resident profile fields globally (`PATCH /api/admin/residents/:id`)
- Move residents across rooms/communities (`POST /api/admin/residents/:id/move`)
- Remove residents immediately (`DELETE /api/admin/residents/:id`)
- Approve/reject all change request types (`POST /api/admin/resident-requests/:id/approve|reject`)

### GA / AD (internal role `GA`, UI label “Area Director”)

- Submit **add** requests (existing flow)
- Submit **update** requests for in-community residents only
- Submit **remove** requests (admin must approve before delete)
- Cannot PATCH residents, move, or bypass approval

---

## Data model

### `ResidentChangeRequest` (`server/db/residentChangeRequest.model.ts`)

| Field | Purpose |
|-------|---------|
| `requestType` | `add` \| `update` \| `remove` (default `add` for legacy rows) |
| `residentId` | Required for `update` / `remove` |
| `previousSnapshot` | Audit diff on approve (update/remove) |
| `removalReason` | Optional GA-provided reason for removal requests |
| Profile fields | `fullName`, `firstName`, `lastName`, `email`, `studentId`, `notes`, placement |

Mongoose model: `ResidentChangeRequest`  
Physical collection: **`residentadditionrequests`** (unchanged for zero-migration)

### Room capacity

- `Room.capacity` supports values &gt; 1
- Occupancy is **derived** (resident count + pending reservations)
- `server/src/services/housing/room-assignment.service.ts`:
  - `resolveRoomPlacement` — room must exist in hierarchy
  - `countRoomOccupancy` — residents + pending add/update targeting room
  - `assertRoomHasVacancy` — used on GA add, admin approve add, admin move
  - `listRoomsWithVacancy` — admin room picker includes pending reservations

---

## API endpoints

### Admin

```
GET    /api/admin/residents
GET    /api/admin/residents/:id
PATCH  /api/admin/residents/:id          # profile only; no placement
DELETE /api/admin/residents/:id          # hard delete
POST   /api/admin/residents/:id/move     # { community, section, room }

GET    /api/admin/resident-requests
GET    /api/admin/resident-requests/:id
POST   /api/admin/resident-requests/:id/approve
POST   /api/admin/resident-requests/:id/reject
```

### GA / AD

```
GET  /api/ga/residents
GET  /api/ga/residents/:id
POST /api/ga/resident-requests           # add | update | remove (see body)
POST /api/ga/resident-requests/bulk      # add only
GET  /api/ga/resident-requests
```

**GA update body example:**

```json
{
  "requestType": "update",
  "residentId": "...",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "studentId": "12345",
  "notes": "optional"
}
```

**GA remove body example:**

```json
{
  "requestType": "remove",
  "residentId": "...",
  "removalReason": "optional"
}
```

---

## Services

| File | Role |
|------|------|
| `server/src/services/housing/resident-change-requests.service.ts` | Create/list/approve/reject; `requestType` dispatch |
| `server/src/services/housing/residents.service.ts` | `updateResidentAdmin`, `deleteResidentAdmin`, `moveResidentAdmin` |
| `server/src/services/housing/room-assignment.service.ts` | Room existence + vacancy with pending reservations |

**Removed:** `residentAdditionRequest.model.ts`, `resident-requests.service.ts`

---

## UI

### New shared components

| Component | Path |
|-----------|------|
| `ConfirmActionDialog` | `components/housing/ConfirmActionDialog.tsx` |
| `ResidentProfileForm` | `components/housing/ResidentProfileForm.tsx` |
| `ResidentMoveForm` | `components/housing/ResidentMoveForm.tsx` |

### Pages updated

| Page | Changes |
|------|---------|
| `/admin/residents/[id]` | Edit (confirm), move (confirm), remove (confirm) |
| `/admin/resident-requests` | Add/Update/Removal badges, diff view, approve/reject confirms |
| `/ga/dashboard/residents/[id]` | Request update/remove (confirm); blocks if pending change exists |
| `/ga/dashboard/residents/add` | Submit confirm dialog |
| `/ga/dashboard/residents/requests` | Request type badges |

Confirmation pattern matches existing `AlertDialog` usage (`app/admin/staff/[id]`, `DeleteIncidentPopUp`, community delete).

---

## TypeScript types

| Type | File |
|------|------|
| `ResidentChangeRequestItem` | `types/admin.ts` — must include `notes?`, `firstName`, `lastName`, etc. |
| `ResidentRequestListItem` | `types/ga.ts` — aligned with API lean documents |
| `ResidentWithStaff` | `types/admin.ts` — added `firstName`, `lastName` |

**Bug fixed this session:** `ResidentChangeRequestItem` omitted `notes`, causing `Property 'notes' does not exist` in `app/admin/resident-requests/page.tsx` when diffing `prev.notes !== r.notes`.

---

## Files changed (core)

### Backend

- `server/db/residentChangeRequest.model.ts` (new)
- `server/db/residentAdditionRequest.model.ts` (deleted)
- `server/src/lib/models.ts`
- `server/src/services/housing/resident-change-requests.service.ts` (new)
- `server/src/services/housing/resident-requests.service.ts` (deleted)
- `server/src/services/housing/residents.service.ts`
- `server/src/services/housing/room-assignment.service.ts` (new)
- `server/src/controllers/admin/residents.controller.ts`
- `server/src/controllers/admin/resident-requests.controller.ts`
- `server/src/controllers/ga/residents.controller.ts`
- `server/src/controllers/admin/structure-management.controller.ts`
- `server/src/routes/admin.routes.ts`
- `server/src/services/admin/structure-management.service.ts`
- `server/src/services/housing/community.service.ts`
- `server/src/controllers/admin/dashboard.controller.ts`
- `server/src/controllers/ga/dashboard.controller.ts`

### Frontend

- `components/housing/ConfirmActionDialog.tsx`
- `components/housing/ResidentProfileForm.tsx`
- `components/housing/ResidentMoveForm.tsx`
- `app/admin/residents/[id]/page.tsx`
- `app/admin/resident-requests/page.tsx`
- `app/ga/dashboard/residents/[id]/page.tsx`
- `app/ga/dashboard/residents/add/page.tsx`
- `app/ga/dashboard/residents/requests/page.tsx`
- `types/admin.ts`
- `types/ga.ts`

---

## Manual test checklist

1. **GA add** — Submit with confirm → pending request; room at capacity blocks submit.
2. **Admin approve add** — Resident created; vacancy decreases.
3. **GA request update** — Confirm → pending; admin queue shows diff (name, email, notes).
4. **Admin approve update** — Resident fields updated; placement unchanged.
5. **GA request removal** — Confirm → pending; resident still exists until approved.
6. **Admin approve removal** — Resident hard-deleted.
7. **Admin edit** — PATCH profile only; confirm dialog.
8. **Admin move** — Cross-community/room with vacancy check; confirm dialog.
9. **Admin delete** — Immediate hard delete; confirm dialog.
10. **Pending block** — GA cannot open second update/remove while one is pending for same resident.

---

## Known gaps / follow-ups

- **Admin bulk seed** (`POST /api/admin/seed-residents`) still bypasses approval and does not enforce room capacity — intentional break-glass; can align with `assertRoomHasVacancy` later.
- **Batch approve/reject** for bulk uploads — see `_cursor-ai/bulk-import-and-batch-approval.md` (may be same or later session).
- **Audit log collection** — `previousSnapshot` on requests only; no separate `ResidentChangeLog` for admin direct edits.

---

## Related documentation

- [_cursor-ai/bulk-import-and-batch-approval.md](./bulk-import-and-batch-approval.md) — shared import UI + batch approval on admin queue
- [_cursor-ai/README.md](./README.md) — index of all Cursor session docs
