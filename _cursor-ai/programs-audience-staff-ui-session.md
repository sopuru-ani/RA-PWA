# Programs — Audience, Staff Data, Permissions & UI Session

Summary of work completed in this chat session: calendar fixes, program audience wiring, staff picker / DB reconciliation, open invitation permissions, and form UI polish.

**Chat:** [Programs audience & staff UI](68ca658c-7fda-4937-91f3-e05357467d76)

---

## Problems addressed

1. **Calendar** — Selected date showed the previous day in Events; desktop showed a black overlay when clicking dates.
2. **Program audience** — “Selected users” and other audience types were incomplete or broken; staff picker showed wrong/missing people.
3. **Staff data** — Legacy `SectionStaff` emails, missing `isActive` on older accounts, stale `AuthorizedUser` invites, and placeholder `akbonsu@umes.edu` GA email.
4. **Permissions** — Non-admin roles were scoped to their own community and could not use dept-wide or invite across communities.
5. **UI** — Program create/edit form had too many nested borders and boxes.

---

## Calendar fixes

| Change | File |
|--------|------|
| Parse `YYYY-MM-DD` as **local calendar date** (fixes off-by-one) | `lib/formatters.ts` |
| Open day-events **sheet on mobile only**; desktop uses sidebar without overlay | `components/programs/ProgramsCalendar.tsx` |
| Remount list content when date changes | `components/programs/ProgramsDayEventsSheet.tsx` |

---

## Program audience (all six types)

### Backend

| File | Purpose |
|------|---------|
| `server/src/services/programs/community-staff-resolver.service.ts` | Resolves staff from `SectionStaff`, `CommunityStaff`, and `User.community`; case-insensitive email join |
| `server/src/services/programs/audience-candidates.service.ts` | `listAudienceCandidates` for the staff picker API |
| `server/src/services/programs/audience-resolver.service.ts` | Resolves published program audience → user IDs |
| `server/src/routes/programs.routes.ts` | `GET /api/programs/audience-candidates` registered **before** `/:id` |

### Frontend

| File | Purpose |
|------|---------|
| `components/programs/ProgramAudienceFields.tsx` | Conditional UI per audience type (search, checkboxes, role toggles) |
| `components/programs/ProgramForm.tsx` | Full payload, validation, edit pre-fill, scope controls |
| `lib/programs-api.ts` | `fetchAudienceCandidates` |

### Audience types supported

- `all_staff`
- `all_ras`
- `all_gas`
- `selected_users`
- `selected_communities`
- `community_staff`

---

## Staff picker bug — root cause & fix

**Symptom:** Admin dept-wide list showed ~4 people (missing RAs); SRC GA saw GA + SA but not reassigned RA (Valentino Conteh).

**Cause:** Picker used `isActive: true` in Mongo queries. Older staff accounts had **no `isActive` field** and were excluded. Admin staff list correctly treated missing `isActive` as active (`isActive !== false`).

**Fix:** Resolver and related queries use `isActive: { $ne: false }`.

**Also:** Program creator is **excluded** from the selected-users picker (`listAudienceCandidates` filters out `req.dbUser._id`).

---

## Database audit & cleanup

### Scripts added / updated

| Script | Purpose |
|--------|---------|
| `server/scripts/audit-staff-resolution.ts` | Read-only community staff audit |
| `server/scripts/audit-staff-vs-picker.ts` | Compare DB vs picker simulation |
| `server/scripts/seed-and-reconcile-staff.ts` | Reconcile SectionStaff + seed SRC (ran live in session) |
| `server/scripts/fix-staff-data.ts` | Set missing `isActive`, remove stale invites, fix legacy `gaEmail` |

### Reconciliation performed (live DB)

- **Student Apartments:** Extra RA moved to SRC (`valentinoconteh@gmail.com`, section `Student Residential Complex 1`).
- **SRC:** SectionStaff aligned; invites for `src-ga@umes.edu`, `src-sa@umes.edu`; redundant `src-ra@umes.edu` invite removed.
- **4 users** got `isActive: true` where the field was missing.
- **8 stale `AuthorizedUser` rows** removed (account already existed for that email).

### Post-fix picker expectations

| View | Count (approx.) |
|------|-----------------|
| Dept-wide | All 8 staff (7 in picker minus logged-in admin) |
| Student Apartments | GA + RA + SA |
| SRC | GA + SA + RA |

---

## `akbonsu@umes.edu` — not a real account

