# GA/AD Workflow, Admin Structure Management & GA Fixes

Session documentation for the **Area Director (GA/AD)** feature build, **Admin community structure CRUD**, and follow-up **GA incidents/search** fixes.

---

## Session flow

| Phase | What happened |
|-------|----------------|
| 1. Codebase analysis | Mapped Domus architecture (Next.js + Express + MongoDB), Admin vs RA patterns, role model, and gaps (GA placeholder, no resident approval, denormalized `Community` → `section[]` → `Room` hierarchy). |
| 2. GA/AD implementation plan | Produced a detailed plan: pages, `api/ga/*`, resident approval workflow, inspections with per-section conduct, incidents, permissions, phases. User reviewed before build. |
| 3. Bulk import clarification | Confirmed `app/admin/add-multiple-residents/page.tsx` does **not** need to move — shared component extraction instead. |
| 4. GA/AD implementation | Full backend + frontend for AD shell, oversight, resident requests, inspections, incidents. |
| 5. Admin structure plan | Designed community/section/room CRUD integrated with existing denormalized model; user confirmed five policy decisions. |
| 6. Admin structure implementation | `structure-management.service`, Admin API routes, community hub UI (Overview / Sections / Rooms). |
| 7. GA bug fixes | Fixed incidents crash (`CreateIncidentPopUp` empty rooms/assignment) and search UX (debounce, no full-page skeleton reload, Admin-style search input). |

---

## Product decisions

### GA/AD (from plan review)

| Topic | Decision |
|-------|----------|
| Multi-community GA | v1 uses `community[0]` only |
| Resident adds | GA submits → **Admin approves** before `Resident` insert |
| Admin direct import | Unchanged — `POST api/admin/seed-residents` still immediate |
| AD UI labels | Internal `GA`; user-facing **AD** / **Area Director** via `lib/role-labels.ts` |
| Inspections | AD views all sections; conducts per **selected section** |

### Admin structure (from plan review)

| Topic | Decision |
|-------|----------|
| Community delete | Allowed when **no residents**; auto-removes rooms, `SectionStaff`, `CommunityStaff`, roomchecks, incidents, pending requests; strips community from users/invites |
| Section delete | **Block** until all **rooms** removed (explicit cleanup); also blocks if residents, `SectionStaff`, or pending requests exist |
| Section rename | **Auto-cascade** to residents, incidents, roomchecks, rooms, `SectionStaff`, pending requests, RA `assignment[]` |
| Bulk rooms | **v1** included |
| URL stability | Community rename acceptable (URLs use community name) |

---

## 1. GA / Area Director (`GA` → UI: AD)

### Role scope

- Primary community: `user.community[0]`
- Read-only staff (RA, SA, GA in community)
- Residents: list + single/bulk **add requests** (admin approval)
- Incidents: view community-wide; create/edit/delete (community-scoped)
- Inspections: view walkthroughs across sections; conduct per section via `?section=`

### Backend — `api/ga/*`

Router: `server/src/routes/ga.routes.ts` (`requireAuth` + `requireRole("GA")`).

| Area | Endpoints |
|------|-----------|
| Dashboard | `GET /dashboard`, `GET /community` |
| Staff | `GET /staff`, `GET /staff/:id` (read-only) |
| Residents | `GET /residents`, `GET /residents/:id` |
| Resident requests | `POST /resident-requests`, `POST /resident-requests/bulk`, `GET /resident-requests` |
| Inspections | `GET /inspections/walkthroughs`, `POST /inspections/session`, `room-check`, `walkthrough`, `all-checked` (body includes `section`) |
| Incidents workspace | `GET /workspace`, `GET /incidents` |

Shared services:

- `server/src/services/housing/residents.service.ts`
- `server/src/services/housing/resident-requests.service.ts`
- `server/src/services/housing/inspections.service.ts`
- `server/src/services/housing/community.service.ts`
- `server/src/lib/community-scope.ts`

### Schema — `ResidentAdditionRequest`

File: `server/db/residentAdditionRequest.model.ts`

- Status: `pending` | `approved` | `rejected`
- Submitter: GA (extensible to SA later in schema enum)
- Bulk: shared `batchId` + `batchRowIndex`
- Approve promotes to `Resident` (requires `SectionStaff` for section)

### Admin approval queue

