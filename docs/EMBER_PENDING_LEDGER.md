# EMBER Pending Ledger

> Living source of truth for everything in-flight on the Skyfire / Ember
> platform. CC + chat both read this at session start to avoid
> re-discovery. Updated per session and per PR.
>
> Created: 2026-05-18 (Italy CEST) from L99 cross-role audit consolidation
> Last updated: 2026-05-18

This doc complements (not replaces):
- `docs/SKYFIRE_BUILD_QUEUE_v2.md` — shipped-log roadmap, forward-only
- `docs/STATE_OF_AFFAIRS_L99_v3.md` — canonical high-level state
- `docs/EMBER_MASTER_INDEX_v3.md` — locked decisions catalog
- `CLAUDE.md` — durable anti-patterns + architectural rules

This is the **pending** ledger: what's not yet shipped, what's decided
but not yet built, what needs cross-surface propagation, what's blocked
on workflow vs code, what's deferred for product calls. Every category
that doesn't fit cleanly into the shipped-log or the high-level state
lives here.

The architectural commitment that produced this doc: CLAUDE.md
**anti-pattern #43** — cross-role fixes ship with a cross-surface
invariant test. The L99 audit on 2026-05-18 cataloged 14 distinct
bugs grouping into 4 drift classes. Without #43, those bugs repeat
within weeks; with #43 + this ledger, the system protects itself from
the next round of silent divergence.

---

## 1. SHIPPED RECENTLY (last 7 days)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #233  | 2026-05-18 | formatters.js NY-pin (canonical helpers)                           | All date renders    |
| #234  | 2026-05-18 | 51 leaf-callsite NY-pin + static-grep audit (`timezoneAuditPin`)   | All toLocale* sites |
| #235  | 2026-05-18 | AlertZone loading-state gate (kindness-microcopy invariant)        | All 3 home pages    |
| #236  | 2026-05-18 | Tier 3 v1 retrospective doc consolidation                          | Docs                |
| #237  | 2026-05-18 | Coach roster overdue gate (<72h threshold on yellow highlight)     | CoachRosterSnapshot |

Five-PR Sunday from Italy CEST. Audit immediately after surfaced the
items below.

---

## 2. ACTIVE BUGS (L99 audit clusters)