**What it was:** Placeholder GA email in dev seed data (`akbonsu` ≈ Asamoah Bonsu), hardcoded when `SectionStaff` was seeded for Student Apartments. Never a `User` account.

**Real GA:** `qrmanager.app@gmail.com` via `User` + `CommunityStaff`.

**Cleanup:**

- Updated all 6 Student Apartments `SectionStaff` rows in MongoDB → `qrmanager.app@gmail.com`.
- Updated seed sources:
  - `server/src/controllers/dev.controller.ts`
  - `app/api/dev/seed-section-route/route.ts`
- `fix-staff-data.ts` includes migration step for other environments.

**Note:** `SectionStaff.gaEmail` on Student Apartments sections was stale; resolution still worked via `CommunityStaff.userId` and `User.community`.

---

## Open invitations — any role, any community

Previously GA/RA/SA were limited to their assigned community and could not use dept-wide on the form. Backend also blocked out-of-scope communities.

### Backend

| Change | File |
|--------|------|
| Picker no longer filters by creator’s `user.community` | `audience-candidates.service.ts` |
| `assertCommunitiesInScope` is a no-op — any community allowed | `audience-resolver.service.ts` |
| `GET /api/programs/community-options` for all authenticated staff | `programs.routes.ts`, `programs.controller.ts`, `program-communities.service.ts` |

### Frontend

| Change | File |
|--------|------|
| `useProgramCommunityOptions` hook | `hooks/use-program-community-options.ts` |
| `fetchProgramCommunityOptions` | `lib/programs-api.ts` |
| Removed `allowDepartmentWide={false}` and per-role community lists | All `app/*/programs/new` and `edit` pages |
| `ProgramNewPage` / `ProgramEditPage` load full community list internally | `components/programs/ProgramNewPage.tsx`, `ProgramEditPage.tsx` |

### Current invitation behavior

| Goal | How |
|------|-----|
| Whole department | Dept-wide **On** + audience type (e.g. All staff) |
| One community | Dept-wide **Off** + pick community |
| Specific people | Selected users (search; creator not listed) |
| Multiple communities | Selected communities |

**Unchanged:** Draft → submit → admin approval before publish for non-admin creators.

---

## Program form UI

Two UI passes in this session (functionality unchanged in the second pass).

### First pass — structure

- Centered `max-w-2xl` layout on new/edit pages
- Card sections: Program details, Schedule, Audience
- Scope panel (dept-wide + community) moved **above** audience sub-fields
- Improved staff picker rows, search, empty states

### Second pass — fewer borders

- Replaced bordered **Cards** with simple **section headings** + spacing
- Removed scope panel box, separator, and bordered toggle rows
- Audience fields: no outer border; staff list uses `bg-muted/30` only (no ring)
- Selected rows: background tint only (no ring)
- Attachments on edit: muted row background instead of bordered list items

### Key files

- `components/programs/ProgramForm.tsx`
- `components/programs/ProgramAudienceFields.tsx`
- `components/programs/ProgramNewPage.tsx`
- `components/programs/ProgramEditPage.tsx`
- `components/programs/ProgramAttachmentsEditor.tsx`

---

## Files touched (reference)

### Server

- `server/src/services/programs/community-staff-resolver.service.ts`
- `server/src/services/programs/audience-candidates.service.ts`
- `server/src/services/programs/audience-resolver.service.ts`
- `server/src/services/programs/program-communities.service.ts` *(new)*
- `server/src/controllers/programs.controller.ts`
- `server/src/routes/programs.routes.ts`
- `server/scripts/fix-staff-data.ts`
- `server/scripts/audit-staff-vs-picker.ts`
- `server/scripts/seed-and-reconcile-staff.ts`
- `server/src/controllers/dev.controller.ts`

### App / components

- `app/api/dev/seed-section-route/route.ts`
- `app/admin/programs/new/page.tsx` (+ GA/RA/SA new/edit pages simplified)
- `components/programs/*` (form, audience fields, new/edit pages)
- `hooks/use-program-community-options.ts` *(new)*
- `lib/programs-api.ts`
- `lib/formatters.ts`

---

## Verification commands

```bash
cd server && npx tsx scripts/audit-staff-vs-picker.ts
cd server && npx tsx scripts/fix-staff-data.ts   # idempotent; safe on other envs
```

Restart the API server after backend changes.

---

## Related docs

- `_cursor-ai/programs-calendar-implementation.md` — broader Programs + calendar feature overview
- `_cursor-ai/sprint-5-microsoft-graph-outlook.md` — deferred Outlook sync
