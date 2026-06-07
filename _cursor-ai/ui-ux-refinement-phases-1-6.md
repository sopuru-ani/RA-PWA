# UI/UX Refinement — Phases 1–6 Session

Summary of work across a multi-turn Cursor session: phased UI/UX polish for **Domus** (mobile-first housing PWA), from pattern consistency through design tokens, mobile flows, and production hygiene.

**Chat:** [UI/UX refinement Phases 1–6](31bb20ea-d5af-463a-aff9-1866158db1c5)

---

## Scope

Improve polish, consistency, and discoverability across RA, GA, SA, and Admin surfaces **without** changing core architecture. **Croissant icon** in RA header and More nav is intentional personal branding — not removed.

**Stack context:** Next.js 16, shadcn/ui, Tailwind 4, Express/MongoDB API.

---

## Phase 1 — Pattern consistency

| Area | Changes |
|------|---------|
| **PWA / metadata** | `app/layout.tsx`: Domus description, `appleWebApp.title`, maroon `themeColor`. `app/manifest.ts`: aligned `theme_color`. |
| **Programs list** | Shared `Empty`, calendar/create `aria-label`s. |
| **Admin residents** | `ListSkeleton`, token cleanup on search clear. |
| **Incidents (RA/GA/SA)** | Shared `IncidentStatusBadge` (Open/Resolved), accordion unique IDs, RA page title, removed duplicate auth verify on RA child pages. |
| **Program attendance** | Inline error + retry in `ProgramAttendanceTable`. |
| **RA layout** | Fetch error alert + retry; `refreshIncidents` in context. |
| **RAMore** | Removed placeholder Profile/Settings. |

---

## Phase 2 — Shell & navigation

| Area | Changes |
|------|---------|
| **RA calendar in-shell** | `/ra/dashboard/calendar`, redirect from `/ra/calendar`, `calendarPath("RA")` updated. |
| **Programs in bottom nav** | RA/GA/SA via `ProgramsNavItem` + badge. |
| **More menu slimming** | GA: Inspections → More; Admin: Structure → More. |
| **Bottom nav layout** | Equal-width CSS grid, `bottomNavClassName` / `bottomNavItemClassName`, `NavMoreTrigger`, safe-area padding (`lib/bottom-nav.ts`). |
| **RA header** | `formatUserAssignment()` in `lib/formatters.ts`, `roleLabelLong` in `lib/role-labels.ts`. |

**Bottom nav fix (follow-up):** Root cause was `flex-1` on `NavItem` without matching More button sizing → ghost clicks and misalignment. Fixed with shared grid + item classes across all role navs.

---

## Phase 3 — Feature-surface polish

| Area | Changes |
|------|---------|
| **Programs** | `ProgramWorkflowSteps`, `lib/format-program-audience.ts`, mobile sticky RSVP bar on `ProgramDetailView`, `EntityNotFound` for program not found. |
| **Batch approvals** | `lib/resident-request-labels.ts`, clickable batch headers, type badge variants. |
| **Bulk import** | `ImportStepIndicator`, sticky submit bar on mobile, step indicator on all variants. |
| **Resident not-found** | `EntityNotFound` on admin/GA/SA resident `[id]` pages. |

**Workflow stepper fix:** Connector lines were `hidden sm:block` — restored on mobile in `ProgramWorkflowSteps.tsx`.

---

## Phase 4 — High-intensity mobile flows

### Incidents CTA (RA / SA / GA)

- **`ReportIncidentStickyBar`** — fixed bar above bottom nav on mobile.
- **`CreateIncidentPopUp`** — controlled mode: `open`, `onOpenChange`, `hideTrigger`.
- Shared clearance utilities: `stickyAboveBottomNavClassName`, `stickyActionBarClearanceClassName` in `lib/bottom-nav.ts`.
- Padding tuned: `pb-16` (was `pb-20`) so list content sits closer to sticky bar.

### Program reject / not-found (admin)

**Problem:** After admin rejects a program, `canViewProgramDetail` only allows `pending_approval` for non-creators → reload returned 403 while stale UI remained.

**Fix:** `ProgramDetailView` redirects to programs list on fetch failure; reject action skips reload and `router.replace(backHref)`.

### Program alerts (misleading “need your action”)

**Problem:** `draftOrPendingOwnCount` included `pending_approval` — staff cannot act while waiting on admin. Alert showed on RA residents page.

**Fix:**
- Removed `ProgramAlertBanner` from RA residents page; deleted component.
- Backend: `getProgramStats` counts only **draft** and **rejected** as actionable.
- `ProgramOverviewSection` copy updated accordingly.

### Inspection sessions (RA + GA)

New shared components under `components/inspections/`:

| Component | Purpose |
|-----------|---------|
| `InspectionSessionHeader` | Sticky progress, “X of Y rooms”, session sync note |
| `RoomSaveButton` | Mark checked / Saving… / Saved / Retry save |
| `InspectionSessionFinishBar` | Fixed bottom “Finish walkthrough” |

