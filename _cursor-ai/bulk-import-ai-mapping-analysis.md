# Bulk Import Analysis & AI Mapping Recommendation

Architecture review of Admin vs GA/AD bulk resident import, plus guidance on whether to use a light AI model (e.g. Gemini 2.5 Flash) for variable spreadsheet formats.

**Session type:** Ask-mode analysis — no application code was changed in this chat. This doc captures findings and recommendations only.

**Related implementation doc:** [bulk-import-and-batch-approval.md](./bulk-import-and-batch-approval.md) (shared parser, `ResidentBulkImport`, batch approve/reject from a prior session).

---

## What was done in this session

1. **Traced both bulk-import flows** end to end: UI → parsing → preview → API → persistence.
2. **Compared Admin vs GA/AD** behavior, validation strictness, and community handling.
3. **Identified remaining gaps** when source spreadsheets vary in layout or naming.
4. **Evaluated Gemini 2.5 Flash** (or similar) as an automatic “file → app table” mapper.
5. **Recommended a phased approach**: deterministic improvements first; AI only as an optional, confirmed fallback.

---

## Current architecture (reviewed)

### Shared pipeline

Both roles use the same 3-step flow via `components/housing/ResidentBulkImport.tsx`:

1. Drop `.xlsx` (ExcelJS)
2. Pick worksheet
3. Editable preview table → POST JSON array

Parsing lives in `lib/resident-import.ts`:

- `FIELD_ALIASES` — ~55 header variants (`Surname`, `Hall`, `Floor`, `Room Number`, etc.)
- `parseResidentRows()`, `worksheetToRaw()`
- Diagnostics: `getUnmappedHeaders()`, `getMissingRequiredColumns()`, `getRequiredFields()`

### Canonical row shape

```ts
{
  firstName, lastName, fullName?, email, studentId,
  community, section, room, notes?
}
```

### Page wrappers

| Role | Route | Component config | Submit endpoint | Outcome |
|------|-------|------------------|-----------------|---------|
| **Admin** | `/admin/add-multiple-residents` | `variant="polished"`, `showAuthGate`, community from sheet | `POST api/admin/seed-residents` | Direct `Resident.insertMany` |
| **GA/AD** | `/ga/dashboard/residents/bulk` | `lockedCommunity` from session, `variant="default"` | `POST api/ga/resident-requests/bulk` | Pending `ResidentAdditionRequest` per row + shared `batchId` |

### Server validation differences

| Check | Admin (`seedResidents`) | GA (`createBulkResidentRequests`) |
|-------|-------------------------|-----------------------------------|
| Required fields | Implicit via client preview | `validateRequired()` per row |
| Community exists | No | Yes (`Community.findOne`) |
| Section in community | No | Yes (`assertSectionInCommunity`) |
| Duplicate email / student ID | DB unique index / partial insert | Per-row 409 before create |
| SectionStaff record | Required (422 if missing) | Required on approve (422) |
| Batch limit | None documented | Max 500 rows |

Admin import can fail at DB time if community/section strings do not match configured housing data. GA path is stricter before anything enters the approval queue.

---

## Variation the current parser does **not** handle well

These are the main reasons users might ask for “smarter” import:

| Issue | Current behavior |
|-------|------------------|
| Header not on row 1 | Row 1 is always treated as headers (title rows, merged cells break mapping) |
| Unknown column names | Column ignored; user sees “unmapped” / missing required banners |
| Single `Name` column only | Maps to `fullName`; `firstName` / `lastName` stay empty → row invalid |
| `Last, First` vs `First Last` | No split logic |
| Community/section/room typos | No fuzzy match to DB labels; GA fails validation; Admin may fail on staff lookup |
| Student ID as Excel scientific notation | Passed through as displayed text (may be wrong) |
| CSV / Google Sheets quirks | `.xlsx` only |
| Multi-sheet data | User must pick one sheet manually |

The existing **editable preview + block submit on missing required fields** is the safety net. It does not remove manual cleanup for messy sources.

---

## AI (Gemini 2.5 Flash) recommendation

### Verdict

**Do not use Flash as the default import path.** Use deterministic mapping + human review first. Consider AI only as an **opt-in “Smart map”** when auto-mapping fails.

### Why not default to AI

- **PII exposure** — Names, emails, and student IDs would leave your infrastructure (policy / FERPA-style concerns).
- **Non-determinism** — Same file may map differently; hard to regression-test.
- **Hallucination risk** — Invented or dropped values before `insertMany` or approval is unacceptable.
- **Redundant with existing UX** — Preview table already requires human sign-off; AI does not remove that step.
- **Most variance is structural** — Aliases, header detection, manual column map, and DB fuzzy-match solve the common cases without API cost or latency.

### When AI *could* help (narrow scope)

Use only if:

- Auto-mapping covers fewer than ~80% of columns or header row is ambiguous
- Output is a **proposed column map + transforms**, not final resident rows
- User **must confirm** on the same editable grid
- Runs **server-side** with logging/redaction; never auto-submit
- Manual mapping + downloadable template remain the fallback

**Suggested tier-2 prompt task:** “Given these header strings and target schema, return JSON column mapping” — not “parse all cell values and create residents.”

---

## Recommended next steps (priority order)

1. **Column-mapping UI** — Dropdown per source column → target field when aliases miss.
2. **Header-row detection** — Scan first N rows for best alias match score before parsing.
3. **Name splitting rules** — `Last, First`, single full-name column → populate `firstName` / `lastName`.
4. **Value normalization** — Suggest corrections for community/section/room against DB lists (GA already validates; suggestions reduce friction).
5. **CSV support** + **downloadable `.xlsx` template** — Reduces format variance at the source.
6. **Optional “Smart map”** — Gemini/Flash behind a button, only when steps 1–5 are insufficient.

No new dependencies or API keys are required for steps 1–5.

---

## Key files referenced

| Area | Path |
|------|------|
| Parser | `lib/resident-import.ts` |
| Shared UI | `components/housing/ResidentBulkImport.tsx` |
| Admin page | `app/admin/add-multiple-residents/page.tsx` |
| GA page | `app/ga/dashboard/residents/bulk/page.tsx` |
| Admin API | `server/src/controllers/admin.controller.ts` (`seedResidents`) |
| GA bulk API | `server/src/controllers/ga/residents.controller.ts` (`submitBulkResidentRequests`) |
| GA service | `server/src/services/housing/resident-requests.service.ts` |
| Request model | `server/db/residentAdditionRequest.model.ts` |

---

## Test checklist (if implementing follow-ups)

- [ ] Upload sheet with non-standard headers → column mapper resolves all required fields
- [ ] Sheet with title row above headers → correct header row detected
- [ ] Single “Name” column → first/last populated or clear validation message
- [ ] GA: typo in section → suggestion or actionable error before submit
- [ ] Admin: missing SectionStaff → 422 with row indices (unchanged behavior)
- [ ] Optional AI map → proposal only; user edits before submit; no auto-POST

---

## Session outcome summary

| Deliverable | Status |
|-------------|--------|
| End-to-end flow documentation | Done (this file) |
| Admin vs GA comparison | Done |
| AI feasibility / risk analysis | Done — not recommended as default |
| Code changes | None in this session |
| Follow-up implementation | Deferred — see recommended next steps |