Each cluster maps to one or more bug observations (B# = coach review,
A# = admin review, P# = parent review). Cluster numbers preserve
chat's L99 ordering.

### Cluster 1 — Tournament results not propagated to aggregates
- Status: **WORKFLOW-IN-PROGRESS** (diagnostic D1 confirmed workflow gap, not code)
- Severity: HIGH
- Surfaces affected: 9 across all 3 roles
  - Coach: B4 (10U Black 0% post-championship), B5 (Teams tab records pre-tournament)
  - Admin: A4 (Nationals Qualified = 0), A5 (Season Records pre-tournament), A6 (Tournament tiles inconsistent), A7 (Standings PCT stale)
  - Parent: P22 (Home MY TEAMS pre-tournament), P28 (Schedule Games tab Standings stale)
- D1 finding (2026-05-18): 15 tournament events from May 16-17 exist in `events` table with `tournament_id IS NOT NULL`. ALL have `has_result=false`, `our_score=null`, `opponent_score=null`, `published_at=null`. The tournament events ARE in the system; scores were never entered via Quick Score → game_results table is empty for these events → aggregate queries correctly return pre-tournament state.
- Resolution: **workflow item, not code PR**. Frank publishes 13 tournament results via Quick Score (see §9 for full inventory). If aggregates DON'T update after publish, reopen as code fix in a follow-up PR.
- Drift-hedge test per #43 (deferred until aggregate path is touched): assert tournament events with `tournament_id IS NOT NULL` and entered scores propagate to all 4 aggregate surfaces

### Cluster 1.1 — 10U Blue mis-tagged tournament event (D1 bonus finding)
- Status: **OPEN**, awaiting Frank verification
- Severity: LOW (data hygiene)
- D1 surfaced one 10U Blue event on 2026-05-17 with `tournament_id = '254afad0-23af-4979-ac4a-88614b76e341'` (different from the Rumble for the Ring tournament 196e595d...). Per Frank's data dump, 10U Blue played 6th Boro 4AB on May 17 at IC-Tuckahoe — a league game, not a tournament.
- Resolution: Migration 021 should null the `tournament_id` on that event.
- Surface impact: if this event is counted as a tournament game, it would distort future tournament aggregates once Cluster 1 is published.

### Cluster 1.2 — 10U Blue Game 6 missing from system
- Status: **OPEN**, Frank confirmed 3-3 is correct (not 3-2 shown in screenshots)
- Severity: LOW (workflow data entry)
- Evidence: Frank's league schedule data dump shows 6 league games played for 10U Blue. Resurrection Blue 4AB (May 9) at 25-27 L is the 6th game. Screenshots at audit time showed 3-2 — that means Game 6 was not yet entered in the system at screenshot capture.
- Frank-action item: enter Game 6 result (Resurrection Blue 4AB, May 9, 25-27 L) into the system during the Quick Score backfill session.

### Cluster 1.3 — 10U Blue Game 7 status unknown
- Status: **AWAITING FRANK VERIFICATION** (added to §6)
- Severity: LOW
- Evidence: 10U Blue scheduled to play 6th Boro 4AB on Sun May 17 (rescheduled to HOME @ IC-Tuckahoe). Frank's data dump does not include a result for this game. Either:
  - (a) Game happened, result not yet entered (workflow gap)
  - (b) Game rescheduled again, didn't happen May 17 (calendar update needed)
- Frank-action item: confirm Game 7 status during Quick Score session.

### Cluster 3.1 — Event title ad-hoc string appendages (scope expansion)
- Status: **OPEN**, expands original Cluster 3 (B2) scope
- Severity: LOW (data hygiene)
- Examples found in production:
  - "9U Boys Game" (team name embedded as title)
  - "10U Blue · 6th Boro 4AB · May Reschedule"
  - "10U Blue · Holy Family-NR · May Reschedule"
- Root pattern: ad-hoc free-text edits to `event.title` during reschedule + event creation workflows. No constraint on what gets stored in the title field.
- Resolution:
  - Migration 021: sanitize existing event titles to remove redundant team names + "May Reschedule" suffix appendages
  - Cluster 3 PR: centralize event title rendering in shared helper. Computed from `event.opponent` + `event.event_type` + event status, NOT free-text. Prevents future ad-hoc appendages.

### Cluster 2 — Per-player % degenerates to RSVP-going-rate when check-ins absent
- Status: **OPEN**, label rename queued
- Severity: HIGH (label) / MEDIUM (workflow)
- CC code-validated: `useAttendanceData.js:130` computes `pct = goingCount / totalPast`. When no check-in / arrival rows exist, attendance% collapses to RSVP-going%. Math is correct; label is misleading.
- Surfaces affected:
  - Coach: B3 (roster snapshot 4% / 0% identical per team)
  - Admin: A11 (Lily Alexander "4% Going · 96% NR")
  - Parent: P4 (Charlie "4% No · 96% NR" despite RSVP'd GOING tonight)
- Resolution:
  - Label rename across CoachRosterSnapshotTeam + admin Teams roster + parent Teams roster (~10-15 min)
  - Workflow promotion of check-ins → §9 workflow gaps
- Drift-hedge test per #43: assert the % label name matches the metric it represents across all 3 surfaces

### Cluster 3 — Event title concatenates own team name redundantly
- Status: **OPEN**, awaiting diagnostic D6
- Severity: MEDIUM
- Surfaces affected:
  - Coach: B2 (Schedule "vs. 9U Boys Game" vs Home NEXT EVENT "vs. 6th Boro 3AB · 9U Boys")
  - Admin: A9 (Schedule lists redundant team line below title)
  - Parent: P25 (8U Boys event detail "8U Boys Practice" with redundant "8U Boys" team line)
- Hypothesis: `event.title` either auto-gen'd with wrong template OR Schedule pulls `event.title` literal while Home composes from `opponent_name`
- Resolution: centralize event-title rendering in shared helper (likely `src/lib/eventDisplay.js` or `<EventTitle event={e} />`)
- Drift-hedge test per #43: assert same event ID renders consistent title across Schedule, Home NEXT EVENT, Parent profile event detail

### Cluster 4 — Notification bell badge has no inbox to consume it
- Status: **OPEN** — UX decision required (resolution path locked-ish)
- Severity: MEDIUM (UX clarity)
- Frank's clarification: bell tap routes to Settings; no actual inbox
- Surfaces affected: bell appears on all role headers showing "4" / "1" / "2"
- Resolution paths:
  - (a) Remove badge count + route bell to settings shortcut without count → ~15 min near-term
  - (b) Build real notification inbox → larger; deferred to Phase plan item
- Recommended near-term: (a). Counts without inbox = misleading UX.
- Anti-pattern #42 reminder: don't pre-build `useNotificationBadge()` hook before the inbox exists
- Drift-hedge test per #43: assert bell badge behavior consistent across all 3 role headers

### Cluster 5 — Coach Home MY TEAMS source divergence
- Status: **OPEN**, root cause validated, fix shape clear
- Severity: HIGH
- CC code-validated:
  - `CoachHomePage.jsx:47-51` builds `myTeams` from direct `team_staff` query — no records data
  - `ParentHomePage.jsx:124` passes `byTeamId={recordsByTeam}` from `useOrgTeamRecords(orgId)` to same downstream component
  - Both use `ParentHomeTeamCard`; one passes records, one doesn't
- Resolution: add `useOrgTeamRecords` to CoachHomePage + thread records prop through (~10-15 min)
- Drift-hedge test per #43: assert MY TEAMS panel renders matching records across CoachHomePage + ParentHomePage + TeamsPage for same fixture
- Anticipated PR: #239 (tonight per L99 routing lock)

### Cluster 6 — Admin Home cache/query race (A2 + A3)
- Status: **A3 RESOLVED via PR #241; A2 OPEN**
- Severity: HIGH (A3 confirmed regression) / MEDIUM (A2 state-transition flicker)
- A3 final root cause: **PR #235 regression** in `useAlertEvaluator.js`, not in AlertZone.
  - CC's D5 diagnostic missed this — focused on AlertZone gate logic (structurally correct) and didn't trace upstream evaluator timing.
  - Frank's 2026-05-18 smoke confirmed the green-flash-before-amber pattern persisted in production post-PR-#235.
  - Actual race: `useState([])` for configs made the initial state and "fetched + empty" state indistinguishable. The evaluate callback fired on mount with `configs=[]`, hit its empty-configs early return (`setAlerts([]); setLoading(false); return`), and flipped `loading=false` BEFORE the configs fetch completed. AlertZone briefly rendered the green AllClearPill before re-rendering with the real alerts once configs loaded and evaluate re-fired.
  - Fix in PR #241: `useState(null)` as "not yet fetched" sentinel. The evaluate's null branch returns without touching loading. AlertZone's loading gate stays armed through the configs-fetch window.
  - Drift-hedge test (`useAlertEvaluator.loadingGate.test.js`) asserts `loading=true` persists through the configs-fetch phase + only flips to false after evaluate completes.
- A2 (count flip 63→31 / 159→77): identified as season-context state-transition flicker. Downgraded HIGH → MEDIUM. Fix candidate: skeleton on KpiGrid until useSeason settles. Not in PR #241 scope.
- Lesson registered for CLAUDE.md anti-pattern future-extension: code-side review of a downstream gate isn't sufficient when an upstream hook can output values that bypass the gate. Trace the FULL state pipeline before ruling out a regression.

### Cluster 7 — Admin Home greeting not NY-pinned
- Status: **OPEN**, ~5-min one-liner
- Severity: LOW
- Surfaces affected: Admin Home only (A12)
- Parent Home (P21) gets it right; Admin Home doesn't
- Resolution: wire AdminHomePage greeting to NY-pin helper from PR #233/#234 cascade
- Drift-hedge test per #43: assert greeting respects NY-pin across all 3 home pages

---

## 3. STAGED MIGRATIONS (Phase 0B 013-021)

> Frank's input needed to populate full list. CC's knowledge here is
> partial. Update this section with current staged migration list.

Known:
- **Migration 021** — data corrections including 11U Girls duplicate practice Mon May 18 (if D12 diagnostic confirms duplicate)
- Migration 013 → 020 — TBD (need Frank to enumerate)

Pattern reminder: migrations applied via MCP must be mirrored to
`supabase/migrations/` with canonical version-string filenames per
anti-pattern #21.

---

## 4. DECISIONS LOCKED, NOT YET IMPLEMENTED

> Anchored to `docs/EMBER_MASTER_INDEX_v3.md` (49 locked decisions per
> chat's note). CC doesn't have visibility into the full list. Frank
> to enumerate which are awaiting implementation. Examples surfaced:

- Density toggle 3 levels (blocked by Migration 016 `user_preferences`)
- Note edit cooldown 4hr
- Rotation Planner staff-only
- (and N more — Frank to populate from EMBER_MASTER_INDEX)

This section becomes high-leverage when Monday's work starts —
implementing a locked decision is cheaper than re-deciding.

---

## 5. UX PATTERNS NEEDING CROSS-SURFACE PROPAGATION

The drift classes from CC's L99 analysis. Each is a pattern that
exists on some surfaces and not others, OR exists on all surfaces
but with different implementations.

### Render-layer drift (Class 2)
- **Event title rendering** — 3 paths today (Schedule literal, Home composed, Parent detail concatenated) → should be 1 shared helper
- **Team PPG rendering** — 4 paths today (TeamRow, TeamDetail, StandingsTable, TeamHeaderCard) → should be 1 `<TeamPpgCell />` or similar
- **W-L record formatting** ("5-2") — appears in TeamRow, TeamDetail, StandingsTable, TeamHeaderCard, MY TEAMS panel, parent Home MY TEAMS, admin Records summary → should be 1 helper
- **Streak indicator** ("W1", "L4") — similar multi-path
- **Status badge rendering** — needs inventory
- **Attendance % rendering with label** — Cluster 2 territory

### Data-layer drift (Class 1)
- **Team records** — `useOrgTeamRecords` exists, partial adoption (Cluster 5)
- **Roster data** — `useAttendanceData` canonical; verify all consumers
- **Alerts** — `useAlertEvaluator` canonical; per-role filtering at consumer (correct)

### Label / semantic drift (Class 3)
- **Attendance % label** — "Attendance" vs "Going %" vs "% No" (Cluster 2)
- **Bell badge meaning** — count without inbox (Cluster 4)

### Cross-role behavior drift (Class 4)
- **Home greeting NY-pin** — admin doesn't, parent + coach do (Cluster 7)
- **Density toggle convention** — Home vs Schedule may diverge (B6)

---

## 6. VERIFICATION ITEMS WAITING ON FRANK

- **A1** — View-as eye-icon identity context: does clicking the eye actually switch greeting + scope, or only switch role label? Needs in-app verification.
- **A13** — Bell badge purpose: RESOLVED per Frank's note (routes to Settings, no inbox). Moves to Cluster 4 resolution.
- **P10** — "Ember v2.0" label: intentional rebrand preview or hardcoded leak? Tied to §8 Phase 0C work.
- **D12-pending** — 11U Girls duplicate practice Mon May 18: D12 diagnostic confirms or refutes; if duplicate, moves to Migration 021. **VERIFIED FALSE POSITIVE 2026-05-18 18:00Z** — D6 confirmed no 6:30 PM 11U Girls practice on May 18. Only 7:35 PM at St. Patrick's. Closed.
- **Cluster 1.3** — 10U Blue Game 7 (6th Boro 4AB May 17): did the rescheduled game happen? If yes, get score; if no, mark further reschedule. Frank to confirm during Quick Score session.

---

## 7. PRODUCT CALLS DEFERRED

Items requiring Frank's product judgment, not technical fixes:

- **B6 / P26** — Density toggle convention (blocked by Phase 0B Migration 016 `user_preferences`)
- **A8** — Standings sort PCT desc vs oldest-to-youngest age. Standings semantic may legitimately override the org-wide age sort rule.
- **A10 / P20** — "View full schedule →" link styling vs CTA button card. Design hierarchy call.
- **P8** — "Arrive 15 min early" vs "5 min" contradiction in event detail. Which takes precedence?
- **P12** — Comments enabled on practice events. Keep or scope to games only?
- **P17 / P18** — Schedule filter density (4 mechanisms). Simplify parent view?
- **B7** — Color/name mismatch (10U Black blue, 10U Blue gray). Locked v14 palette per CLAUDE.md §10. Could revisit if user confusion is real.
- **A12 timezone product call** — Greeting "where you are" vs "where the org is". Recommended: NY-pin for consistency (Cluster 7), but worth Frank's explicit lock.

---

## 8. PHASE 0C REBRAND CHECKLIST (Skyfire → Ember)

> Tracker for the rebrand work. CC has limited visibility on Phase 0C
> details — Frank to populate from authoritative source.

Known scope:
- `--sf-*` → `--em-*` CSS variable migration (mostly done per PR
  history; verify completeness)
- Domain decision (current `skyfire-app.vercel.app` → ?)
- `skyfire_phoenix.webp` retirement / replacement
- Version string source (Ember v2.0 — P10 verification)
- Codebase rename (file paths, package names)
- Email template namespace
- (and other items Frank to enumerate)

---

## 9. WORKFLOW GAPS (NOT CODE BUGS)

Issues that look like bugs but actually require behavioral changes
(Frank or coaches doing something different in production):

### Cluster 1 — Tournament results publish + league backfill (Rumble for the Ring CT May 16-17 + 10U Blue Games 6-7)
**Status: WORKFLOW DATA SUPPLIED 2026-05-18 18:15 CEST (REVISED)**

Frank-action item: open Quick Score, enter scores for **13-15 games**
(13 tournament + 1-2 league backfill), publish. Estimated ~30-45 min.

Tournament inventory (13 games):

**11U Girls — Rumble for the Ring CT (5 games, 3-2 in tournament)**
| Date    | Opponent              | Score | Result        |
|---------|-----------------------|-------|---------------|
| May 16  | CT Northstars         | 19-14 | W             |
| May 16  | PHD Carothers         | 10-41 | L             |
| May 16  | PHD McCurdy           | 18-9  | W             |
| May 16  | Connecticut Elite     | 17-6  | W             |
| May 17  | PHD McCurdy (FINAL)   | 23-26 | L (runner-up) |

**10U Black — Rumble for the Ring CT (4 games, 4-0 + championship)**
| Date    | Opponent              | Score | Result        |
|---------|-----------------------|-------|---------------|
| May 16  | PHD White             | 29-21 | W             |
| May 16  | PHD Yellow            | 38-20 | W             |
| May 17  | Team Frenji SF        | 38-22 | W             |
| May 17  | CT Wolves (FINAL)     | 37-30 | W (champion)  |

**8U Boys — Rumble for the Ring CT (4 games, 0-4)**
| Date    | Opponent              | Score | Result        |
|---------|-----------------------|-------|---------------|
| May 16  | CT Wolves             | 15-35 | L             |
| May 16  | Stamford Peace        | 12-41 | L             |
| May 16  | Twin Athletics        | 8-34  | L             |
| May 16  | NY Wild               | 13-34 | L             |

League backfill (1-2 games):

**10U Blue — likely missing**
| Game # | Date    | Opponent              | Venue                  | Result      |
|--------|---------|-----------------------|------------------------|-------------|
| Game 6 | May 9   | Resurrection Blue 4AB | St Patrick-Armonk HOME | 25-27 L     |
| Game 7 | May 17  | 6th Boro 4AB (resched)| IC-Tuckahoe HOME       | **unknown** |

Game 6 evidence: Frank confirmed 3-3 is the correct record; screenshots
showed 3-2. The gap is Game 6 not yet entered.

Game 7 evidence: rescheduled to May 17 yesterday; outcome unknown.
Frank to verify (see Cluster 1.3 / §6).

Post-publish expected aggregate state (verification targets):
- 11U Girls: 8-4 season (was 5-2 pre-tournament)
- 10U Black: 9-4 season (was 5-4 pre-tournament), 2× Tournament Champion
- 8U Boys: 3-9 season (was 3-5 pre-tournament)
- 10U Blue: 3-3 (after Game 6 entered) or 4-3 / 3-4 (after Game 7 if played)
- 9U Boys: 1-5 (current data confirms, no backfill needed)
- Nationals Qualified count: 2 (11U Girls + 10U Black)
- Rumble for the Ring CT tile shows W/L per team

If aggregates DON'T update after publish, Cluster 1 reopens as code
fix (filter bug in aggregate query path).

Note: D1 reported 15 tournament events; 13 actual tournament games to
enter. Delta of 2 likely consists of:
- 1 placeholder Championship bracket event for 8U Boys (didn't reach
  the championship game; 0-4 in pool play)
- 1 mis-tagged 10U Blue event (see Cluster 1.1 above)

### Cluster 2 — Check-in workflow gap
- Coach action: use the gameday arrival board / check-in feature at
  games and practices going forward
- Code surfaces this as the % degeneration documented in Cluster 2
- Optional code follow-up: "0 check-ins recorded — was this event
  run?" indicator to make the workflow gap more visible

This category is the discipline that separates "we have a bug" from
"we need to use the feature we built." Both are real, both need
resolution, but the resolution path is different.

---

## 10. QUICK-LINK CHANGES STATUS

CC's read: Frank's "quick links" likely refers to the Admin Shortcuts
panel (IMG_1216) showing 8 buttons: Event, Player, Compose Briefing,
Briefings, Financials, Announce, Tournaments, Import Schedule.

These appear shipped per the audit screenshots. If Frank meant
something else, this section catches it. Update with specifics if
different scope.

---

## 11. TEST COVERAGE GAPS

Tests that should exist but don't. Each item is a candidate
drift-hedge test under anti-pattern #43.

- **Cross-role home page integration test** — mount all 3 home pages
  with same fixture, assert equivalent renders for shared elements
  (greeting respects NY-pin, KpiGrid renders same numbers, AlertZone
  respects loading state, MY TEAMS records match)
- **Hook divergence audit** — static-grep asserting canonical hooks
  are used where they exist (e.g., direct `teams` queries flagged
  when `useOrgTeamRecords` exists)
- **AlertZone behavior under concurrent query refresh** — no race
  between `useKpiGrid` and `useAlertEvaluator` should produce false
  all-clear pill (covers Cluster 6 A3 hypothesis)
- **Render-path consistency tests** — for each shared display pattern
  in §5 above, a test that asserts same data renders identically
  across surfaces
- **Cluster 1 aggregate test** — tournament events with scores
  propagate to all 4 records aggregate surfaces (Teams tab, Records
  page season, Tournament tiles, Standings PCT)
- **Cluster 2 label invariant** — % label string consistent across
  all 3 role roster surfaces

---

## 12. 150-LINE CAP WATCH

Files approaching the cap that v2 work might push over. **Watch is
not split** — per anti-pattern #42, splitting prematurely creates
parallel systems for no current benefit. List here is informational.

> CC needs to grep current line counts to populate. Will run during
> next session and update this section. Initial known candidates:
> - `CoachHomePage.jsx` (likely close)
> - `AdminHomePage.jsx`
> - `ParentHomePage.jsx`
> - `formatters.js` (137 lines post-PR-#234, room left)
> - `useAttendanceData.js`

---

## 13. ANTI-PATTERN CATCH TALLY

How many times each anti-pattern fired in production work. Tells us
which ones are paying rent vs which are dormant. Drift-tracking
metric — a pattern that catches frequently is providing real value;
a pattern that never fires is either redundant or covering a
non-occurring failure mode.

| # | Pattern                              | Catches | Last caught |
|---|--------------------------------------|---------|-------------|
| 22 | Verify CC commits/pushes             | ~5      | PR #237     |
| 27 | Resolver / composer pure with IO     | 0       | —           |
| 31 | verify_jwt config audit              | 3       | Wave 4.3-E  |
| 34 | Registry/dispatch table removals     | 1       | Wave 4.4-T0d |
| 35 | Branch divergence pre-flight         | 3       | PR #234, #235, #237 |
| 36 | Destructured-default Supabase swallow| 1       | Wave 5 PR 2 |
| 37 | Org-scoped query order               | 5       | Phase Beta B1 |
| 38 | Renderer-emit parity                 | 1       | Phase Gamma 5b |
| 39 | Position+hedge                       | 2+      | L99 routing |
| 40 | Existing-infra hedge                 | 1+      | PR #234     |
| 41 | Routing-signal overshadow            | 1+      | L99 routing |
| 42 | Parallel-system buildup              | 1+      | PR 6 Tier 3 v1 |
| 43 | Cross-surface invariant test         | 0 (NEW) | —           |

> CC to populate fully from git history during next session.
> Highlights so far: #35 has caught divergence reliably; #36 has
> high value for one observed incident; #43 starts at 0 and grows
> from here.

---

## 14. HELPER-EXTRACTION BACKLOG

Code in components that should move to `src/lib/` per "single render
path" doctrine. Each is a candidate refactor PR with a drift-hedge
test per anti-pattern #43.

Ordered by inferred ROI (most-impactful first):

1. **`formatEventTitle(event)`** — solves Cluster 3 + multi-surface
   redundancy. Inputs: event object with opponent_name, team, type.
   Output: canonical title string. Audit-grep test: no inline `vs.`
   concatenation in JSX.
2. **`<TeamRecordCell record={} />`** — W-L format ("5-2") across
   7+ surfaces.
3. **`<TeamPpgCell stats={} />`** — PPG across 4 surfaces.
4. **`<StreakBadge streak={} />`** — "W1" / "L4" rendering.
5. **`formatAttendancePct(rowPct, hasCheckinData)`** — Cluster 2.
   Returns "—" or "{pct}%" with correct label. Test: label string
   matches across surfaces.
6. **`<StatusBadge status={} />`** — status pill rendering
   (needs inventory).
7. **`<EventLocationLink location={} />`** — map URL priority
   per CLAUDE.md §15.

Each extraction PR ships with:
- The helper / component
- Migration of all known callsites to the helper
- A drift-hedge audit test (static-grep flagging inline reimplementations)

This section is the operational target for "stop running audits."
When this list is empty, the structural drift surface area is
minimal.

---

## DOC UPDATE PROTOCOL

When a PR ships that resolves an item:
1. Mark the cluster RESOLVED in §2 with PR # and date
2. Move tactical detail to PR description; keep one-line summary here
3. Update §1 (shipped recently) with the PR
4. Update §13 (anti-pattern tally) if the PR caught a new instance
5. If new bugs surface, append to §2 with cluster mapping
6. If new drift class identified, append to §5 + CLAUDE.md anti-pattern

When a session ends:
1. Update §3 / §4 / §6 / §8 from session state
2. Update §11 / §12 / §14 with new findings
3. Commit the doc with PR or as separate docs commit

CC's session-start checklist:
1. Read this doc end-to-end
2. Cross-check with `STATE_OF_AFFAIRS_L99_v3.md`
3. Confirm `git fetch + branch divergence` per anti-pattern #35
4. Apply ground-truth tables (§11.5 CLAUDE.md) and canonical hooks
   (this doc §5) to any code being touched
