# Sprint 5 — Microsoft Graph / Outlook Calendar Integration

**Purpose:** Future reference for adding Outlook/Teams calendar sync to Domus Programs. **Not implemented yet.**

**Prerequisite:** University IT must provide an Azure app registration and an **organizer mailbox** (e.g. `domus-calendar@university.edu`). A solo dev/test environment cannot fully validate live Outlook delivery without a Microsoft 365 tenant.

**Mode:** **Mode A only** — application permissions + organizer calendar + attendee invites. Staff do **not** need to sign into Microsoft inside Domus.

---

## 1. Goal in one sentence

When a program is **published** in Domus, automatically create a Microsoft calendar event on an organizer account and add staff as **attendees**, so invitations appear in Outlook/Teams.

**Domus remains the source of truth.** Graph is a downstream projection.

---

## 2. What already exists in the codebase (hooks ready)

### `Program` model — `server/db/program.model.ts`

```typescript
microsoft?: {
  eventId?: string;           // Graph event id — store after create
  seriesMasterId?: string;    // For recurrence later
  lastSyncedAt?: Date;
  syncStatus: "none" | "pending" | "synced" | "failed";
  syncError?: string;
}
```

New programs default to `syncStatus: "none"`.

### `ProgramInvite` model — optional for Mode A

Per-invite `microsoft.eventId` is only needed for **Mode B** (personal calendar copy). Mode A can rely on organizer event + attendee list.

### Publish hooks (where to plug in)

After invites are generated in:

- `publishProgramAsAdmin()` — `server/src/services/programs/program.service.ts`
- `approveProgram()` — same file

Both call `generateInvites(programId)` then return. **Add:** enqueue Graph sync job after successful invite generation.

Also hook:

- `updateProgram()` — when published program dates/title/location change
- `cancelProgram()` — delete/cancel Graph event

---

## 3. Mode A vs Mode B (build A only)

| | Mode A (Sprint 5) | Mode B (future) |
|--|-------------------|-----------------|
| **Auth** | Application permissions (client credentials) | Delegated OAuth per user |
| **Who connects Microsoft** | Nobody — IT sets up app once | Each user clicks “Connect” |
| **How staff get events** | Outlook meeting invite email | Event copied to personal calendar |
| **Domus field** | `program.microsoft.eventId` | `programInvite.microsoft.eventId` |
| **Good for** | Department programs, mandatory trainings | Personal “add to my calendar” |

---

## 4. Azure / IT setup checklist

Hand this to housing IT when ready.

### 4.1 App registration

1. Microsoft Entra admin center → App registrations → New registration
2. **Single tenant** (university org only)
3. Name: e.g. `Domus Programs Calendar`
4. Redirect URI: **not required** for client credentials (server-only)

### 4.2 API permissions (application — not delegated)

| Permission | Type | Why |
|------------|------|-----|
| `Calendars.ReadWrite` | Application | Create/update/delete events on organizer calendar |
| `User.Read.All` | Application | Optional — if resolving users by Graph ID |

Click **Grant admin consent for [tenant]**.

### 4.3 Credentials

- Create **client secret** (or upload certificate — preferred for production)
- Record: **Tenant ID**, **Client ID**, **Client secret**

### 4.4 Organizer mailbox

- Dedicated account: e.g. `domus-calendar@university.edu`
- Or shared mailbox / room calendar IT approves
- Record **User ID** or **UPN** for Graph path: `/users/{id}/events`

### 4.5 Application Access Policy (large tenants)

Microsoft may restrict app access to all mailboxes. IT can scope the app to only the organizer mailbox via Application Access Policy.

### 4.6 Domus environment variables

```bash
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_ORGANIZER_USER_ID=    # Graph user id or UPN
MICROSOFT_GRAPH_ENABLED=false  # Feature flag
GRAPH_SYNC_MOCK=true           # true in dev without tenant
```

Optional token encryption if storing refresh tokens later (Mode B):

```bash
MICROSOFT_TOKEN_ENCRYPTION_KEY=
```

---

## 5. Authentication flow (client credentials)

No user login in Domus.

```
1. POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
   Body: grant_type=client_credentials
         client_id={clientId}
         client_secret={secret}
         scope=https://graph.microsoft.com/.default

2. Response: access_token (short-lived, ~60 min)

3. Cache token in memory (or Redis) until expiry - 5 min buffer

4. All Graph calls: Authorization: Bearer {access_token}
```

