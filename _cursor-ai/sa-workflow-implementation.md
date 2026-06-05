# SA Workflow Implementation

Session documentation for the **Student Assistant (SA)** role: codebase analysis, GA→admin approval review, implementation planning, and full SA feature delivery.

---

## Session flow

| Phase | What happened |
|-------|----------------|
| 1. Codebase overview | Mapped Domus architecture: Next.js frontend, Express API, MongoDB models, roles (RA, GA/AD, Admin, SA placeholder), auth, and migration state (`app/api/*` vs `server/src/*`). |
| 2. Admin approval audit | Confirmed the only GA workflow requiring admin approval today is **resident addition requests** — fully wired at `/admin/resident-requests` (API + UI). |
| 3. SA implementation plan | Produced a detailed plan (no code): pages, permissions, incident integration, phases, edge cases. User reviewed and confirmed five decisions. |
| 4. SA implementation | Built backend permissions, `/api/sa/*` routes, and full SA UI shell (overview, residents, incidents). Tightened resident-request API to GA-only. |

---

## Product decisions (confirmed for SA)

| Topic | Decision |
|-------|----------|
| Incident edit/delete | SA may edit/delete **only their own** incidents; same popup UI as RA |
| Resolved status | SA **can** toggle resolved/unresolved on edit |
| Default landing | `/sa/dashboard` overview |
| Resident list scope | Section/Community toggle like RA; section **Select** when in Section mode; full community in Community mode |
| Resident requests | **Remove SA** from resident-request API (GA only) |

---

## SA role summary

The SA sits under the GA/AD and assists RAs within a **single assigned community** (`user.community[0]`).

### SA can

- View residents in their community (read-only)
- View community overview info (sections, RA assignments on dashboard)
- File incidents in their community
- View, edit, and delete **only incidents they submitted** (including resolved status)

### SA cannot

- Manage residents (add, edit, bulk import, approval requests)
- Conduct inspections or walkthroughs
- Manage or view staff management flows
- Access residents or data outside their assigned community

### UI labeling

