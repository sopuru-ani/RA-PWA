# Programs — Attendance, Attachments & Permission Refinement

Summary of a session that reviewed the programs feature, agreed on tighter attendance and attachment rules, and implemented them end-to-end.

**Supersedes** the attendance and attachment bullets in [programs-calendar-implementation.md](./programs-calendar-implementation.md) (Sprints 1–4).

---

## Session goals

1. Understand what **link attachments** are for when creating programs.
2. Clarify **who can view vs edit attendance** on the invite roster.
3. Implement: only **admins and the program creator** mark others’ attendance; **GAs view only**; **CSV export** for admin + creator; **attachment links** visible to invitees and manageable by admin/creator **after publish**.

---

## Attachments (labeled links)

### What they are

Programs support **optional URL attachments** — not file uploads. Each entry has:

| Field | Purpose |
|-------|---------|
| `filename` | Display label (e.g. “Training handout”) |
| `bucket` | URL (stored in S3-style schema field) |

Multiple links are supported: the UI adds one label + URL at a time via “Add link”; the program stores an array with no schema cap.

### Separate from location

The **Location** field on `ProgramForm` is free text (building, room, or virtual meeting URL). Attachments are supplementary materials (handouts, forms, slides) on the program detail page.

### Visibility & editing (after this session)

| Role | View links | Add / remove links |
|------|------------|-------------------|
| **Admin** | Yes | Yes (except `cancelled`) |
| **Creator** | Yes | Yes (except `cancelled`) |
| **GA** (monitoring) | Yes | No |
| **Invitee** | Yes (read-only) | No |

- Invitees see links on **published** programs they can open (have an invite).
- Creator/admin see the attachments section even when empty on published programs so they can add links post-publish.
- Attachments are **not** editable on **cancelled** programs.

---

## Attendance & CSV export

### Before this session

- **View + mark attendance:** Admin and in-scope GA (`canAccessMonitoring`).
- **CSV export:** Same as mark (Admin + GA).
- **Creators (RA/SA):** No attendance UI even for own programs.

### After this session

| Action | Admin | Creator (published) | GA (in scope) | Invitee |
|--------|-------|-------------------|---------------|---------|
| View attendance roster | Yes | Yes | Yes (read-only) | No |
| Mark others’ attendance | Yes | Yes | No | No |
| Export CSV | Yes | Yes | No | No |
| RSVP | If invited | If invited | If invited | Yes |

- Attendance is only available when `status === "published"`.
- GAs retain **oversight visibility** for RA/SA programs in their communities (unchanged monitoring scope); they no longer get dropdowns, “Mark all attended”, save, or CSV.
- Invitees can still RSVP; they cannot mark anyone else’s attendance.

---

## Permission helpers (`server/src/lib/program-permissions.ts`)

| Function | Rule |
|----------|------|
| `isProgramCreator` | `createdBy === user._id` |
| `canViewAttendance` | Published + (admin, creator, or `canAccessMonitoring`) |
| `canMarkAttendance` | Published + (admin or creator) |
| `canExportAttendance` | Same as `canMarkAttendance` |
| `canManageAttachments` | Not cancelled + (admin or creator) |

`canAccessMonitoring` is unchanged — still drives GA monitoring lists and view-only attendance access.

---

## Files changed

### Backend

| File | Change |
|------|--------|
| `server/src/lib/program-permissions.ts` | New helpers; split view / mark / export / attachments |
| `server/src/services/programs/program.service.ts` | `listProgramAttendance` → `canViewAttendance`; `updateAttendance` → `canMarkAttendance`; attachment add/remove → `canManageAttachments` |
| `server/src/services/programs/program-export.service.ts` | Export → `canExportAttendance` |

### Frontend

| File | Change |
|------|--------|
| `components/programs/ProgramDetailView.tsx` | Attendance for admin/creator/GA; edit + export for admin/creator; attachments editable for admin/creator on published |
| `components/programs/ProgramAttendanceTable.tsx` | `readOnly` and `canExport` props; GA sees badges, no save/export |

---

## API behavior (unchanged paths, new gates)

| Method | Path | Who |
|--------|------|-----|
| `GET` | `/:id/attendance` | Admin, creator, GA (scope) |
| `PATCH` | `/:id/attendance` | Admin, creator |
| `GET` | `/:id/attendance/export` | Admin, creator |
| `POST` | `/:id/attachments` | Admin, creator (not cancelled) |
| `DELETE` | `/:id/attachments/:attachmentId` | Admin, creator (not cancelled) |

---

## Test checklist

- [ ] **RA creator** — Publish own program → see attendance table, mark statuses, export CSV, add link after publish.
- [ ] **SA creator** — Same as RA.
- [ ] **GA (in scope)** — Open RA/SA program → see attendance read-only (badges, no save/export); cannot PATCH attendance (403).
- [ ] **GA (out of scope)** — No attendance UI or 403 on GET attendance.
- [ ] **Admin** — Mark attendance and export on any published program; add/remove attachments on published.
- [ ] **Invitee** — See attachment links on published program; RSVP works; no attendance section.
- [ ] **Cancelled program** — Creator/admin cannot add attachments (400/403).

---

## Related docs

- [programs-calendar-implementation.md](./programs-calendar-implementation.md) — Full programs + calendar feature (Sprints 1–4)
- [programs-audience-staff-ui-session.md](./programs-audience-staff-ui-session.md) — Audience picker, staff reconciliation, open invitations
