# Programs + Calendar — Implementation Summary

Documentation of the Programs feature built across Sprints 1–4 and the calendar UI fix. Domus-native workflow is complete; Outlook sync is deferred to Sprint 5 (see `sprint-5-microsoft-graph-outlook.md`).

**Attendance, CSV export, and attachment permissions** were refined in a later session — see [programs-attendance-attachments-permissions.md](./programs-attendance-attachments-permissions.md).

---

## What works today (no Microsoft / Outlook required)

- All roles (Admin, AD/GA, RA, SA) can **create** programs, including department-wide
- **Draft → submit → admin approve → publish** (non-admin programs need admin approval)
- Admin can **publish directly** without approval
- **Invites**, **RSVP**, **attendance** (admin + creator mark; AD/GA view-only — see [attendance doc](./programs-attendance-attachments-permissions.md))
- **tony-calendar** UI with mobile sheet + desktop 30% events sidebar
- Dashboard **program stats** and **notification badges** on More menus
- **Conflict warnings** on create/edit forms
- **CSV attendance export** (admin + creator)
- **Optional labeled link attachments** (admin/creator; invitees read-only; post-publish supported)
- **24h email reminders** (Admin trigger; logs to console without SendGrid; optional `SENDGRID_API_KEY` + `SENDGRID_FROM`)

---

## Permission model (final)

### Creation & publishing

| Action | Admin | AD (GA) | RA | SA |
|--------|-------|---------|-----|-----|
| Create draft | ✅ | ✅ | ✅ | ✅ |
| Department-wide programs | ✅ | ✅ | ✅ | ✅ |
| Submit for approval | — | ✅ | ✅ | ✅ |
| Publish directly | ✅ own | ❌ | ❌ | ❌ |
| Approve / reject | ✅ | ❌ | ❌ | ❌ |

### Monitoring visibility (oversight — not participation)

| Creator | Who sees in monitoring view |
|---------|----------------------------|
| Admin | All admins |
| AD (GA) | Admins only |
| RA / SA | AD (in scope) + Admin |

Dept-wide RA/SA programs are visible to ADs for awareness.

### Participation

Invitees always see published programs in calendar/list/RSVP regardless of monitoring rules.

---

## Program status lifecycle

```
draft → pending_approval → published     (non-admin, via admin approve)
draft → published                        (admin own programs)
rejected → draft                         (creator edits and resubmits)
published → cancelled
```

**Approve = publish** — invites are generated on approve/publish.

---

## Backend (Express + MongoDB)

### Models — `server/db/`

| File | Collection | Purpose |
|------|------------|---------|
| `program.model.ts` | `programs` | Program document, `microsoft.*` scaffold (`syncStatus: "none"`) |
| `programInvite.model.ts` | `programinvites` | Per-user invite, RSVP, attendance |

### Services — `server/src/services/programs/`

| File | Purpose |
|------|---------|
| `program.service.ts` | CRUD, publish, approve, reject, cancel, calendar feed, attendance, attachments |
| `audience-resolver.service.ts` | Resolve audience → user IDs |
| `program-conflicts.service.ts` | Overlap detection for current user |
| `program-export.service.ts` | CSV attendance export |
| `program-reminder.service.ts` | 24h SendGrid/console reminders |

### Permissions — `server/src/lib/program-permissions.ts`

Creation, monitoring filters, edit/cancel rules, attendance/attachment scope (see [attendance doc](./programs-attendance-attachments-permissions.md)).