- Internal enum remains `GA`; user-facing labels use **AD** / **Area Director** via `lib/role-labels.ts`
- SA displays as **Student Assistant** (`roleLabelLong("SA")`)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js  /sa/*  (layout → SASessionContext → bottom nav)   │
└───────────────────────────┬─────────────────────────────────┘
                            │ apiFetch → /api/sa/*
┌───────────────────────────▼─────────────────────────────────┐
│  Express  sa.routes.ts  (requireAuth + requireRole("SA"))   │
│  ├── dashboard.controller   community + stats               │
│  ├── residents.controller   listResidents / getResident     │
│  └── incidents.controller   workspace + own-incident list   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Shared: incident-permissions.ts                            │
│  Shared: POST/DELETE /api/incidents (all submit roles)      │
│  Shared: listResidents, community-scope, housing services   │
└─────────────────────────────────────────────────────────────┘
```

SA layout follows the **GA pattern** (verify → role check → dashboard bootstrap → context), not the RA monolithic `ResidentsContext` (which bundles inspections/vacancies).

---

## Incident permissions (`server/src/lib/incident-permissions.ts`)

Reusable module for extending RA/GA/SA without duplicating incident logic.

| Role | List filter | Edit / delete |
|------|-------------|---------------|
| RA | `{ community }` | Same community (unchanged) |
| GA | `{ community }` | Same community (unchanged) |
| SA | `{ community, reporterUserId }` | Own incidents only |

Functions:

- `buildIncidentListFilter(user)`
- `assertCanViewIncident(user, incident)`
- `assertCanModifyIncident(user, incident)`
- `assertCanDeleteIncident(user, incident)`

Wired into `server/src/controllers/incidents.controller.ts` for update and delete paths.

**GA visibility:** Unchanged — `GET /api/ga/incidents` returns all community incidents, including those filed by SAs (`reporterRole: "SA"`).

**Schema:** No changes required; `reporterUserId` and `reporterRole` already exist on `Incident`.

---

## API map

### New: `/api/sa/*` (SA only)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/sa/dashboard` | User, community detail, stats |
| `GET` | `/api/sa/residents` | Paginated community residents |
| `GET` | `/api/sa/residents/:id` | Read-only detail (community-scoped) |
| `GET` | `/api/sa/workspace` | Incident form context (rooms, community, **own** incidents) |
| `GET` | `/api/sa/incidents` | Own incidents list (refresh after create/edit) |

### Existing (shared)

| Method | Path | SA usage |
|--------|------|----------|
| `POST` | `/api/incidents` | Create/update (permission-checked) |
| `DELETE` | `/api/incidents` | Delete own only |
| `GET` | `/api/auth/verify` | Layout auth gate |

### Tightened

| Change | Location |
|--------|----------|
| Resident requests **GA only** | `server/src/services/housing/resident-requests.service.ts` |

---

## Frontend map

| Route | Page | Notes |
|-------|------|-------|
| `/sa/dashboard` | Overview | Default landing; stats, quick links, section/RA cards |
| `/sa/dashboard/residents` | Resident list | `ButtonsAndSearchBar` (Section/Community), section Select, search/sort |
| `/sa/dashboard/residents/[id]` | Resident detail | Read-only; AD label on `gaEmail` |
| `/sa/dashboard/incidents` | Incidents | Reuses RA incident popups; own reports only |

### Navigation (`SABottomNav`)

Overview · Residents · Incidents · More (theme, logout)

**Not in nav:** vacancies, inspections, staff, resident management.

### New / updated frontend files

| File | Role |
|------|------|
| `app/sa/layout.tsx` | Auth + session bootstrap |
| `app/sa/dashboard/page.tsx` | Overview (replaced placeholder) |
| `app/sa/dashboard/residents/page.tsx` | Resident list |
| `app/sa/dashboard/residents/[id]/page.tsx` | Resident detail |
| `app/sa/dashboard/incidents/layout.tsx` | Workspace loader |
| `app/sa/dashboard/incidents/page.tsx` | Incident list + CRUD UI |
| `context/SASessionContext.tsx` | Session state |
| `context/SAWorkspaceContext.tsx` | Incident workspace state |
| `components/sa/SAHeader.tsx` | `DashboardHeader` wrapper |
| `components/sa/SABottomNav.tsx` | Bottom navigation |
| `components/sa/SAMore.tsx` | More menu |
| `types/sa.ts` | SA TypeScript types |
| `lib/role-labels.ts` | Added `SA → "Student Assistant"` |

### Reused components

- `components/housing/DashboardHeader`, `ListSkeleton`, `ResidentListItem`
- `components/RA/ButtonsAndSearchBar`, `Empty`
- `components/RA/Incidents/*` (Create, Edit, Delete, DropDown)
- `components/NavItem`, `apiFetch`

---

## Backend files added / changed

### Added

| File |
|------|
| `server/src/lib/incident-permissions.ts` |
| `server/src/routes/sa.routes.ts` |
| `server/src/controllers/sa/dashboard.controller.ts` |
| `server/src/controllers/sa/residents.controller.ts` |
| `server/src/controllers/sa/incidents.controller.ts` |

### Changed

| File | Change |
|------|--------|
| `server/src/routes/index.ts` | Mount `/api/sa` |
| `server/src/controllers/incidents.controller.ts` | Permission asserts on edit/delete |
| `server/src/services/housing/resident-requests.service.ts` | GA-only submitters |

---

## Prior session context: admin approval for GA

Before SA work, the codebase was audited for **GA activities requiring admin approval**:

| Workflow | GA submits | Admin approves |
|----------|------------|----------------|
| Resident add (single/bulk) | Yes | Yes — `/admin/resident-requests` |
| Incidents | No (direct) | N/A |
| Inspections | N/A | N/A |
| Staff / structure | No | N/A |

Admin can also bypass the queue via `POST /api/admin/seed-residents` (bulk import).

---

## Edge cases & notes

| Topic | Behavior |
|-------|----------|
| SA with no `community[0]` | 403 on SA API routes; layout redirects to login |
| Multi-community users | Uses `community[0]` only (same as GA) |
| Legacy incidents without `reporterUserId` | Not visible in SA list; GA/RA unchanged |
| SA without `assignment[]` | Section mode defaults to first community section via Select |
| Resident list loading | Client paginates `GET /api/sa/residents?limit=100` until `nextCursor` is null |
| Extensibility | Inspection routes intentionally omitted from `sa.routes.ts` for future phases |

---

## Test checklist

### Auth & shell

- [ ] SA login redirects to `/sa/dashboard`
- [ ] Non-SA user cannot access `/sa/*` (redirect to login)
- [ ] Header shows community name and SA stats

### Residents

- [ ] List shows only assigned community
- [ ] Section filter narrows to selected section
- [ ] Community toggle shows all community residents
- [ ] Detail page 404 for resident in another community
- [ ] No add/edit/delete resident actions visible

### Incidents

- [ ] SA can create incident in their community
- [ ] SA list shows only own reports
- [ ] SA can edit own incident (including resolved toggle)
- [ ] SA can delete own incident
- [ ] SA cannot edit/delete another user's incident (403 from API)
- [ ] GA `/ga/dashboard/incidents` shows SA-filed incidents in community log

### Resident requests

- [ ] SA `POST /api/ga/resident-requests` returns 403 (if called directly)
- [ ] GA resident requests still work

### Regression

- [ ] RA dashboard, incidents, inspections unchanged
- [ ] GA dashboard, residents, incidents unchanged
- [ ] Admin resident-request approval unchanged

---

## How to continue this work

1. `@`-mention this file in a new Cursor chat.
2. **Possible follow-ups:** role guards on `/ra/*` and `/ga/*` layouts; incident card badge for `reporterRole`; SA section assignment from admin staff form; shared `IncidentWorkspaceLayout` refactor.

---

## Related docs

- [_cursor-ai/resident-change-requests-and-editing.md](./resident-change-requests-and-editing.md) — resident editing (separate session)
- [_cursor-ai/bulk-import-and-batch-approval.md](./bulk-import-and-batch-approval.md) — bulk import + admin queue
