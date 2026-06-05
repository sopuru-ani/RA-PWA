# Admin Workflow Implementation

Session documentation for the **Domus** (`next-ra`) **Administrator** role: codebase analysis, implementation planning, phased delivery of the admin shell and core workflows, staff management hardening, and user-facing **AD / Area Director** terminology (internal `GA` unchanged).

---

## Session flow

| Phase | What happened |
|-------|----------------|
| 1. Codebase overview | Mapped Domus: Next.js 16 PWA + Express API on port 4000, shared Mongoose models in `server/db/`, JWT auth, RA dashboard as the mature product surface, thin admin placeholder, dual API layer (`app/api/*` legacy + Express primary). |
| 2. Admin implementation plan | Produced a detailed plan: screens, API structure, schema recommendations, permissions, navigation, pagination, reusable RA patterns, phases, edge cases. User approved proceeding with implementation. |
| 3. Phase 0–2 implementation | Built secured admin API, admin UI shell (RA-style layout), overview, staff/communities/residents/structure pages, `CommunityStaff` model, staff invite/list/detail. |
| 4. Staff hardening | Added deactivate/reactivate flow, `User.isActive`, community/section pickers from DB, shared `StaffForm`, revoke invite vs deactivate account. |
| 5. Terminology alignment | User clarified: internal `GA` stays; UI shows **AD** / **Area Director**. Added `lib/role-labels.ts` and wired display labels incrementally—no internal enum rename. |

---

## Role hierarchy (product context)

| Role | Internal value | User-facing | Scope |
|------|----------------|-------------|-------|
| Admin | `Admin` | Administrator | All communities; staff + residents oversight |
| Area Director | `GA` | **AD** / **Area Director** | One community; oversees RAs |
| Resident Assistant | `RA` | RA / Resident Assistant | One section within a community |
| Student Assistant | `SA` | SA / Student Assistant | Community-level (separate session built SA flow) |