**Server-side only.** Never expose client secret to the Next.js frontend.

---

## 6. Proposed backend architecture

### 6.1 New files (suggested)

```
server/src/
├── services/microsoft/
│   ├── graph.service.ts           # Interface
│   ├── mock-graph.service.ts      # Dev/test — logs JSON, returns fake eventId
│   ├── microsoft-graph.service.ts # Real Graph HTTP client
│   └── graph-token.service.ts     # Client credentials token cache
├── services/programs/
│   └── program-graph-sync.service.ts  # Map Program → Graph event, enqueue
└── db/
    └── graphSyncJob.model.ts      # Optional job queue collection
```

### 6.2 GraphService interface

```typescript
interface GraphService {
  createEvent(input: GraphEventInput): Promise<{ eventId: string; webLink?: string }>;
  updateEvent(eventId: string, input: Partial<GraphEventInput>): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
}
```

Factory: if `MICROSOFT_GRAPH_ENABLED && !GRAPH_SYNC_MOCK` → real; else → mock.

### 6.3 Sync job queue (minimal)

```typescript
GraphSyncJob {
  programId: ObjectId
  action: "create" | "update" | "delete"
  status: "pending" | "processing" | "completed" | "failed"
  attempts: number
  lastError?: string
  createdAt, updatedAt
}
```

**Why async:** Graph can be slow; publish API should return immediately.

**Worker options:**

- Simple: `setImmediate` / fire-and-forget with try/catch on publish (ok for v1 low volume)
- Better: poll `graphSyncJobs` every 30s or use a job runner

### 6.4 On publish (create flow)

```
1. Program status → published (existing)
2. generateInvites() (existing)
3. program.microsoft.syncStatus = "pending"
4. Enqueue job: { programId, action: "create" }
5. Return 200 to client

--- worker ---
6. Load program + invites + user emails
7. Build Graph event payload
8. POST /users/{organizerId}/events
9. Save program.microsoft.eventId, syncStatus: "synced", lastSyncedAt
10. On error: syncStatus: "failed", syncError: message
```

### 6.5 Graph event payload mapping

| Domus | Microsoft Graph `event` |
|-------|----------------------|
| `title` | `subject` |
| `description` | `body.content` (text or HTML) |
| `startDate` + `timezone` | `start.dateTime` + `start.timeZone` |
| `endDate` + `timezone` | `end.dateTime` + `end.timeZone` |
| `location` | `location.displayName` |
| Invitees (`User.email`) | `attendees[]` |
| `requiredAttendance: true` | attendee `type: "required"` |
| `requiredAttendance: false` | attendee `type: "optional"` |

Example attendees:

```json
"attendees": [
  {
    "emailAddress": {
      "address": "ra@university.edu",
      "name": "Jane Doe"
    },
    "type": "required"
  }
]
```

### 6.6 On update

When a **published** program is edited (title, dates, location, description):

- If `program.microsoft.eventId` exists → `PATCH /users/{organizerId}/events/{eventId}`
- If no eventId → treat as create
- Audience changes (new invitees) → patch attendees or documented v1 limitation

### 6.7 On cancel

- `DELETE /users/{organizerId}/events/{eventId}`  
  or PATCH with `isCancelled: true` (sends cancellation to attendees)
- Set `syncStatus` appropriately; keep `eventId` for audit or clear it

---

## 7. API endpoints to add (Sprint 5)

| Method | Path | Who | Purpose |
|--------|------|-----|---------|
| `POST` | `/api/programs/:id/sync/retry` | Admin | Re-enqueue failed Graph sync |
| `GET` | `/api/programs/:id/sync/status` | Admin | Optional — or include in program detail |

Existing publish/approve/cancel routes stay unchanged; they trigger sync internally.

---

## 8. Frontend changes (minimal)

| UI | Change |
|----|--------|
| Program detail (Admin) | Badge: Not configured / Pending / Synced / Failed |
| Failed state | “Retry calendar sync” button → `POST .../sync/retry` |
| Publish toast | “Calendar sync queued” when Graph enabled |
| Staff UI | **No changes required** — Outlook invite arrives via email |

Optional: store Graph `webLink` and show “Open in Outlook” for admins.

**Do not** add “Connect Microsoft” for staff in Sprint 5.

---

## 9. Implementation sub-phases