| Endpoint | Purpose |
|----------|---------|
| `GET /api/admin/resident-requests` | List pending (filterable) |
| `POST .../:id/approve` | Insert resident |
| `POST .../:id/reject` | Reject with optional reason |

UI: `/admin/resident-requests` — linked from Admin nav, dashboard, header stat `pendingResidentRequests`.

### Incidents (shared controller)

- `api/incidents` uses `requireAuth`
- `canSubmitIncident()` allows `RA`, `GA`, `SA`
- Optional `reporterUserId`, `reporterRole` on `Incident` model
- Community-scoped delete guard

### Frontend — `/ga/*`

| Piece | Path / file |
|-------|-------------|
| Layout + auth | `app/ga/layout.tsx` |
| Session context | `context/GASessionContext.tsx` |
| Workspace (incidents) | `context/GAWorkspaceContext.tsx`, `app/ga/dashboard/incidents/layout.tsx` |
| Header / nav | `components/ga/GAHeader.tsx`, `GABottomNav.tsx`, `GAMore.tsx` |
| Pages | `dashboard`, `staff`, `residents` (+ add, bulk, requests), `inspections`, `incidents` |
| Inspection session | `app/ga/inspectionSession/page.tsx` (section in query + GA API paths) |

Login/signup redirect GA → `/ga/dashboard`.

### Reuse (no admin file moves)

- `components/housing/ResidentBulkImport.tsx` + `lib/resident-import.ts` — GA bulk uses approval endpoint; admin bulk page unchanged
- `StaffListItem` / `ResidentListItem` — optional `detailHref` / `href`
- `Walkthroughs` — optional `walkthroughPath` + `section` for GA
- RA incident popups reused on GA incidents page

---

## 2. Admin community structure management

### Model (unchanged shape, added constraints)

| Entity | Notes |
|--------|--------|
| `Community` | `community` (unique) + `section: string[]` + `updatedAt` |
| `Room` | `community`, `section`, `room`, `capacity` + **unique index** `(community, section, room)` |
| Sections | Still embedded in `Community.section` (no separate collection in v1) |

### Service

`server/src/services/admin/structure-management.service.ts` — single mutation layer:

- `createCommunity`, `renameCommunity`, `deleteCommunity`
- `addSection`, `renameSection`, `removeSection`
- `createRoom`, `createRoomsBulk`, `updateRoom`, `deleteRoom`, `listRooms`
- `getSectionSummaries`
- Cascades on rename; delete guards per user decisions

### Admin API

Under `api/admin/communities` (Admin-only):

| Method | Path |
|--------|------|
| `POST` | `/communities` |
| `PATCH` | `/communities/:community` (rename) |
| `DELETE` | `/communities/:community` |
| `POST` | `/communities/:community/sections` |
| `PATCH` | `/communities/:community/sections/:section` |
| `DELETE` | `/communities/:community/sections/:section` |
| `GET` | `/communities/:community/rooms` |
| `POST` | `/communities/:community/rooms` |
| `POST` | `/communities/:community/rooms/bulk` |
| `PATCH` | `/communities/:community/rooms/:roomId` |
| `DELETE` | `/communities/:community/rooms/:roomId` |

Extended `GET /communities/:community` with `roomCount`, `sectionSummaries`.

`/admin/structure` remains **read-only** org/gaps view.

### Admin UI

| Route | Purpose |
|-------|---------|
| `/admin/communities` | List + **New** button |
| `/admin/communities/new` | Create community + optional sections |
| `/admin/communities/[community]` | Hub tabs: **Overview \| Sections \| Rooms** (rename/delete community, section CRUD, room single + bulk) |

Types: `CommunityDetail`, `SectionSummary` in `types/admin.ts`.

### Integration with staff & residents

- `useCommunityOptions()` / `StaffForm` pick up new communities/sections automatically
- Resident approval still requires `SectionStaff` before approve
- GA `assertSectionInCommunity` uses `Community.section`
- Room/vacancy/inspection flows depend on `Room` rows existing per section

---

## 3. GA bug fixes (end of session)

### Incidents crash

**Cause:** `CreateIncidentPopUp` assumed `user.assignment[0]` and `filteredRooms[0]` — empty for AD.

**Fix:** `components/RA/Incidents/CreateIncidentPopUp.tsx`, `EditIncidentPopUp.tsx`

