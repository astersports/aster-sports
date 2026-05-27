# Coverage Delegation (Cutover Wave PR 6) — Design Pass

> §16.15 L99 redesign-template design doc. Produced 2026-05-27 ahead of
> any PR 6 code. The audit doc is the canonical artifact; the PR
> sequence implements the locked decisions. No migration lands until
> Frank routes the open questions in §7 below.
>
> Source decision: `docs/CUTOVER_WAVE_GAP_AUDIT.md` Q3 — **Option B
> locked** (separate `event_coach_assignments` table; many-to-many
> event→coach with assigned/attended/absent status). Option A (a single
> coach column on `events`) was rejected because multi-coach tournament
> scenarios (head + assistant both present) violate a single-column
> constraint.

---

## 0. What PR 6 is

When an admin imports a tournament schedule (TourneyMachine paste), two
of the org's teams can be scheduled to play at overlapping times. If the
same coach is responsible for both teams (e.g. Coach Kenny is head coach
of 10U Black and 9U Boys, both playing Saturday 10:00), he can't be in
two gyms at once. PR 6:

1. Adds an `event_coach_assignments` table (per-event coach override on
   top of the team-default-coach derivation).
2. Detects coach double-bookings **at parse time** (in the import
   preview, before commit).
3. Surfaces a **delegation prompt** so the admin can reassign one of the
   conflicting events to a different coach — writing an
   `event_coach_assignments` row.

---

## 1. Initial audit pass — the mount tree + data model

### 1.1 Import flow (where the prompt lands)

| Layer | File | Role |
|---|---|---|
| Page | `src/pages/ImportSchedulePage.jsx` (102L) | Tournament picker + renders PastePane / PreviewTable by `im.state` |
| Hook | `src/hooks/useImportSchedule.js` (125L) | `idle → parsing → preview → committing → done`. Owns `rows`, `commit()` |
| Parse | edge fn `parse-tournament-schedule` | Returns `{ rows, teams, venues }` |
| Validate | `src/lib/import/scheduleValidation.js` | `validateParsedRow` per row |
| Dedup | `src/lib/import/scheduleDeduplication.js` | `classifyRowAgainstExisting` → `dedup: new\|updated\|...` |
| Preview UI | `src/components/schedule-import/PreviewTable.jsx` | Per-row inline edit + Commit |

**Preview row shape** (the data the prompt reads):
```
{ team, opponent, court, home_away, is_bonus, status, dedup,
  matched_event_id,
  resolved: { team_id, start_at, location_id } }
```
`commit()` inserts into `events` with **`end_at: null`** (import never
sets an end time — see §2.1).

**Insertion point:** the delegation prompt renders during
`im.state === 'preview'`, after validation + dedup, as a section in /
above `PreviewTable`. It reads `rows` (which carry `resolved.team_id` +
`resolved.start_at`) and the team→coach map.

### 1.2 Coach / event model (the gap)

- **No per-event coach concept exists today.** `events` has no coach
  column and no assignment table.
- Coaches relate to teams via `team_staff(team_id, user_id, role)`,
  `role ∈ head_coach | assistant_coach | manager`, `unique(team_id,
  user_id)` (migration `003_core_data_model.sql:116`).
- `staff_profiles` carries `display_name`, `phone` (no email).
- `useTeamHeadCoach.js` already derives a team's head coach
  (`role='head_coach'`, alphabetical tiebreak). This is the **default
  coach** derivation PR 6 builds on.

**Therefore:** "who covers event X" = `event_coach_assignments` row if
one exists, else the team's head coach via `team_staff`. The new table
is an **override layer**, not the sole source.

### 1.3 `events` schema (relevant columns)

`id, team_id (NOT NULL → teams), event_type (practice|game|tournament|
other), title, start_at (NOT NULL), end_at (nullable), opponent,
tournament_id, tournament_name, location_id, sub_location,
is_bonus_game, home_away, status, publish_status`.

### 1.4 Existing conflict detection (the UX precedent)

`useTournamentConflicts.js` + `TournamentFormSheet` `conflictMessage`
(L99 v6 §5.2 C2): a **soft, non-blocking** banner that warns when a team
is double-booked across tournaments. Overlap predicate `a1 <= b2 AND b1
<= a2` on **date** ranges.

- **Reuse:** the soft-warning UX convention + the overlap predicate
  shape. **Frank's prior call on conflicts was SOFT (warn, don't
  block)** — PR 6 should match unless Frank says otherwise (see Q4).
- **Don't reuse the hook itself:** it's date-granularity +
  tournament-participation; PR 6 needs **time-granularity** +
  **coach-grouping**.

### 1.5 Conventions to mirror (new-table migration)

From `20260522074242_cutover_pr_7a_...` (the most recent new-table
migration) + `current_user_org_id()`:
- RLS via `user_roles` join (`organization_id`), `(SELECT auth.uid())`
  subselect wrapper (RLS-initplan, CLAUDE.md §5), `role IN
  ('admin','super_admin')`.