### API — `/api/programs`

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/` | Create draft |
| `GET` | `/` | Participation list |
| `GET` | `/monitoring` | Admin + AD oversight |
| `GET` | `/pending` | Admin approval queue |
| `GET` | `/calendar?from=&to=` | tony-calendar feed (max **90-day** range) |
| `GET` | `/conflicts?startDate=&endDate=` | Schedule overlap warning |
| `GET` | `/stats` | Dashboard widgets |
| `POST` | `/reminders/send` | Admin — 24h reminders |
| `GET` | `/:id` | Detail |
| `PATCH` | `/:id` | Update |
| `POST` | `/:id/submit` | Non-admin → pending |
| `POST` | `/:id/publish` | Admin self-publish |
| `POST` | `/:id/approve` | Admin approve + publish |
| `POST` | `/:id/reject` | Admin reject |
| `POST` | `/:id/cancel` | Cancel |
| `PATCH` | `/:id/rsvp` | RSVP |
| `GET` | `/:id/attendance` | Roster (admin, creator, GA view) |
| `PATCH` | `/:id/attendance` | Mark attendance (admin, creator) |
| `GET` | `/:id/attendance/export` | CSV (admin, creator) |
| `POST` | `/:id/attachments` | Add labeled link (admin, creator) |
| `DELETE` | `/:id/attachments/:attachmentId` | Remove link (admin, creator) |

Mounted in `server/src/routes/programs.routes.ts`.

### Dashboard integration

`programStats` added to:

- `api/admin/dashboard`
- `api/ga/dashboard`
- `api/sa/dashboard`
- `api/ra/dashboard`

---

## Frontend (Next.js)

### Shared — `components/programs/`

| Component | Purpose |
|-----------|---------|
| `ProgramsCalendarPage` | Shell: back link, standalone (RA) vs embedded (GA/SA/Admin) |
| `ProgramsCalendar` | Fetch events, selected date, sheet/panel orchestration |
| `ProgramsCalendarGrid` | tony-calendar + month/week toolbar |
| `ProgramsDayEventsPanel` | Desktop 30% sidebar |
| `ProgramsDayEventsSheet` | Mobile bottom sheet |
| `ProgramsDayEventList` | Event cards |
| `ProgramForm` | Create/edit with conflict alert |
| `ProgramDetailView` | RSVP, approve/reject, attendance, attachments |
| `ProgramsListView` / `ProgramsListPage` | List with mine / oversight / pending tabs |
| `ProgramAttendanceTable` | Attendance roster; edit + CSV for admin/creator; read-only for GA |
| `ProgramOverviewSection` | Dashboard stat cards |
| `ProgramAlertBanner` | RA residents page alerts |
| `ProgramNavBadge` | More menu notification count |

### API client — `lib/programs-api.ts`, `lib/calendar-date.ts`, `lib/program-labels.ts`

### Types — `types/programs.ts`

### Routes

| Role | Programs | Calendar |
|------|----------|----------|
| RA | `/ra/dashboard/programs/*` | `/ra/calendar` (standalone shell) |
| SA | `/sa/dashboard/programs/*` | `/sa/calendar` |
| AD (GA) | `/ga/dashboard/programs/*` | `/ga/calendar` |
| Admin | `/admin/programs/*` | `/admin/calendar` |

### Calendar layout fix

- Removed nested `h-dvh` inside role layouts (was causing double viewport / scroll bugs)
- GA/SA/Admin: `app/{role}/calendar/layout.tsx` uses `absolute inset-0` inside `relative` content area
- RA: standalone `h-dvh` with top bar back link (no dashboard bottom nav)
- Mobile: events in **Sheet**; desktop: **30%** sidebar
- Today selected by default on desktop panel
- tony-calendar theme overrides: `programs-calendar-theme.css` (Domus maroon)
- Calendar fetch range: `calendarFetchRange()` — 89 days (under API 90-day cap)

### Other frontend notes

- FullCalendar **retired**; `components/Calendar.tsx` deleted
- `tony-calendar` in `transpilePackages` (`next.config.ts`)
- UI label: GA → **AD** via `lib/role-labels.ts`; API/URLs stay `GA`

### Email — `server/src/services/email.service.ts`

SendGrid via `fetch` when env set; otherwise console log (dev-friendly).

---

## Environment variables (programs-related)

| Variable | Required | Purpose |
|----------|----------|---------|
| `SENDGRID_API_KEY` | No | Real reminder emails |
| `SENDGRID_FROM` | No | Sender address |
| `MICROSOFT_*` | No | Sprint 5 only — not used yet |

---

## Explicitly deferred (not built)

- Microsoft Graph / Outlook sync (Sprint 5)
- Recurring programs (schema stub only)
- Per-user “Connect Microsoft” / Mode B OAuth
- SA monitoring view (SA mirrors RA for create/participate)
- Push notifications (PWA stub exists)
- File upload storage for attachments (metadata links only)

---

## Sprint map (completed)

| Sprint | Scope | Status |
|--------|-------|--------|
| 1 | Models, permissions, programs API | ✅ |
| 2 | tony-calendar UI, all role pages, nav | ✅ |
| 3 | Attendance UI, dashboard stats, nav badges | ✅ |
| 4 | Conflicts, CSV, reminders, attachments, calendar cap | ✅ |
| Calendar fix | Layout, sheet, standalone RA | ✅ |
| 5 | Microsoft Graph Mode A | 📋 Planned — see separate doc |

---

## Quick test checklist

1. RA creates draft → submit → Admin approves → invites exist
2. RSVP on published program
3. Creator marks attendance on own program; AD views roster read-only on RA-created program (see [attendance doc](./programs-attendance-attachments-permissions.md))
4. Calendar loads on mobile (tap day → sheet) and desktop (sidebar)
5. Admin → Programs → Send 24h reminders (check server logs without SendGrid)
