# Bulk Resident Import & Batch Approval

Changes made to unify resident import parsing across Admin and GA/AD flows, and to add batch approve/reject for bulk upload review.

**Cursor chat:** [Bulk import & batch approval](0abf59a0-e5ee-497e-af7f-18b420914b92)

## Background

- **Admin bulk import** (`/admin/add-multiple-residents`) previously inlined its own parsing logic with a large header-alias map.
- **GA/AD bulk import** (`/ga/dashboard/residents/bulk`) used a shared component but a thinner alias map in `lib/resident-import.ts`.
- GA/AD bulk uploads create **pending** `ResidentChangeRequest` records (not live residents). Admin must approve each request individually — batch grouping existed in data (`batchId`) but not in the review UI.

## Part 1 — Shared Import Architecture

### `lib/resident-import.ts`

Single source of truth for spreadsheet parsing:

- Full `FIELD_ALIASES` set (Admin’s ~55 header variants: `Surname`, `Room Number`, `Floor`, `Hall`, etc.)
- `parseResidentRows()`, `worksheetToRaw()`, `normalizeHeader()`, `mapHeaders()`
- New diagnostics:
  - `getRequiredFields(lockedCommunity?)`
  - `getUnmappedHeaders(headers)`
  - `getMissingRequiredColumns(headers, lockedCommunity?)`

### `components/housing/ResidentBulkImport.tsx`

Shared 3-step UI (dropzone → worksheet picker → editable preview table):

| Prop | Purpose |
|------|---------|
| `lockedCommunity` | GA/AD: auto-fill community, hide column |
| `submitPath` | API endpoint |
| `submitButtonLabel` | e.g. "Submit for approval" / "Push" |
| `variant` | `"default"` (GA) or `"polished"` (Admin) |
| `showAuthGate` | Admin-only auth check on dropzone |
| `successMessage` | Custom result formatting |

Features added:

- Banners for unrecognized required columns and ignored unmapped columns
- Partial server failure reporting (`failed[]` / `errors[]` with row detail)
- Polished variant: valid/error counts, required `*`, row highlighting, richer dropzone/picker

### Page wrappers

| Page | Component usage |
|------|-----------------|
| `app/ga/dashboard/residents/bulk/page.tsx` | `variant="default"`, submits to `api/ga/resident-requests/bulk` |
| `app/admin/add-multiple-residents/page.tsx` | `variant="polished"`, `showAuthGate`, submits to `api/admin/seed-residents` |
| `app/dev/bulkimport/page.tsx` | Same as Admin (dev shortcut, no auth gate) |

### Approval flow (unchanged)

GA/AD bulk submit → `createBulkResidentRequests` → one pending request per row + shared `batchId` → admin reviews → `approveResidentChangeRequest` creates the resident.

---

## Part 2 — Batch Approve / Reject

### Problem

A 50-row bulk upload produced 50 separate cards on `/admin/resident-requests`, each requiring its own Approve click. `batchId` was stored and shown as a hint but not actionable.

### Server

**`server/src/services/housing/resident-change-requests.service.ts`**

- `approveBatchResidentChangeRequests(batchId, reviewerId)`
  - Finds all `pending` requests for the batch (sorted by `batchRowIndex`)
  - Approves each via existing `approveResidentChangeRequest`
  - Returns `{ approved, failed: [{ requestId, fullName, message }] }` — partial success supported (e.g. duplicate email on row 12 does not block rows 1–11)
- `rejectBatchResidentChangeRequests(batchId, reviewerId, reason?)`
  - Rejects all pending requests in the batch
  - Returns `{ rejected }`

**`server/src/controllers/admin/resident-requests.controller.ts`**

- `approveBatch` / `rejectBatch` handlers

**`server/src/routes/admin.routes.ts`**

```
POST /api/admin/resident-requests/batches/:batchId/approve
POST /api/admin/resident-requests/batches/:batchId/reject
```

Registered **before** `/:id` routes to avoid path conflicts.

### Admin UI

**`app/admin/resident-requests/page.tsx`**

- Groups pending items by `batchId`; non-batch items (single adds, updates, removals) render as standalone cards
- **Batch group card** shows:
  - Community, resident count, submitter, batch id prefix
  - **Approve batch** / **Reject batch** (with optional rejection reason)
  - Collapsible per-resident list for individual approve/reject when needed
- Batch approve surfaces partial failures in notifications (same pattern as bulk import)
- Pending list limit raised from 50 → 100

### API response shapes

**Approve batch (200)**

```json
{
  "msg": "Batch approval processed",
  "approved": 48,
  "failed": [
    { "requestId": "...", "fullName": "Jane Doe", "message": "Cannot approve: duplicate email..." }
  ]
}
```

**Reject batch (200)**

```json
{
  "msg": "Batch rejected",
  "rejected": 50
}
```

---

## Files changed (batch feature)

| File | Change |
|------|--------|
| `server/src/services/housing/resident-change-requests.service.ts` | Batch approve/reject functions |
| `server/src/controllers/admin/resident-requests.controller.ts` | Batch handlers |
| `server/src/routes/admin.routes.ts` | Batch routes |
| `app/admin/resident-requests/page.tsx` | Batch grouping UI |

## Manual test checklist

1. GA bulk upload 3+ residents → Admin requests page shows one **Bulk upload** group
2. **Approve batch** → all residents created; group disappears
3. Bulk upload with one duplicate email → batch approve reports partial success; failed row stays pending
4. **Reject batch** with reason → all requests rejected; GA sees rejected status
5. Expand batch → individual Approve/Reject still works for edge cases
6. Single add/update/remove requests (no `batchId`) still appear as standalone cards

## Future improvements (not implemented)

- Batch approve/reject from a dedicated batch detail view
- Pagination that keeps batch groups intact when >100 pending
- Bulk approve progress indicator for large batches