**Important:** Permissions, DB enums, API payloads, and routes continue to use `GA`. Only visible UI copy uses AD / Area Director via `lib/role-labels.ts`.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Next.js  /admin/*  (layout: auth + AdminSessionContext + nav)   │
│  ├── dashboard      overview + quick links                       │
│  ├── staff          list / new / [id] edit                       │
│  ├── communities    list / [community] detail                    │
│  ├── residents      cursor list / [id] detail                    │
│  ├── structure      org tree + gap badges                        │
│  └── add-multiple-residents  (pre-existing bulk import)          │
└────────────────────────────┬─────────────────────────────────────┘
                             │ apiFetch → NEXT_PUBLIC_BASE_URL_LAN
┌────────────────────────────▼─────────────────────────────────────┐
│  Express  /api/admin/*  (requireAuth + requireRole("Admin"))     │
│  ├── dashboard.controller                                        │
│  ├── staff.controller + staff.service + assignment.service       │
│  ├── communities.controller                                      │
│  ├── residents.controller                                        │
│  ├── structure.controller                                        │
│  └── admin.controller (seed-residents only)                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│  MongoDB  server/db/*                                            │
│  User, AuthorizedUser, Community, Resident, SectionStaff,        │
│  CommunityStaff (new), Room, Incident, …                         │
└──────────────────────────────────────────────────────────────────┘
```

**Design choices**

- **Express-only** for new admin endpoints (no duplication in `app/api/admin/*`).
- **No global “load all residents”** in admin layout (unlike RA `ResidentsContext`)—paginated per page.
- **Assignment writes** centralized in `assignment.service.ts` to sync `User`/`AuthorizedUser` with `SectionStaff` and `CommunityStaff`.
- **Incremental UI**—extend existing shadcn/RA patterns; treat user manual edits as source of truth.

---

## Auth & permissions

| Layer | Behavior |
|-------|----------|
| `requireAuth` | JWT from cookie or `Authorization: Bearer` |
| `requireRole("Admin")` | Applied to entire `admin.routes.ts` router |
| `app/admin/layout.tsx` | Client verify `api/auth/verify` + `role === "Admin"` |
| Login redirect | `Admin` → `/admin/dashboard`; `GA` → `/ga/dashboard` (placeholder) |

**Deactivate behavior**

- `User.isActive` (default `true`; missing treated as active)
- Inactive users blocked at login; inactive invites blocked at signup / verify-email
- `DELETE /api/admin/staff/:id` — revokes `AuthorizedUser` invite OR deactivates active `User`
- `PATCH` with `isActive: false` deactivates; `isActive: true` reactivates and re-applies assignments
- Deactivate clears `SectionStaff` rows for RAs and marks `CommunityStaff` inactive for GA/SA

---

## API map (`/api/admin`)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/dashboard` | Admin user + aggregate stats |
| `GET` | `/staff` | Paginated staff list (`role`, `community`, `q`, `cursor`) |
| `POST` | `/staff` | Create staff invite |
| `GET` | `/staff/:id` | Staff detail (user or authorized) |
| `PATCH` | `/staff/:id` | Update assignment / active status |
| `DELETE` | `/staff/:id` | Revoke invite or deactivate account |
| `POST` | `/allowed` | Backward-compatible alias for staff create |
| `GET` | `/communities/options` | Picker data: `{ name, sections }[]` |
| `GET` | `/communities` | Community summaries + staff counts |
| `GET` | `/communities/:community` | Community detail |
| `GET` | `/residents` | Cursor-paginated residents + staff email join |
| `GET` | `/residents/:id` | Resident detail |
| `GET` | `/structure` | Org tree per community + gap flags |
| `POST` | `/seed-residents` | Bulk import (existing; now router-protected) |

---

## Database changes

### New: `CommunityStaff` (`server/db/communityStaff.model.ts`)

Community-level assignments for internal roles `GA` and `SA`:

- `community`, `userId`, `role`, `email`, `isActive`, `notes`
- Unique index on `{ community, userId, role }`

### Extended: `User`

- `isActive: boolean` (default `true`)

### Unchanged (still source of truth for section RAs)

- `SectionStaff` — `{ community, section, raEmail, gaEmail }` per section
- `AuthorizedUser` — pre-signup invites with `isActive`, `community`, `assignment`

### Signup side-effect

On successful signup, `applyStaffAssignments()` runs so RA/GA/SA links are written to `SectionStaff` / `CommunityStaff` when the account is created.

---

## Frontend map

| Route | Purpose |
|-------|---------|
| `/admin/dashboard` | Overview cards, quick actions, staff stat line |
| `/admin/staff` | Search, role filter, load more, invite CTA |
| `/admin/staff/new` | `StaffForm` create mode |
| `/admin/staff/[id]` | `StaffForm` edit + revoke/deactivate confirm |
| `/admin/communities` | Community cards with counts |
| `/admin/communities/[community]` | Sections, linked staff, link to filtered residents |
| `/admin/residents` | Server search + cursor pagination (`?community=` supported) |
| `/admin/residents/[id]` | Read-only detail + Area Director email |
| `/admin/structure` | Nested accordion org view + “needs attention” badges |
| `/ga/dashboard` | Placeholder (“Area Director tools coming soon”) |

### Shared components added

| File | Role |
|------|------|
| `components/housing/DashboardHeader.tsx` | Collapsible header pattern (from RA) |
| `components/housing/ListSkeleton.tsx` | Loading skeleton |
| `components/housing/StaffListItem.tsx` | Accordion staff row |
| `components/housing/ResidentListItem.tsx` | Accordion resident row |
| `components/admin/AdminHeader.tsx` | Admin stats header |
| `components/admin/AdminNav.tsx` | Bottom nav + More menu |
| `components/admin/StaffForm.tsx` | Create/edit staff with community/section selects |
| `context/AdminSessionContext.tsx` | `{ user, stats }` from dashboard bootstrap |
| `hooks/use-community-options.ts` | Loads `/api/admin/communities/options` |
| `lib/role-labels.ts` | **AD / Area Director** display helpers |
| `types/admin.ts` | Shared admin DTO types |

### UI terminology (`lib/role-labels.ts`)

| Function | Use |
|----------|-----|
| `roleLabelShort("GA")` | → `"AD"` (badges, compact stats) |
| `roleLabelLong("GA")` | → `"Area Director"` |
| `roleLabelOption("GA")` | → `"AD — Area Director"` (select labels; value still `GA`) |
| `roleStatLine(stats.staff)` | → e.g. `"12 RA · 3 AD · 2 SA"` |

---

## Backend files (key)

```
server/src/
  middleware/auth.ts              requireRole()
  routes/admin.routes.ts          secured admin router
  controllers/admin/
    dashboard.controller.ts
    staff.controller.ts
    communities.controller.ts
    residents.controller.ts
    structure.controller.ts
  controllers/admin.controller.ts   seed-residents only
  services/admin/
    staff.service.ts
    assignment.service.ts
server/db/
  communityStaff.model.ts         NEW
  user.model.ts                   +isActive
```

---

## Pagination strategy (residents & staff)

- **Cursor-based** `limit` + `cursor` (resident cursor = `_id`; staff cursor = last item `id`)
- Client: “Load more” button (not infinite observer yet)
- Server-side `q` filter on residents (name, email, room, studentId)

---

## Working guidelines established (user request)

1. **User-facing:** AD / Area Director — never “GA” or “Graduate Assistant” in visible UI.
2. **Internal:** Keep `GA` in DB, enums, API, auth redirects, field names (`gaEmail`, etc.).
3. **Process:** Do not blindly refactor; preserve manual UI edits; extend incrementally; no large-scale renames unless explicitly requested.

---

## Test checklist

- [ ] Log in as Admin → lands on `/admin/dashboard` with stats
- [ ] Non-admin cannot access `/api/admin/*` (403)
- [ ] Invite RA with community + section from picker → appears in staff list as pending
- [ ] Invited user signs up → `SectionStaff` updated; RA can use dashboard
- [ ] Edit staff assignment on `/admin/staff/[id]` → PATCH succeeds; structure view reflects change
- [ ] Revoke pending invite → removed from list
- [ ] Deactivate active user → cannot log in; section assignment cleared
- [ ] Reactivate via PATCH `isActive: true` → can log in; assignments restored
- [ ] Residents list paginates; community filter via `?community=` works
- [ ] Structure page shows “Missing RA” / “No Area Director” gaps
- [ ] All role badges and dropdowns show **AD**, not GA
- [ ] Bulk import at `/admin/add-multiple-residents` still works under admin shell

---

## Known limitations / follow-ups

| Item | Notes |
|------|-------|
| Active user hard delete | Not implemented; DELETE deactivates instead |
| `CommunityStaff` on GA invite only | Synced on signup + PATCH for existing users; pending GA invites rely on `AuthorizedUser` until signup |
| GA/AD dedicated dashboard | `/ga/dashboard` is placeholder only |
| Duplicate Next `app/api/admin/*` | Legacy routes may still exist; new work targets Express |
| Residents page community filter UI | API supports `?community=`; dropdown in UI not added this session |
| Admin incident/inspection oversight | Out of scope |

---

## Running locally

```bash
# Terminal 1 — Express API (port 4000)
cd server && npm run dev

# Terminal 2 — Next.js
npm run dev
# Requires NEXT_PUBLIC_BASE_URL_LAN=http://localhost:4000/
```

---

## Related docs

- [sa-workflow-implementation.md](./sa-workflow-implementation.md) — SA role (parallel staff-role expansion)
- [bulk-import-and-batch-approval.md](./bulk-import-and-batch-approval.md) — Admin bulk resident import
- [resident-change-requests-and-editing.md](./resident-change-requests-and-editing.md) — AD resident editing / change requests (separate session)