Wired in `app/ra/inspectionSession/page.tsx` and `app/ga/inspectionSession/page.tsx`.

### Manifest

- `orientation: "any"` (was `portrait`) — better for camera / inspection flows.

---

## Phase 5 — Design system & consistency

### Maroon + white text (explicit product rule)

**Decision:** Maroon primary (`#6b0f1a`) must use **white text**, not default `primary-foreground` (especially broken in dark mode).

**Central fix:**
- `app/globals.css` — `--primary-foreground: #ffffff` (light + dark).
- `components/ui/button.tsx` — default variant `text-white`.
- `components/ui/badge.tsx` — primary badge `text-white`.

**Audit:** Toggles, calendar selected days, nav badges, raw `bg-primary` elements, form CTAs, landing buttons — explicit `text-white` where maroon is applied directly.

### Shared layout components

| Component | Path | Usage |
|-----------|------|--------|
| `PageHeader` | `components/housing/PageHeader.tsx` | Title, subtitle, optional back link — incidents, programs list |
| `EmptyState` | `components/housing/EmptyState.tsx` | Optional CTA; `components/RA/Empty.tsx` re-exports |
| `EntityNotFound` | `components/housing/EntityNotFound.tsx` | Uses `EmptyState` with back action |

### Toast tokens

- `components/Notifications.tsx` — semantic destructive / success / muted styles (replacing hardcoded red/green/gray).

### Accessibility

- `NavItem` — `aria-current="page"` when active.
- `LoginForm` / `SignupForm` — password visibility toggles as `<button type="button">` with `aria-label`.

### Landing

- Added **Programs** to feature list (`CalendarDays` icon).
- Gradients unified to Tailwind 4 `bg-linear-to-*` on hero (login/signup already used this).

---

## Phase 6 — Cleanup & production hygiene

### Deleted orphans

| File | Reason |
|------|--------|
| `app/ra/dashboard/incidents/former_layout.tsx` | Unused legacy layout |
| `app/admin/test2.tsx` | Dev scratch page |
| `app/ra/createIncidents/page.tsx` | Spinner stub; incidents use dashboard flow |

### Dev routes gated in production

| Layer | Mechanism |
|-------|-----------|
| **App pages** | `app/dev/layout.tsx` → `notFound()` when `NODE_ENV === "production"` |
| **Next middleware** | `middleware.ts` — 404 for `/dev/*` and `/api/dev/*` in production |
| **Express API** | `server/src/routes/index.ts` — `/api/dev` mounted only when not production |

### README

- Root `README.md` replaced create-next-app boilerplate with Domus overview, roles, stack, and run instructions.

---

## Key files (quick reference)

```
app/layout.tsx, app/manifest.ts
lib/bottom-nav.ts, lib/formatters.ts, lib/role-labels.ts
lib/format-program-audience.ts, lib/resident-request-labels.ts

components/housing/PageHeader.tsx, EmptyState.tsx, EntityNotFound.tsx
components/inspections/InspectionSessionHeader.tsx, RoomSaveButton.tsx, InspectionSessionFinishBar.tsx
components/RA/Incidents/ReportIncidentStickyBar.tsx, CreateIncidentPopUp.tsx, IncidentStatusBadge.tsx
components/programs/ProgramWorkflowSteps.tsx, ProgramDetailView.tsx, ProgramsListView.tsx
components/Notifications.tsx, NavItem.tsx

app/ra/dashboard/incidents/page.tsx
app/sa/dashboard/incidents/page.tsx
app/ga/dashboard/incidents/page.tsx
app/ra/inspectionSession/page.tsx
app/ga/inspectionSession/page.tsx

middleware.ts, app/dev/layout.tsx
server/src/routes/index.ts
server/src/services/programs/program.service.ts  (getProgramStats actionable count)
```

---

## Test checklist

1. **Bottom nav** — Equal columns, no ghost taps, More aligned (375px width).
2. **Incidents mobile** — Sticky “Report incident” on RA/SA/GA; desktop inline Create; list not clipped.
3. **Programs** — No false “need your action” for pending admin approval; nav badge accurate.
4. **Admin reject program** — Returns to programs list; no stuck/glitch state.
5. **Inspection session** — Sticky header progress, per-room save feedback, bottom finish bar.
6. **Maroon buttons** — White label text in light and dark mode.
7. **Production** — `/dev/*` and `/api/dev/*` return 404; seed routes unavailable on API.

---

## Intentionally unchanged

- Croissant branding (RA header + More).
- GA incidents inline create on desktop (same as RA/SA pattern with sticky mobile bar).
- `app/admin/test.tsx` — not in Phase 6 delete list (still at `/admin/test` if present).
- Phase 6 did not include Sprint 5 Outlook / Microsoft Graph work.

---

## Suggested follow-ups (optional)

- Apply `PageHeader` to remaining list/overview pages (GA/SA dashboards, admin sections).
- `resumeInspection` page — same inspection mobile UX as main session pages.
- Gate or remove `/admin/test` if no longer needed.
- Dark mode pass on non-button surfaces (toasts, badges) under real device PWA install.