- Any SECURITY DEFINER helper: `REVOKE EXECUTE FROM PUBLIC` **and**
  explicit `REVOKE FROM anon` (AP #23 + #57). PR 6 likely needs **no
  SECDEF** — plain RLS table writes from the admin import path suffice.

---

## 2. Deep-read addendum (subtleties the first pass hides)

### 2.1 `end_at` is null → time overlap needs an assumed duration

Imported games have `end_at: null`. To compute time overlap we need a
**default game duration**. Youth AAU games run ~60–75 min plus warmups.
Proposal: assume a configurable `ASSUMED_GAME_MINUTES = 90` and treat a
game's window as `[start_at, start_at + 90m)`. Overlap = two windows
intersect. **Q1 routes the exact value.**

### 2.2 Conflict scope is per-tournament-import for v1

`useImportSchedule(tournamentId)` is scoped to one tournament; parse only
loads `existingEvents` for that tournament. v1 detection scope: **within
the current import batch + against already-existing events in the same
tournament**. A team's *practice* the same morning, or another
tournament's game, would not be seen unless we widen the fetch.
**Q2 routes whether to widen to all events for the involved teams in the
date window.** Recommendation: v1 = batch + same-tournament (cheap, high
signal); widen later only if a real miss surfaces (YAGNI / AP #39).

### 2.3 The table is an OVERRIDE; detection runs on the *effective* coach

Detection logic per parsed game:
1. `effectiveCoach(event)` = `event_coach_assignments.coach_user_id` if a
   row exists, else `headCoachOf(team_id)` via `team_staff`.
2. Group the import's games by `effectiveCoach`.
3. For each coach with ≥2 games, flag any pair whose `[start, start+90m)`
   windows overlap.
4. Render one delegation prompt per flagged coach-cluster.

Delegating = inserting/updating an `event_coach_assignments` row for the
**chosen** event with the **new** coach → that event drops out of the
original coach's cluster → conflict clears live.

### 2.4 Assignment writes must wait for the event to exist

`event_coach_assignments.event_id` is an FK to `events.id`. For **new**
(`dedup === 'new'`) rows, the event id doesn't exist until `commit()`
inserts it. So delegation chosen in preview must be **staged** on the
row (a transient `delegated_coach_user_id` field) and the assignment row
inserted **inside `commit()`** after the event insert returns its id
(use `.insert(...).select('id')` to capture ids). For `updated`/existing
rows, `matched_event_id` is known and the assignment can be written
directly. This mirrors the existing commit's two-path (insert vs update)
structure.

### 2.5 Coaches need `staff_profiles` to be delegated-to meaningfully

The delegation target dropdown should list org coaches (distinct
`team_staff.user_id` joined to `staff_profiles.display_name`). A coach
with no `staff_profiles` row shows a fallback label ("Coach"). No new
backfill required for v1.

---

## 3. Schema — `event_coach_assignments` (Option B)

```sql
CREATE TABLE public.event_coach_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  coach_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'attended', 'absent')),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, coach_user_id)
);
CREATE INDEX event_coach_assignments_event_idx ON public.event_coach_assignments(event_id);
CREATE INDEX event_coach_assignments_coach_idx ON public.event_coach_assignments(coach_user_id);

ALTER TABLE public.event_coach_assignments ENABLE ROW LEVEL SECURITY;
```
RLS: SELECT + write for admins of the event's org, via
`events → teams.org_id → user_roles` join with `(SELECT auth.uid())`
subselect; coaches may SELECT rows for their own teams (read-only). No
`org_id` column — FK-scoped through `events.team_id → teams.org_id` (AP
#37 exemption). Many-to-many + `status` satisfies the head+assistant
multi-coach case and leaves room for the future attendance feature
(`attended`/`absent`) without schema change.

---

## 4. Anti-pattern cross-reference

| AP | Application in PR 6 |
|---|---|
| #6 | New `useCoverageConflicts` hook + delegation UI must stay ≤150L; extract a `CoverageConflictBanner` component if the prompt grows. |
| #8 | This doc provides exact schema + algorithm; PRs copy them, don't re-interpret. |
| #20 | The table's RLS write policy ships with explicit `WITH CHECK`, not USING-only. |
| #23 / #57 | If any SECDEF helper is added, REVOKE PUBLIC **and** anon. (Plain RLS preferred — likely none needed.) |
| #34 | No registry/dispatch-table change. |
| #36 | New hooks destructure `{ data, error }`, throw before use. |
| #37 | `event_coach_assignments` is FK-scoped (no org_id column) — exempt, but every read still goes through an org-scoped parent. |
| #39 | Conflict scope held to v1 batch+tournament (the YAGNI position is the truer one — see Q2). |
| #43 | Cross-surface invariant test: `effectiveCoach()` resolves identically wherever it's read (import detection + any future coach view). |
| #54 | Every PR ships ready + auto-merge in the same MCP burst. |

---

## 5. Per-role wireframes

Only **admin** reaches the import flow, so the prompt is admin-only. The
resulting assignments are read-only elsewhere (out of scope to render in
v1 — see §6).

### 5.1 Admin — import preview with a coach conflict (the one new surface)

```
┌─ Import tournament schedule ─────────────────────────────┐
│ Tournament: Rumble for the Ring (May 16 – May 17)        │
├──────────────────────────────────────────────────────────┤
│ ⚠ Coverage conflict — Coach Kenny                         │
│   Sat 10:00a  10U Black vs CT Wolves   (Court 1)          │
│   Sat 10:30a  9U Boys vs Hoop City     (Court 3)          │
│   These overlap. Kenny can't cover both.                  │
│   ┌─────────────────────────────────────────────┐        │
│   │ Delegate one game to:                         │        │
│   │  • 9U Boys → [ Coach Darien ▾ ]   [Assign]    │        │
│   └─────────────────────────────────────────────┘        │
├──────────────────────────────────────────────────────────┤
│ [ Preview rows table — existing PreviewTable ]            │
│ ...                                                       │
│                               [ Commit import ]           │
└──────────────────────────────────────────────────────────┘
```
- Banner uses the soft-warning treatment (`--em-warning-soft` left
  border) matching `TournamentFormSheet`'s `conflictMessage`.
- Picking a coach + Assign stages `delegated_coach_user_id` on that row;
  the banner re-evaluates live and clears the cluster when resolved.
- **Soft, not blocking (pending Q4):** Commit stays enabled even with an
  unresolved conflict — matching Frank's prior soft-conflict call. An
  unresolved cluster commits with both events on the default coach.

### 5.2 Coach / Parent

No surface in v1. (Future: a coach's home could show "You're covering: …"
from `event_coach_assignments` — explicitly deferred.)

---

## 6. Explicit out-of-scope (v1)

- Rendering assignments anywhere outside the import preview (no coach
  "my coverage" view, no event-detail coach line).
- `attended` / `absent` status transitions (column exists; no UI).
- Conflict detection outside the import flow (e.g. the manual
  event-create wizard, or schedule edits).
- Cross-tournament / practice-vs-game conflicts (Q2 — deferred unless
  routed in).
- Notifying a delegated-to coach (no notification on assign in v1).
- Editing/removing an assignment after commit (v1 writes only; manage
  later).

---

## 7. Open questions — chat routing required before PR A

- **Q1 — assumed game duration.** `end_at` is null on imports. Use a
  fixed `ASSUMED_GAME_MINUTES`? Recommend **90**. Alternative: treat any
  two same-coach games starting within N minutes as conflicting (cruder,
  no duration assumption).
- **Q2 — detection scope.** v1 = within import batch + same-tournament
  existing events (recommended, YAGNI). Or widen to **all** events for
  the involved teams in the date window (catches practice clashes; more
  queries, more noise)?
- **Q3 — delegate-to candidate set.** Any coach in the org
  (`team_staff` distinct users)? Or restrict to coaches already on one of
  the conflicting teams? Recommend **any org coach** (covers the "borrow
  Darien" case).
- **Q4 — block vs soft-warn on commit.** Match the existing soft,
  non-blocking tournament-conflict precedent (recommended), or hard-block
  commit until every conflict is resolved?

---

## 8. PR sequence (after Q1–Q4 lock)

- **PR A — schema.** `event_coach_assignments` migration + RLS + mirror
  file (AP #21) + `DO $$` smoke. No app code. Verify grants via
  `routine_privileges` if any SECDEF lands.
- **PR B — detection hook + helpers.** `effectiveCoach()` resolver
  (assignment-or-team-default) + `useCoverageConflicts(rows, teamCoachMap)`
  returning clustered conflicts. Pure + unit-tested (overlap predicate,
  duration boundary at exactly the assumed window, multi-coach cluster).
  No UI yet.
- **PR C — import preview UI + commit wiring.** `CoverageConflictBanner`
  in `ImportSchedulePage` preview state; stage `delegated_coach_user_id`
  on rows; `commit()` writes `event_coach_assignments` after event insert
  (capture ids via `.select('id')`). Cross-surface invariant test for
  `effectiveCoach()` per AP #43.

Recommended: A→B→C in one routing window once Q1–Q4 are locked.

---

## 9. Sign-off

This doc carries the five §16.15 elements: initial audit pass (§1),
deep-read addendum (§2), anti-pattern cross-reference (§4), per-role
wireframes (§5), explicit out-of-scope (§6). No code lands until Frank
routes Q1–Q4 (§7). Ledger §4.A PR 6 entry points here.