- Default section from `assignment[0]` → `communityInfo[0].section[0]`
- Room state syncs via `useEffect`; safe when no rooms
- Optional `room` on submit; guarded `communityInfo[0]?.section`

### Search “reload”

**Cause:** GA staff/residents pages set `loading=true` on every `q` change and returned full `ListSkeleton`.

**Fix:** `app/ga/dashboard/staff/page.tsx`, `app/ga/dashboard/residents/page.tsx`

- 300ms debounced search query
- Skeleton only on **initial** load; inline “Loading…” on refetch
- New `components/housing/ListSearchInput.tsx` (search icon + clear **X**, matches Admin)

---

## Key files created or materially changed

### Backend

```
server/db/residentAdditionRequest.model.ts
server/db/room.model.ts                    # unique compound index
server/db/community.models.ts              # updatedAt
server/db/incident.model.ts                # reporterUserId, reporterRole
server/src/lib/community-scope.ts
server/src/services/housing/*.ts
server/src/services/admin/structure-management.service.ts
server/src/controllers/ga/*
server/src/controllers/admin/structure-management.controller.ts
server/src/controllers/admin/resident-requests.controller.ts
server/src/routes/ga.routes.ts
server/src/routes/admin.routes.ts
server/src/routes/index.ts
server/src/controllers/incidents.controller.ts
server/src/middleware/errorHandler.ts      # statusCode from scope errors
```

### Frontend

```
app/ga/layout.tsx
app/ga/dashboard/**/*
app/ga/inspectionSession/**
context/GASessionContext.tsx
context/GAWorkspaceContext.tsx
components/ga/*
components/housing/ResidentBulkImport.tsx
components/housing/ListSearchInput.tsx
lib/resident-import.ts
types/ga.ts
types/admin.ts                             # extended
app/admin/resident-requests/page.tsx
app/admin/communities/new/page.tsx
app/admin/communities/[community]/page.tsx # hub tabs
app/admin/communities/page.tsx
components/RA/Incidents/CreateIncidentPopUp.tsx
components/RA/Incidents/EditIncidentPopUp.tsx
components/RA/Inspections/Walkthroughs.tsx
components/housing/StaffListItem.tsx
components/housing/ResidentListItem.tsx
components/admin/AdminHeader.tsx
components/admin/AdminNav.tsx
```

---

## Test checklist

### GA / AD

- [ ] Login as GA → `/ga/dashboard` with community stats
- [ ] Staff list + detail (read-only)
- [ ] Residents list; single + bulk submit → pending
- [ ] My requests shows status
- [ ] Admin approves/rejects at `/admin/resident-requests`
- [ ] Incidents: create (section + room or location), list, edit, delete
- [ ] Inspections: view walkthroughs; new session per section; complete session
- [ ] Logout from More menu

### Admin structure

- [ ] Create community at `/admin/communities/new`
- [ ] Add/rename/delete section (delete blocked if rooms remain)
- [ ] Add single room + bulk rooms
- [ ] Delete vacant room; block delete if resident assigned
- [ ] Rename community → URLs/data consistent
- [ ] Delete community with zero residents → rooms/staff removed

### GA fixes

- [ ] Incidents page loads without crash for AD with no assignment
- [ ] Staff/residents search: no full-page flash; debounced; clear **X** works

---

## Intentionally unchanged

- RA dashboard and `api/ra/*` behavior (except shared incident popups hardened for GA)
- Admin `seed-residents` direct import (no approval)
- `/admin/structure` org chart (read-only)
- Legacy `app/api/*` route handlers (not removed)
- SA dashboard (separate session may exist — see `sa-workflow-implementation.md`)

---

## Related docs

- [sa-workflow-implementation.md](./sa-workflow-implementation.md) — SA role (may overlap incident permissions)
- [bulk-import-and-batch-approval.md](./bulk-import-and-batch-approval.md) — if batch approve was added in a later session
- [admin-workflow-implementation.md](./admin-workflow-implementation.md) — earlier Admin console work

---

## Environment

- Frontend: `npm run dev` — set `NEXT_PUBLIC_BASE_URL_LAN` to Express API
- API: `cd server && npm run dev`
- Server typecheck: `cd server && npm run typecheck`
- **Note:** New `Room` unique index may fail if duplicate `(community, section, room)` rows already exist in MongoDB — dedupe before deploy.