| Phase | Work | Needs Azure? |
|-------|------|--------------|
| **5a** | `GraphService` + `MockGraphService` + hooks on publish/update/cancel + job queue | No |
| **5b** | `MicrosoftGraphService` + token service + env config | Dev tenant or university |
| **5c** | Admin sync status UI + retry endpoint | No (works with mock) |
| **5d** | IT staging + production cutover + runbook | Yes |

**Recommended order:** 5a → 5c (ship with mocks) → 5b/5d when IT ready.

---

## 10. Testing without university email

| Environment | How |
|-------------|-----|
| **Local dev** | `GRAPH_SYNC_MOCK=true` — logs event JSON to console; UI shows `synced` with fake ID |
| **CI** | Stub `fetch`; never call login.microsoftonline.com |
| **M365 Developer Program** | Free sandbox tenant — create test users + organizer mailbox |
| **University staging** | IT app registration on non-prod tenant |

Mode A does **not** require Domus users to sign in with Microsoft.

---

## 11. Edge cases & recommended v1 behavior

| Scenario | Behavior |
|----------|----------|
| Graph fails after Domus publish | Program stays published; `syncStatus: failed`; admin retries |
| Invitee email ≠ O365 mailbox | Graph may error per attendee — log, continue others |
| 500+ invitees | Batch attendee arrays; respect Graph throttling (~10k req/10 min) |
| User declines in Outlook | Domus RSVP unchanged (no webhooks in v1) |
| Edit after publish | PATCH Graph event |
| Recurring programs | Out of scope — don't create Graph series yet |
| `MICROSOFT_GRAPH_ENABLED=false` | Skip sync; Domus works as today |

---

## 12. Security notes

- Client secret **only** in `server/.env` — never in Next.js `NEXT_PUBLIC_*`
- Use dedicated organizer mailbox — not personal admin calendar
- Application permissions are powerful — require IT admin consent
- Audit log: programId, action, attendee count, success/fail (avoid logging all emails in prod logs)
- Separate **dev** and **prod** app registrations

---

## 13. Open decisions (resolve before coding)

1. **Async vs blocking publish** — recommend **async** (queue on publish, retry on failure)
2. **Organizer mailbox** — who creates `domus-calendar@...`?
3. **Email alignment** — confirm Domus `User.email` === staff O365 UPN
4. **Teams meetings** — `isOnlineMeeting: true` for trainings? (Sprint 5 or later)
5. **Audience change after publish** — PATCH attendees vs cancel-and-recreate
6. **Sync failure** — should admin see failed sync in approval queue?

---

## 14. Success criteria

- [ ] Publish in Domus → Graph job runs → `program.microsoft.eventId` saved
- [ ] Invitees receive Outlook/Teams meeting invitations (with real tenant)
- [ ] Update/cancel in Domus updates/cancels Graph event
- [ ] `MICROSOFT_GRAPH_ENABLED=false` → zero impact on existing workflow
- [ ] Admin can see sync status and retry failures
- [ ] Mock mode works for solo dev without any Microsoft account

---

## 15. Reference links (Microsoft docs)

- [Microsoft identity platform — client credentials](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow)
- [Create event — Graph API](https://learn.microsoft.com/en-us/graph/api/user-post-events)
- [Update event](https://learn.microsoft.com/en-us/graph/api/event-update)
- [Delete event](https://learn.microsoft.com/en-us/graph/api/event-delete)
- [Application access policy (limit mailbox access)](https://learn.microsoft.com/en-us/graph/auth-limit-mailbox-access)

---

## 16. Relationship to other Domus systems

| System | Relationship |
|--------|--------------|
| **SendGrid reminders** (`email.service.ts`) | Separate — Domus-sent email reminders, not Graph |
| **Domus SSO** (`User.authProvider: 'sso'`) | Future — unrelated to Mode A calendar |
| **tony-calendar UI** | Unchanged — reads Domus API only |
| **Program approval workflow** | Unchanged — Graph hooks after approve/publish |

---

## 17. When you return to this work

1. Read `programs-calendar-implementation.md` for current state
2. Confirm IT checklist (Section 4) is complete
3. Implement **5a + 5c** with mocks first
4. Flip `MICROSOFT_GRAPH_ENABLED=true` after **5b** validation
5. Test with one real program + two test staff mailboxes in sandbox tenant
6. Production cutover **5d** with housing IT
