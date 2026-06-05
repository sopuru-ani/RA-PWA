# Admin Residents Add & Bulk — UI Parity with GA/AD

Session documentation for adding **Add** and **Bulk** resident actions to the Admin residents list, matching the GA/AD residents page pattern while preserving Admin’s immediate-create behavior (no approval queue).

---

## Problem

The GA/AD residents page (`/ga/dashboard/residents`) exposed **Add** and **Bulk** buttons in the list header, linking to dedicated sub-pages. The Admin residents page (`/admin/residents`) had no equivalent — bulk import lived only at `/admin/add-multiple-residents` (hidden in the **More** menu), and there was no single-resident add flow in the UI at all.

---

## Product decisions

| Topic | Decision |
|-------|----------|
| Admin add behavior | **Immediate** insert into `Resident` — no approval queue (same as existing `seed-residents`) |
| GA/AD add behavior | Unchanged — submits `ResidentChangeRequest` for Admin approval |
| UI pattern | Match GA/AD: header **Add** / **Bulk** buttons on residents list; sub-pages with back link to list |
| Community filter | When list is filtered (`?community=…`), add/bulk links preserve the filter; bulk import locks community column |
| Legacy bulk URL | `/admin/add-multiple-residents` **redirects** to `/admin/residents/bulk` |
| Nav cleanup | Remove duplicate “Bulk import residents” from Admin **More** menu; dashboard link points to new bulk path |

---

## What was built

### 1. Admin residents list — header actions

**File:** `app/admin/residents/page.tsx`

- Added **Add** and **Bulk** buttons (same layout as `app/ga/dashboard/residents/page.tsx`: primary Add, outline Bulk, `UserPlus` / `Upload` icons).
- Links include `?community=` when the list is community-filtered.

### 2. Add resident page

**Route:** `/admin/residents/add`

**Files:**

- `app/admin/residents/add/page.tsx` — shell with back link, title, community-aware subtitle
- `components/housing/ResidentAddForm.tsx` — reusable form

**Form fields:**

- Community, section, room (rooms loaded from `GET api/admin/communities/:community/rooms`; only rooms with vacancy shown)
- First name, last name, email, student ID, notes
- `ConfirmActionDialog` before submit (“added immediately” copy vs GA’s “submit for approval”)

**On success:** notification + redirect to `/admin/residents/:id`.

**Pre-fill:** `?community=` query param pre-selects community (from filtered list).

### 3. Bulk add page

**Route:** `/admin/residents/bulk`

**File:** `app/admin/residents/bulk/page.tsx`

- Back link to residents list (preserves community filter in href)
- Reuses `components/housing/ResidentBulkImport` (default variant — same as GA bulk, not the old polished standalone page)
- Submits to `POST api/admin/seed-residents`
- Button label: **Add residents**; success message reports `inserted` count
- `lockedCommunity` set when arriving from a filtered list

### 4. Backend — single resident create

**New endpoint:** `POST /api/admin/residents`

| Layer | Change |
|-------|--------|
| Route | `server/src/routes/admin.routes.ts` |
| Controller | `createResident` in `server/src/controllers/admin/residents.controller.ts` |
| Service | `createResidentAdmin` in `server/src/services/housing/residents.service.ts` |

**Validation (mirrors approve-add flow):**

- Required fields: firstName, lastName, email, studentId, community, section, room
- Community exists; section in community (`assertSectionInCommunity`)
- No duplicate email/studentId in residents or pending queue (`findDuplicateFlags`)
- `SectionStaff` record must exist for community/section
- Room must have vacancy (`assertRoomHasVacancy`)
- Returns `201` with `{ msg, resident }` (staff-attached shape via `getResidentById`)

Bulk import unchanged: `POST /api/admin/seed-residents` → `seedResidents` in `admin.controller.ts`.

### 5. Navigation & legacy redirect

| Location | Change |
|----------|--------|
| `app/admin/add-multiple-residents/page.tsx` | Server redirect → `/admin/residents/bulk` |
| `app/admin/dashboard/page.tsx` | Bulk link → `/admin/residents/bulk` |
| `components/admin/AdminNav.tsx` | Removed **More** menu bulk import item (residents page is primary entry) |

---

## Admin vs GA/AD comparison

| | Admin | GA/AD |
|---|--------|--------|
| List buttons | Add, Bulk | Add, Bulk |
| Add route | `/admin/residents/add` | `/ga/dashboard/residents/add` |
| Bulk route | `/admin/residents/bulk` | `/ga/dashboard/residents/bulk` |
| Add API | `POST api/admin/residents` | `POST api/ga/resident-requests` |
| Bulk API | `POST api/admin/seed-residents` | `POST api/ga/resident-requests/bulk` |
| Effect | Immediate `Resident` insert | Pending `ResidentChangeRequest` |
| Community | Admin picks (or pre-filled from filter) | Locked to session community |
| Room picker | Yes (vacancy-filtered) | Text input on GA add form |

---

## Key files created or changed

### Backend

```
server/src/services/housing/residents.service.ts   # createResidentAdmin
server/src/controllers/admin/residents.controller.ts  # createResident handler
server/src/routes/admin.routes.ts                  # POST /residents
```

### Frontend

```
app/admin/residents/page.tsx                       # Add/Bulk header buttons
app/admin/residents/add/page.tsx                   # new
app/admin/residents/bulk/page.tsx                  # new
app/admin/add-multiple-residents/page.tsx          # redirect only
app/admin/dashboard/page.tsx                       # updated bulk link
components/housing/ResidentAddForm.tsx             # new
components/admin/AdminNav.tsx                      # removed More-menu bulk link
```

### Reused (unchanged)

```
components/housing/ResidentBulkImport.tsx
lib/resident-import.ts
hooks/use-community-options.ts
```

---

## Test checklist

### Admin residents list

- [ ] `/admin/residents` shows **Add** and **Bulk** in header
- [ ] With `?community=SomeHall`, buttons link to add/bulk with same query param

### Add single resident

- [ ] `/admin/residents/add` — back link returns to list
- [ ] Community/section/room cascade; only vacant rooms listed
- [ ] Submit creates resident; redirects to detail page
- [ ] Duplicate email/student ID returns error toast
- [ ] Missing SectionStaff or full room returns error toast
- [ ] `?community=` pre-fills community selector

### Bulk add

- [ ] `/admin/residents/bulk` — upload .xlsx, review table, submit
- [ ] Rows inserted immediately via `seed-residents`
- [ ] With `?community=`, community column locked in import
- [ ] `/admin/add-multiple-residents` redirects to bulk page

### Regression

- [ ] GA/AD add/bulk still submit to approval queue (unchanged)
- [ ] Admin resident-requests queue still works
- [ ] Admin layout auth gate still applies (no separate `showAuthGate` on bulk page)

---

## Related docs

- [ga-ad-and-admin-structure.md](./ga-ad-and-admin-structure.md) — original GA/AD residents + bulk import architecture
- [bulk-import-and-batch-approval.md](./bulk-import-and-batch-approval.md) — shared `ResidentBulkImport` component
- [resident-change-requests-and-editing.md](./resident-change-requests-and-editing.md) — admin edit/move/delete; GA approval flow
- [admin-workflow-implementation.md](./admin-workflow-implementation.md) — Admin shell and earlier bulk import page

---

## Intentionally unchanged

- `POST api/admin/seed-residents` implementation (`admin.controller.ts`)
- GA/AD resident request submission and approval queue
- Admin residents list search UI (still uses `InputGroup`; GA uses `ListSearchInput` — not part of this session)
