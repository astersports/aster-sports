# EMBER Pending Ledger

> Living source of truth for everything in-flight on the Skyfire / Ember
> platform. CC + chat both read this at session start to avoid
> re-discovery. Updated per session and per PR.
>
> Created: 2026-05-18 (Italy CEST) from L99 cross-role audit consolidation
> Last updated: 2026-05-18

This doc complements (not replaces):
- `docs/SKYFIRE_BUILD_QUEUE_v2.md` — shipped-log roadmap, forward-only
- `docs/STATE_OF_AFFAIRS_L99_v5.md` — canonical high-level state
- `CLAUDE.md` — durable anti-patterns + architectural rules
- Various audit synthesis docs (`docs/AUDIT_*.md`) — point-in-time deep dives

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
| #238  | 2026-05-18 | L99 meta-fix: EMBER_PENDING_LEDGER + anti-pattern #43              | Docs + doctrine     |
| #239  | 2026-05-18 | Cluster 5 / B1 — CoachHomePage MY TEAMS records (first #43 fix)    | Coach Home          |
| #240  | 2026-05-18 | Cluster 2 / B3 — `% Going` label across Coach/Admin/Parent surfaces| Roster snapshots    |
| #241  | 2026-05-18 | Cluster 6 / A3 — `useAlertEvaluator` configs null-sentinel (PR #235 regression close) | All 3 home pages |

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
- Status: **RESOLVED (label fix)** via PR #240 (2026-05-18); workflow promotion deferred
- Severity: HIGH (label) / MEDIUM (workflow)
- CC code-validated: `useAttendanceData.js:130` computes `pct = goingCount / totalPast`. When no check-in / arrival rows exist, attendance% collapses to RSVP-going%. Math is correct; label was misleading on Coach Home.
- Surfaces affected:
  - Coach: B3 (roster snapshot "4%" with no label — the worst case)
  - Admin: A11 (Lily Alexander "4% Going · 96% NR" — already had label)
  - Parent: P4 (Charlie "4% No · 96% NR" — already had labels for each category)
- PR #240 resolution:
  - `CoachRosterSnapshotTeam.jsx:83` — changed `${row.pct}%` → `${row.pct}% Going`
  - Matches the convention in `PlayerRow.jsx` + `MyChildSpotlight.jsx` (admin + parent rosters) which already used `% Going` / `% Maybe` / `% No` / `% NR` labels per category
  - Cross-surface invariant test (`playerGoingLabelInvariant.test.jsx`) locks: bare `{pct}%` form must not re-appear; "Going" label must be present in all surfaces rendering the goingCount metric
- Workflow promotion of check-ins remains in §9 (gameday arrival board → coaches do check-ins → metric becomes real attendance, not just RSVP-going-rate)

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

Items where the decision is locked in chat-side discussion or prior
session notes, but the code/doc artifact hasn't shipped yet.
Organized by **arc**, not by chronology — each arc is a coherent
multi-PR unit with its own scope and sequencing.

Sources cross-referenced 2026-05-18:
- `docs/SKYFIRE_BUILD_QUEUE_v2.md` (canonical build queue)
- `docs/CUTOVER_WAVE_GAP_AUDIT.md` (briefing renderer + parser arc)
- `docs/STATE_OF_AFFAIRS_L99_v5.md` (canonical state)
- `docs/CC_SESSION_HANDOFF_2026-05-13.md` (PostHog + Dependabot)
- `docs/AUDIT_DAY_2026-05-16_FINAL_CLOSE.md` (audit close)
- `docs/CC_WAVE_4_4_COUNTER_PLAN_REVISION_2026-05-11.md` (briefing IA)

Items flagged "VERIFY MONDAY" live in §15 — they may already be
shipped (status uncertain at audit time).

---

### §4.A — Cutover Wave (briefing renderer + parser)

Status: **NOT STARTED**. 5-7 PR arc per `CUTOVER_WAVE_GAP_AUDIT.md`.
Strategic priority: compounding cost on every tournament briefing
without PR 1 (renderer alignment).

- **PR 1** — `tournament_prelim` renderer alignment. Match cobalt-header /
  yellow-RSVP-banner / venue-list / day-grouped-game-cards / IF-ADVANCE /
  logistics / tagline / brand-footer pattern from Frank's hand-composed
  briefings. Add 5 new section types: rsvp_callout, venue_list, +3 more.
- **PR 2** — Schedule parser at `/admin/import-schedule`. Single-paste
  flow, LLM extraction with 8 validation rules, per-row inline edit,
  reuses DO $$ pattern from ZG Rumble materialization. Note: route may
  be partially live (referenced in `QuickActions.jsx`); see §15.
- **PR 3** — Per-venue notes + LLM-suggested closer. `locations.notes`
  column + LLM-suggest button on signoff_message textarea.
- **PR 4** — Coach Roundup kind. New `coach_roundup` in
  RESOLVER_REGISTRY; multi-team header + per-team-color game rows +
  conflict callout.
- **PR 5** — Family Guide kind (VIP Parent Guide). Multi-kid family
  briefings; VIP header + per-kid-color game rows; new section types
  `vip_header`, `kid_color_pill`.
- **PR 6** — Coverage delegation schema + UI. New
  `event_coach_assignments` table (Option B); conflict detection at
  parse time + delegation prompt in import preview.
- **PR 7** — Cutover gate infrastructure. `briefing_feedback` table;
  survey link injection into briefing emails; 1-5 rating signed-token
  endpoint; ≥4.0 average aggregation query.

---

### §4.B — Briefing IA remainder (Wave 4.4-B)

Status: Session 1 partially shipped. Remainder OPEN.

- **TournamentHeader Send Briefing relocation** — Wave 4.4-B Session 1
  shipped for AdminHome + TeamDetailPage (deep-link to
  `/admin/briefings/compose?anchor=team&id=<team.id>`), but
  TournamentHeader still uses the legacy inline `SendBriefingButton`
  (verified 2026-05-18 in `src/components/tournament/TournamentHeader.jsx:103`).
  Fix: replace `<SendBriefingButton>` with a deep-link to
  `/admin/briefings/compose?anchor=tournament&id=<tournament.id>&kind=<ctaKind>`.
  Verify portal's URL param hydration handles the `tournament` anchor
  kind. Estimate: ~30-45 min including cross-surface invariant test per #43.
- **docs/IA_FRAMING.md** — May 13 Decision D (IA framing addendum)
  never shipped. Light doc capturing the briefing IA strategy (one
  home Quick Action + portal as canonical entry, deep-link buttons on
  team/tournament detail surfaces as convenience). ~10 min.

---

### §4.C — Sprint B-F Home Page completion

Source: `SKYFIRE_BUILD_QUEUE_v2.md` Phase 1 Sprint plan, references
`HOME_DESIGN_SPEC.md` (CC hasn't read in this session — see §15).

Status: **PARTIAL via Tier 3 v1** (PRs #225-#232 + #239-#241 overlap
Sprints D-E in particular). Individual section status uncertain;
VERIFY MONDAY per §15.

- **Sprint B — Parent home Phase 1**: MY TEAMS dynamic data (likely
  SHIPPED via PR #239), ACTION ZONE, density toggle wiring (reads
  Migration 016), relative date language (partial via PR #234), empty
  state design.
- **Sprint C — Parent home Phase 2**: LIVE NOW card, RECOGNITION card
  (ties to Migration 018 team_achievements UI), Tournament weekend
  banner, Emergency alert banner, Coach message block.
- **Sprint D — Coach home**: new CoachHomePage.jsx (SHIPPED via Tier
  3 v1), all coach-specific sections (partial — alerts + roster
  snapshot + MY TEAMS shipped), Team Pulse wiring (Migration 023
  shipped; status of Team Pulse unknown).
- **Sprint E — Admin home redesign**: AdminHomePage exists + alerts
  + KpiGrid shipped; ops dashboard / pending queues / activity feed /
  Attention Required banner state uncertain.
- **Sprint F — Cross-role polish**: dark mode complete (Q10),
  accessibility full audit (Q1), analytics instrumentation (Q9),
  performance optimization, multi-org scaffolding (Q3). All NOT
  shipped per current visibility.

---

### §4.D — Sprint G Rides redesign

Source: `RIDES_DESIGN_SPEC.md` (CC hasn't read in this session — see §15).

Status: **DESIGNED, NOT BUILT**. Entire sprint queued.

- **Migration 025** — Rides schema redesign
- Offer + claim UI for parents
- Coach rides dashboard
- Admin rides widget + audit
- Waitlist + auto-confirm infrastructure

---

### §4.E — P0 BUG-001 through 004 (Phase 1)

Source: `SKYFIRE_BUILD_QUEUE_v2.md` §P0 Bugs.

Status: **LIKELY CLOSED by Migration 022** but **NOT VERIFIED**. See §15.

- **BUG-001** — Admin home "Next Up" card data stale/broken. Fix phase
  Phase 1 after Migration 022; Mig 022 shipped 2026-04-24.
- **BUG-002** — `src/hooks/useEventDutyCounts.js`. Phase 1.
- **BUG-003** — `src/hooks/useEventRideCounts.js`. Phase 1.
- **BUG-004** — DB CHECK or frontend guard in `RideFormOverlay.jsx`.

Build queue states "All 5 fixed in Migration 022" but only 4 BUGs
listed. Verification pass needed Monday.

---

### §4.F — PostHog telemetry (Frank-action)

Source: `CC_SESSION_HANDOFF_2026-05-13.md` + CLAUDE.md §16.7.1.

- **PostHog server-side GeoIP enrichment** — unresolved. Help desk
  ticket to file (Frank-action, ~5 min). Free tier doesn't expose
  `/pipeline/transformations` toggle.
- **Historical cleanup of geo properties** — deferred until help desk
  resolves (would be undone by re-enrichment).
- **PostHog-js alias/merge bug GH #31154** — open upstream; affects
  identify-after-Supabase-auth on browser SDK.

---

### §4.G — Quick wins (small, ship anytime)

Items <30 min each. Bundle into a single Monday-AM warm-up PR.

- **Cluster 3** event title centralization + Migration 021 sanitization
  (~30-45 min, see §2)
- **Cluster 4** bell badge removal (~15 min, see §2)
- **Cluster 7** admin greeting NY-pin (~5-10 min, see §2)
- **Cluster 6.A2** KpiGrid loading gate refinement (downgraded MEDIUM)
- Async-ordering test replication for `useAdminStats`, `useHomeRole`,
  `useAttendanceData`, `useActivities` per anti-pattern #44 (see §11)
- **P6 RSVP copy normalization** — chat's L99 parent review flagged
  inconsistent decline copy ("Can't" vs "Not Going"). Pick canonical
  label (likely "Not Going" matching `PlayerRow.jsx`/`MyChildSpotlight.jsx`
  category set) and unify across RSVP UI surfaces. ~5-10 min.
  Found post-PR-#243 via anti-pattern #45 acid-test scan — captured
  same-session via this PR #244 amendment.

---

### §4.H — Pre-existing locked items (verify against rebuilt index)

Inherited from earlier session notes:
- Density toggle 3 levels (blocked by Migration 016 `user_preferences`)
- Note edit cooldown 4hr
- Rotation Planner staff-only

Status: needs verification — the `EMBER_MASTER_INDEX_v3.md` referenced
in earlier docs is not present in `docs/` as of 2026-05-18. The "49
locked decisions" figure has no canonical source today. Worth either
rebuilding the index from session notes or accepting that locked
decisions live distributed across various session docs.

---

### §4.I — Schedule-change rebuild (Wave 3.8 §5.2)

Per `STATE_OF_AFFAIRS_L99_v5:159`: `schedule_change` kind has zero
producers in the codebase; `useUpdateActivity.updateSeries()` strips
`start_at`/`end_at` deliberately. Spec is pending Claude.ai lock —
3-option dialog + composer + audit table. Estimate 6-8h once spec
lands. Not blocked on code; blocked on product spec.

---

### §4.J — Weather forecast per event (Wave 4b)

Per `STATE_OF_AFFAIRS_L99_v5:171` (D-WEATHER-1): OpenWeatherMap fetch
at compose time, 6h cache, indoor events skip. Backlog. ~4-6h.

---

### §4.K — Dependabot PR #147

Per `AUDIT_DAY_2026-05-16_FINAL_CLOSE:85`: needs workflow-read token
scope before next attempt. Frame as a permanent capability upgrade
(debugging CI via Actions logs), not just a #147 fix.

---

### §4.L — Tier 4 P2 findings (2026-05-16 audit)

Per `AUDIT_SYNTHESIS_2026-05-16:151`: deferred to next-week cleanup
batch. CC to read the synthesis doc when planning the cleanup PR to
enumerate specific items.

---

### §4.M — May 16 Audit Cycle carryovers (Phase 1-5 + Beta)

Source: Phase 1 Core Subset read 2026-05-18 19:30 CEST (Sunday post-dinner hour). Six docs walked in sequence: `AUDIT_PHASE1_WIRING` → `PHASE2_REGISTRY_STATE` → `PHASE3_MIGRATION_DEPLOY` → `PHASE4_RLS_SECURITY` → `PHASE5_TYPE_CONTRACT` → `AUDIT_BETA_SYNTHESIS`.

**30+ findings across 5 phases + Beta synthesis.** Some shipped during the audit-day itself (PR #210-#215 + Phase 1 P0 batch + Phase 3 P0 mirror). Many P0-LATENT / P1 items remain unshipped or unknown-status. Each entry below either flags SHIPPED (with evidence cite) or queues a V-* verification item.

**KEY FINDING for Monday Phase 4**: the "22-bug catalog" referenced in Frank's Monday-opener prompt is NOT in `BETA_SYNTHESIS`. The synthesis doc has 6 sub-area verdicts + carryover items but no "22-bug" enumeration. The 22-bug catalog lives in `SKYFIRE_BUILD_QUEUE_v2.md` as documented in §4.E. Phase 4 of the Monday-opener (22-bug reconciliation) should focus on §4.E + SKYFIRE_BUILD_QUEUE_v2, NOT on the May 16 audit docs. Saves ~15-20 min of misdirected search.

#### §4.M.1 — Phase 1 (Wiring + Schema Drift): mostly SHIPPED, some P1 remaining

**VERIFIED SHIPPED** via V-17 (2026-05-18 19:50Z): PRs #195 + #203 closed P0-1 + P0-2 + P1-1 + P1-2 + P1-7. Code-grep confirmed `.eq('org_id', ...)` + `.is('archived_at', null)` present in the affected files.

REMAINING (P1):
- P1-1: `EventLocationTab.jsx:18` tournaments query missing org_id (defense-in-depth gap)
- P1-2: `CreateActivityWizard.jsx:31` events series-recurrence missing org_id
- P1-3: `notificationBadgeQueries.js:40` conditional org filter — needs normalization decision
- P1-4: `FinancialDashboardPage.jsx:36` financial_transactions missing season_id (over-fetches; misaligned scope)
- P1-5: `useRsvps.js:21` event_rsvps wildcard select
- P1-6: `useEventArrivals.js` (3 callsites) event_arrivals wildcard select
- P1-7: tournaments archived_at inconsistency across surfaces (StepDetails.jsx + EventLocationTab.jsx)

Plus systemic patterns A/B/C/D worth a structural fix:
- Pattern C: edge function input re-validation anti-pattern candidate (CLAUDE.md addition)

#### §4.M.2 — Phase 2 (Registry + State-Machine): 3 P0-LATENT + 3 P1 (UNSHIPPED, status verify)

P0-LATENT (3 orphan renderers, expanded to 7 in Phase 5):
- `event_card` — emitted by rsvpNudge.js:121 + academyCallupNotice.js:118; no SECTION_RENDERERS entry; renders empty
- `placement_block` — emitted by tournamentRecapHelpers.js:12; no renderer
- `game_log` — emitted by tournamentRecapHelpers.js:38, 46; no renderer

P1:
- `championship_scenarios` renderer is dead code (registered but never emitted)
- 4 KIND_COMPOSERS entries unreachable (academy_callup_notice, weekly_digest, announcement, custom_message)
- 5 legacy kind enum values in `constants.js:72-77` (tournament_final, tournament_rsvp_lock, etc.)

Status: **6 of 7 VERIFIED SHIPPED** via V-18 (2026-05-18 19:50Z). `ls src/lib/engine/renderers/` confirms eventCard.js · placementBlock.js · gameLog.js · callupCard.js · coachReflection.js · standoutMoments.js all exist. The 7th (`family`) was contested between Phase 2A and Phase 5 — likely a Phase 5 false positive (nested data carrier, not top-level emit). The orphan-renderer arc that Phase 5 sized at 250-350 lines of new code was actually CLOSED across multiple subsequent PRs we hadn't cross-referenced.

#### §4.M.3 — Phase 3 (Migration + Deploy): 1 P0 + 5 P1 + 10+ P2 (PARTIAL SHIPPED)

**VERIFIED SHIPPED** via V-19 (2026-05-18 19:50Z): P0-1 `scheduleGaps.js ↔ _scheduleGaps.ts` mirror drift CLOSED. Both source and Deno mirror have `describeScheduleGaps(events, { minGapMinutes = MIN_GAP_MINUTES } = {})` signature.

REMAINING:
- P1: 5 documented unregistered ghost migrations (per CLAUDE.md §5 — known + documented; only blocking if `supabase db reset` runs)
- P2: 8 ghost data ops + 5 filename mismatches + 13 sequential-prefix duplicates (cosmetic only; CI skips re-applied versions)

Edge function deploy reconciliation: CLEAN per audit (10 functions verified, no drift).

#### §4.M.4 — Phase 4 (RLS / Security): 3 P0 + 3 P1 (GATED, UNSHIPPED)

GATED per Class 7 discipline: all 6 findings staged for post-synthesis batched RLS migration PR.

P0 — RLS UPDATE policies missing `WITH CHECK`:
- `briefing_reminders.admins update own org reminders` — **CLOSED** (V-20 verified `with_check_expr` matches `using_expr`)
- `briefing_templates.briefing_templates_update_admin` — **CLOSED** (V-20 verified)
- `team_types.team_types_update_admin` — **CLOSED** (V-20 verified)

P1 — PUBLIC EXECUTE on SECURITY DEFINER (anti-pattern #23):
- `briefing_active_queue(p_org_id, ...)` — **CLOSED** (V-20: PUBLIC revoked; grants now service_role + authenticated + postgres; authenticated is correct since function checks admin internally)
- `log_pii_change(p_target_table, ...)` — **PARTIALLY CLOSED, DOWNGRADED P1 → P2** (V-20: PUBLIC revoked, no anon access; but `authenticated` still has EXECUTE — should only be invoked from triggers)
- `suppress_unsubscribed_recipients()` — **PARTIALLY CLOSED, DOWNGRADED P1 → P2** (V-20: PUBLIC revoked; `authenticated` still has EXECUTE on trigger function)

NOT findings (intentional):
- `get_invitation_by_token(p_token)` — PUBLIC EXECUTE BY DESIGN (anon invite redemption)

RLS coverage: 65/65 public tables enabled. Status of batched RLS migration PR: **4 of 6 fully closed; 2 of 3 P1s downgraded to P2** (PUBLIC/anon surface fully closed; authenticated-still-can-call surface remains).

#### §4.M.5 — Phase 5 (Type / Contract): 4 NEW orphan renderers + 1 P1 (UNSHIPPED)

Phase 5 expanded the orphan renderer count from 3 → 7. Total 7 orphan section kinds across 4 briefing kinds (rsvp_nudge, academy_callup_notice, tournament_recap, suspected `family` site).

P0-LATENT additions (beyond Phase 2):
- `callup_card` — academyCallupNotice.js:117
- `coach_reflection` — tournamentRecap.js:120
- `standout_moments` — tournamentRecap.js:119
- `family` — academyCallupNotice.js:54 (needs verification)

P1: `TournamentRecapBody.jsx` defaultValue lacks `standout_moments` + `coach_reflection` keys. Composer falls through to undefined; latent UX bug on first real tournament_recap use. **VERIFIED SHIPPED** via V-21 (2026-05-18 19:50Z): defaultValue now has both keys plus 2 additional (`coach_note`, `parent_shoutout`).

Combined fix scope (Phases 2 + 5): 7 new renderer files (~30-50 lines each) + composer.js registration. ~250-350 lines total. Substantial but mechanical. Splittable into 2-3 PRs by briefing kind (rsvp_nudge / academy_callup / tournament_recap) per Phase 5 trade-off note. Verify via V-21.

RESOLVER_REGISTRY contracts: PASS. composerSubmit dispatch: PASS.

#### §4.M.6 — Phase Beta carryovers (deferred from May 16 audit)

Per `AUDIT_BETA_SYNTHESIS_2026-05-16` synthesis. Items NOT shipped in the Beta PR set (#210-#215). Each is a candidate cleanup item:

- ~~**27 `.maybeSingle()` no-error-destructure callsites** (P1)~~ — **CLOSED via PR #249** (2026-05-18 21:05Z). All 27 fixed with explicit error destructure + throw; static-grep audit test locks the invariant per #43. Anti-pattern #36 follow-through complete.
- useWeather localStorage fallback persists across users (P2)
- BriefingComposer state doesn't reset on orgId change (P2)
- useHasUnread channel name 'unread-badge' is global (P2)
- RecordsPage.jsx game_results count cross-org (P2)
- useAcademyCallupCandidates lacks useAuth context (P2)
- 2 FKs without CASCADE — org_id, player_of_game_id (P2; non-actionable today per audit)
- briefing_templates.org_id nullable (P2; table empty)
- Legacy renderer dead code removal (P2; overlaps with §4.M.2 P1)
- Anti-patterns #37 + #38 CLAUDE.md additions (CLOSED — #37/#38 are now registered in CLAUDE.md as of recent sessions)

Bundle these into the Tier 4 P2 cleanup batch (§4.L).

#### §4.M.7 — Phase 1 ledger contract gates for Monday Phase 2-5

Per Monday-opener routing locked Sunday 2026-05-18: Phase 1 = COMPLETE (this entry). Phase 2-5 deferred pending Frank's gate decision.

Findings count from Phase 1 Core Subset: **30+ items across 5 audit phases + Beta synthesis carryovers**.

**Status break (post V-17/V-18/V-19/V-21 closure 2026-05-18 19:50Z):**
- **VERIFIED SHIPPED: ~18-20 items** (Phase 1 P0/P1 batch via #195+#203 + Phase 3 P0 mirror + Phase 2/5 orphan renderers 6-of-7 + Phase 5 TournamentRecapBody defaultValue + Beta PRs #210-215)
- **UNSHIPPED + UNKNOWN-STATUS: ~10-12 items** (Phase 4 RLS 3 P0 + 3 P1 GATED; Phase 1 remaining P1 wildcards; Phase 2 P1 dead code + legacy enums; Beta `.maybeSingle()` sweep; ghost migrations P1; family orphan if real)

The major reframe from these verifications: **§4.M is mostly CLOSED, not mostly open.** The Phase 5 worry about "250-350 lines of new renderer code remaining" was wrong — that work shipped in PRs we hadn't cross-referenced.

V-20 (Phase 4 RLS migration status) + V-22 (Beta `.maybeSingle()` sweep) deferred to Monday — both require more substantial DB / per-callsite work than the end-of-day window allows.

### §4.N — Two-Week L99 Audit (May 4 → May 18, scheduled Monday 2026-05-19)

**Meta-audit lock.** Designed Sunday evening 2026-05-18 to close the question "have we caught everything from the last two weeks?" by closing each blind-spot class the prior audits sampled but didn't fully cover. Locked tonight per anti-pattern #45 acid-test (structural plan designed in chat owes ledger reconciliation in the same session). Captured here so commitment survives the sleep cycle and the Monday-opener prompt can be rewritten Monday morning with this scaffolding instead of being reconstructed from chat memory.

**Why a five-layer audit instead of another shape:** every prior audit was bounded by what it opened (the 22-doc gap that produced V-0 is the canonical example). The five layers below each close a specific class of miss the prior audits couldn't see:

| Layer | Catches | Source of truth | Effort | Order |
|-------|---------|-----------------|--------|-------|
| **Layer 1 — Git log cross-reference** | PRs landed but never reconciled to ledger · PRs opened but never merged · direct-to-main commits bypassing PR review | `git log --since="2026-05-04" --pretty=format` cross-ref against §1 (shipped) + §4 (pending) | 20-30 min | first (factual ground truth) |
| **Layer 2 — Doc-diff sweep** | Docs created or modified in window not yet reconciled to ledger (the BETA/PHASE/SYNTHESIS class — V-0 caught some of these, this layer closes the remainder bounded by date) | `ls docs/*.md` filtered to mtime > May 4 → per-doc summarize + identify named bug/enhancement/decision not in §1 or §4 | 45-60 min | fourth |
| **Layer 3 — Chat transcript scan + recent_chats walk** | Decisions made in chat that were never written down · code drops promised in chat never shipped · bugs flagged in chat never logged | Frank-side `conversation_search` (targeted queries: "decision locked", "park this", "queued for next session", "remind me to", "TODO") **PLUS sequential `recent_chats` walk over the 2-week window** for maximum reasonable confidence | 45-60 min (chat-side, Frank does it) | third |
| **Layer 4 — Production verification sweep** | Features marked SHIPPED in ledger that don't actually work as advertised · migrations marked applied without expected schema state · edge functions marked deployed but failing (the PR #235 / Cluster 6.A3 class retroactively applied across every recent ship per anti-pattern #44) | Supabase MCP + Vercel MCP per-item verification on §1 SHIPPED items touched in window | 45-60 min | last (highest cognitive load) |
| **Layer 5 — 22-bug catalog walk** | Bugs from the SKYFIRE_BUILD_QUEUE_v2 KNOWN BUGS catalog silently fixed or quietly still open (closes the question raised earlier about only 4 of 22 bugs being in §15) | Each of 22 bugs gets grep + Supabase MCP probe → status: SHIPPED with evidence / OPEN with V-* / AMBIGUOUS with deeper trace needed | 20 min | second (mechanical, clears known uncertainty) |

**Layer 3 scope decision (locked tonight):** included the sequential `recent_chats` walk on top of `conversation_search`, not skipped. Reason: tonight's discovery pattern (each harder look surfaces more — 22 docs from `ls`, 6 V-* from code-drop audit, 27 callsites from V-22 sweep) signals we're not at the asymptote yet. 30-min premium on Layer 3 vs. residual chat-only drift is the right trade given Layer 3 anchors the entire "highest reasonable confidence" claim. If the walk finds nothing new, that's also useful — it validates the bound and lets us declare the asymptote.

**Execution contract (mirrors PR #243 + tonight's discipline):**

- **Branch:** `docs/two-week-audit-2026-05-04-to-2026-05-18` (root branch; per-layer feature branches off it)
- **PRs:** 5 PRs total, one per layer, squash on merge, anti-pattern #45 enforced (each layer's findings → ledger same commit)
- **Scope:** `docs/EMBER_PENDING_LEDGER.md` + `docs/CLAUDE.md` (if new anti-patterns emerge). Zero `src/` changes. Zero migrations. Pure ledger reconciliation pass.
- **Gate between layers:** after each layer's findings drop, STOP and report before next layer begins. Frank routes whether findings reshape next layer's scope.
- **Sequencing (cognitive load + dependency):** Layer 1 (git log, factual) → Layer 5 (22-bug walk, mechanical) → Layer 3 (chat scan, Frank-side parallel) → Layer 2 (doc-diff, integrates Monday-opener Phases 1-3 work) → Layer 4 (prod verification, needs everything else stable).
- **Time ceiling:** ~4 hours CC time + ~45-60 min Frank chat-side. Total ~5 hours bundled.
- **Bypass clause:** if Monday-morning Frank decides the five-layer framing is wrong on review, this entry is overridable per locked-decision protocol — amend it before the prompt drops, don't grind through a stale design.

**Replaces:** the Monday-opener Phase 1-3 sequence from V-0 + Phase 5 V-1 through V-22 batch cadence — both consolidate into Layers 2, 4, 5 of this audit. V-23 through V-28 (just landed via PR #252) consolidate into Layer 2.

**Tonight sign-off action:** this entry IS the action. Five minutes to write, mechanical, no decision burden. Per #45 acid-test the work is owed; per cognitive-load discipline the audit execution waits for Monday morning.

**Expected ledger growth post-audit:**

```
§1 SHIPPED:     +5-15 items recovered from L1 / L3
§2 active bugs: +0-5 items if L4 surfaces regressions
§4 PENDING:     +5-10 items recovered from L2 / L3
§15 VERIFY:     +18-22 items from L5, +5-10 from L4
```

Estimate 30-50 net new ledger entries. Most are recovery (documenting what already exists), not new work. The number frames the audit as completeness-confirmation, not feature-discovery — useful for sizing the post-audit reconciliation PR cadence and for setting expectations on what Monday's output volume looks like.

**Sign-off conditions:**

- All 5 layer PRs merged with anti-pattern #45 compliance (each layer's findings → ledger same commit as the layer-PR)
- §15 verification queue closed for any item run in L4 or L5 (open V-* either CLOSED with evidence or re-scoped with named follow-up)
- Findings count + ledger-growth report posted in chat (compare actual vs. expected growth above to validate the 30-50 estimate as calibration data for future audit-cycle sizing)
- Strategic arc routing decision becomes the next session focus (i.e., once the retroactive sweep closes, the next session's first move is choosing the next forward arc, not relitigating the audit findings)

**Anti-pattern #46 candidate:**

If §4.N execution surfaces a durable rule, register: *"Audit cycles spanning 2+ weeks require date-bounded retroactive completeness sweep before sign-off."*

Origin case: 2026-05-18 session-end discovery that prior audits sampled cross-sections; no single method caught everything. Five-layer design exists because each layer is the structural inverse of a documented blind spot. If the layered pattern repeats successfully on a future 2-week window (catches a meaningful number of items the prior audits missed AND the time-cost stays under ceiling), the candidate promotes to registered anti-pattern.

Layer 3 scope confirmed locked Sunday 2026-05-18 (Option α): sequential `recent_chats` walk **INCLUDED**, not optional. Reasoning trail in §4.N main body — the audit exists to close the completeness question; an optional Layer 3 walk recreates exactly the ambiguity the audit is built to eliminate. Anti-pattern #44 framing also applies: trace the full pipeline before ruling out completeness; optional means stopping at the gate instead of tracing.

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
  all-clear pill (covers Cluster 6 A2 hypothesis; A3 closed via PR #241)
- **Async-ordering tests for all home-page hooks** — pattern
  established in `useAlertEvaluator.loadingGate.test.js` via PR #241
  (paused promise resolvers pin the hook mid-flight). Replicate for
  `useAdminStats`, `useHomeRole`, `useAttendanceData`, `useActivities`.
  Each should assert: loading=true persists until canonical data
  resolution; no early loading=false on an intermediate state. This
  is the operational follow-through on anti-pattern #44 (candidate).
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
2. Cross-check with `STATE_OF_AFFAIRS_L99_v5.md`
3. Confirm `git fetch + branch divergence` per anti-pattern #35
4. Apply ground-truth tables (§11.5 CLAUDE.md) and canonical hooks
   (this doc §5) to any code being touched

---

## 15. VERIFICATION QUEUE

Items flagged uncertain during the 2026-05-18 L99 audit expansion
(commit 1 of PR #243). Each row needs a focused verification pass
before the corresponding §4 entry can be marked closed or
re-scoped. Verification methods specified per row so the work is
mechanical, not interpretive.

### V-0 — Meta: audit completeness (the gap that produced this queue)

**Status: SURFACED 2026-05-18 19:50 CEST, Monday-opener prompt drafted, deferred to Monday Phase 1-4 execution.**

The L99 audit + missed-builds audit + §4 expansion across PRs #238 / #242 / #243 were bounded by the 7 source docs CC opened. Frank's session-end `ls docs/*.md` check (Sunday 7:50 PM Italy) surfaced 22 additional `.md` files CC never read. Total `docs/*.md` = 30; CC's source list = 7; ledger itself = 1; unread = 22.

Per anti-pattern #45 acid-test: V-0 closes "complete inventory" from a verified claim back into a sized gap that gets walked Monday.

**Inventory of 22 unread docs (captured for Monday-opener input):**

| Category | Doc | Why flagged |
|---|---|---|
| May 16 audit-cycle (single multi-phase unit, read in order) | AUDIT_PHASE1_WIRING_2026-05-16.md | Earliest phase doc |
| | AUDIT_PHASE2_REGISTRY_STATE_2026-05-16.md | Phase 2 |
| | AUDIT_PHASE3_MIGRATION_DEPLOY_2026-05-16.md | Phase 3 |
| | AUDIT_PHASE4_RLS_SECURITY_2026-05-16.md | Phase 4 |
| | AUDIT_PHASE5_TYPE_CONTRACT_2026-05-16.md | Phase 5 |
| | AUDIT_BETA_B1_UI_LAYER_2026-05-16.md | Beta phase B1 |
| | AUDIT_BETA_B3_EDGE_FUNCTIONS_2026-05-16.md | Beta phase B3 |
| | AUDIT_BETA_SYNTHESIS_2026-05-16.md | Beta synthesis (likely 22-bug catalog home) |
| | AUDIT_SYNTHESIS_2026-05-16.md | Top-level synthesis (CC grepped excerpts only) |
| | AUDIT_DAY_2026-05-16_CLOSE.md | Earlier close (CC read only FINAL_CLOSE) |
| | AUDIT_VERIFICATION_2026-05-16.md | Verification doc |
| Partial-read (highest-confidence "something there") | SCHEDULE_CHANGE_DIAGNOSIS.md | Cited in §4.I but never opened (cite-without-read anti-pattern) |
| | BRIEFINGS_COVERAGE_L99.md | CC head-50 read only |
| Unknown-shape | ADMIN_SESSION_SCOPE.md | Possible session scope spec |
| | BRIEFING_RENDERER_REFERENCES.md | Briefing system reference |
| | BRIEFING_TEMPLATES.md | Briefing template inventory |
| | CALLUP_TOKEN_TESTING.md | Callup token test plan |
| | EMBER_TENANCY_ARCHITECTURE_v3.md | Tenancy architecture spec |
| | LH_BRAND_CONTENT_MODEL.md | Brand content model |
| | LH_OPS_SPEC.md | Operations spec |
| | README.md | Top-level doc readme |
| | TIER_3_V1_RETROSPECTIVE_NOTES.md | Created via PR #236; CC touched but didn't audit for §4-relevant items |

**Monday-opener prompt (locked Sunday 2026-05-18, executes 2026-05-19):**

Phase 1 — May 16 audit-cycle unit (~45-60 min, gated). Read in phase order:
PHASE1 → PHASE2 → PHASE3 → PHASE4 → PHASE5 → BETA_B1 → BETA_B3 → BETA_SYNTHESIS → AUDIT_SYNTHESIS (full read) → DAY_CLOSE → VERIFICATION → reconcile FINAL_CLOSE. Findings → ledger same commit per #45.

Phase 2 — Flagged partial-read (~20-30 min, gated):
SCHEDULE_CHANGE_DIAGNOSIS full read · BRIEFINGS_COVERAGE_L99 full read · AUDIT_SYNTHESIS full read (may overlap Phase 1).

Phase 3 — Unknown-shape (~30-45 min, gated):
Triage by filename pattern (`*_DESIGN_SPEC` / `*_HANDOFF` / `*_AUDIT` / `*_RETRO` → full read; other → 30-sec header scan, full read only if signal present).

Phase 4 — Reconcile 22-bug catalog (~15-20 min, gated):
If Phase 1 surfaced the missing 18 bugs (likely in BETA_SYNTHESIS or PHASE docs), walk each: grep git log + relevant component file for fix evidence. Evidence → CLOSED in §15 with SHA; no evidence → V-17 through V-38 with named verification method; ambiguous → V-* "needs deeper trace."

Phase 5 — V-1 through V-16 (the queue below) executes ONLY after Phases 1-4 gate-pass.

**Standing rule (anti-pattern #45)**: every findings batch from Phases 1-4 → ledger same commit.

**Anti-pattern #46 candidate (not registered tonight)**: "Audit-cycle outputs (multi-phase Frank audits like the May 16 series) must land in EMBER_PENDING_LEDGER §4/§15 within 24 hours of cycle close, or the cycle isn't closed." Re-evaluate Monday post-Phase-1 once we see how much surfaces. If Phase 1 surfaces 10+ unlanded items, #46 becomes near-term priority.

### V-1 through V-16 (executed Monday Phase 5)

| # | Item | Arc tag | Source doc | Effort | Blocking | Verification method |
|---|------|---------|------------|--------|----------|---------------------|
| V-1 | Migration 016 (`user_preferences`) ship status | §4.H | SKYFIRE_BUILD_QUEUE_v2 | 5 min | density toggle wiring | `ls supabase/migrations/ \| grep 016` + DB inspect via MCP |
| V-2 | Migration 018 (team_achievements) ship status + UI presence | §4.C (Sprint C RECOGNITION) | SKYFIRE_BUILD_QUEUE_v2 | 10 min | RECOGNITION card | `ls supabase/migrations/ \| grep 018` + `grep team_achievements src/` |
| V-3 | Migration 021 (data corrections bundle) ship status | §2 Cluster 1.1 + §4.C | SKYFIRE_BUILD_QUEUE_v2 | 5 min | 10U Blue mis-tagged event fix | `ls supabase/migrations/ \| grep 021` + DB inspect |
| V-4 | BUG-001 closure (Admin home Next Up data) | §4.E | SKYFIRE_BUILD_QUEUE_v2 | 15 min | confirms §4.E closure | Manual smoke on AdminHome NextEventCard + code-grep for null-handling |
| V-5 | BUG-002 closure (`useEventDutyCounts.js`) | §4.E | SKYFIRE_BUILD_QUEUE_v2 | 10 min | confirms §4.E closure | Code read + unit test pass |
| V-6 | BUG-003 closure (`useEventRideCounts.js`) | §4.E | SKYFIRE_BUILD_QUEUE_v2 | 10 min | confirms §4.E closure | Code read + unit test pass |
| V-7 | BUG-004 closure (RideFormOverlay guard) | §4.E | SKYFIRE_BUILD_QUEUE_v2 | 10 min | confirms §4.E closure | Code read for DB CHECK or frontend guard |
| V-8 | Sprint D Coach home completeness vs Tier 3 v1 | §4.C | HOME_DESIGN_SPEC.md | 20 min | Sprint D close-out | Read `HOME_DESIGN_SPEC.md §2` + diff against CoachHomePage.jsx |
| V-9 | Sprint E Admin home completeness vs Tier 3 v1 | §4.C | HOME_DESIGN_SPEC.md | 20 min | Sprint E close-out | Read `HOME_DESIGN_SPEC.md §3` + diff against AdminHomePage.jsx |
| V-10 | Density toggle wiring state | §4.H | SKYFIRE_BUILD_QUEUE_v2 | 10 min | Sprint B close-out | `grep -rn 'useDensity\|density_level' src/` + Migration 016 status |
| V-11 | TournamentDetailPage briefing surface state | §4.B | this audit | 5 min | §4.B TournamentHeader fix scope | `grep -n briefing src/pages/TournamentDetailPage.jsx` (already verified: no direct refs; only via TournamentHeader) |
| V-12 | `/admin/import-schedule` route partial status | §4.A PR 2 | this audit | 5 min | parser PR scope | `grep -rn 'import-schedule' src/` + route map |
| V-13 | HOME_DESIGN_SPEC.md detail extraction | §4.C | docs/HOME_DESIGN_SPEC.md | 30 min | Sprint B-F scoping | Read top-to-bottom; populate §4.C with named tasks |
| V-14 | RIDES_DESIGN_SPEC.md detail extraction | §4.D | docs/RIDES_DESIGN_SPEC.md | 30 min | Sprint G scoping | Read top-to-bottom; populate §4.D with named tasks |
| V-15 | EMBER_MASTER_INDEX_v3 reconciliation | §4.H | (file missing) | 60 min | locked-decisions catalog | Rebuild from session notes OR accept distributed-decisions model |
| V-16 | Tier 4 P2 specific items | §4.L | AUDIT_SYNTHESIS_2026-05-16 | 30 min | cleanup batch scoping | Read synthesis doc + enumerate P2 entries |
| V-17 | Phase 1 P0 batch ship status (EventLocationTab + send-tournament-message) | §4.M.1 | AUDIT_PHASE1_WIRING_2026-05-16 | 5 min | confirm 2 of 30+ items closed | **CLOSED 2026-05-18 19:50Z** — PRs #195 (P0-1 + P1-1 + P0-2) + #203 (P1-2 + P1-7) shipped. Code-grep confirmed: `EventLocationTab.jsx` locations query has `.eq('org_id', orgId).is('archived_at', null)`; tournaments query has `.eq('org_id', orgId)`; `send-tournament-message/index.ts` guardians query has `.eq('org_id', message.org_id)`. |
| V-18 | Phase 2 + Phase 5 orphan renderer status (7 P0-LATENT) | §4.M.2 + §4.M.5 | AUDIT_PHASE2 + AUDIT_PHASE5 | 10 min | sizing the 7-renderer arc | **6 of 7 CLOSED 2026-05-18 19:50Z** — `ls src/lib/engine/renderers/` confirms: eventCard.js · placementBlock.js · gameLog.js · callupCard.js · coachReflection.js · standoutMoments.js ALL EXIST. The 7th (`family`) was flagged "needs verification" in Phase 5 itself — no `family.js` renderer; was likely never a real emit site (Phase 2A agent claimed it was a nested data carrier, contested by Phase 5 without resolution). LIKELY a Phase 5 false positive. |
| V-19 | Phase 3 P0 mirror drift ship status (scheduleGaps.js ↔ _scheduleGaps.ts) | §4.M.3 | AUDIT_PHASE3_MIGRATION_DEPLOY | 5 min | confirm closed | **CLOSED 2026-05-18 19:50Z** — both source and Deno mirror have `describeScheduleGaps(events, { minGapMinutes = MIN_GAP_MINUTES } = {})` signature and `if (gap >= minGapMinutes)` gate. Mirror in sync. Header comment on Deno side explicitly notes the parity. |
| V-20 | Phase 4 RLS migration ship status (3 P0 + 3 P1 batched) | §4.M.4 | AUDIT_PHASE4_RLS_SECURITY | 10 min | confirm RLS hardening closed | **4 of 6 CLOSED 2026-05-18 20:30Z (P0s ALL CLOSED, P1s mixed).** DB query confirmed: (a) all 3 P0 UPDATE policies (briefing_reminders/briefing_templates/team_types) have matching `with_check_expr` — anti-pattern #20 closed. (b) 1 of 3 P1 PUBLIC EXECUTE issues fully closed: `briefing_active_queue` grants service_role + authenticated + postgres (no anon, authenticated is correct since function checks admin internally). (c) 2 of 3 P1 PARTIALLY closed: `log_pii_change` + `suppress_unsubscribed_recipients` had PUBLIC revoked (no anon access) but `authenticated` still has EXECUTE — log_pii_change should only be called from triggers; suppress_unsubscribed_recipients is itself a trigger function. Downgraded P1 → P2 since PUBLIC/anon attack surface is closed. |
| V-21 | Phase 5 TournamentRecapBody defaultValue drift ship status | §4.M.5 | AUDIT_PHASE5_TYPE_CONTRACT | 3 min | confirm closed | **CLOSED 2026-05-18 19:50Z** — `TournamentRecapBody.jsx` defaultValue has `standout_moments: ''` + `coach_reflection: ''` + 2 additional keys (`coach_note`, `parent_shoutout`). Drift fixed, plus scope expanded beyond original audit. |
| V-22 | Beta `.maybeSingle()` no-error-destructure sweep status (20+ callsites) | §4.M.6 | AUDIT_BETA_SYNTHESIS | 10 min | confirm anti-pattern #36 follow-up sweep status | **CLOSED 2026-05-18 21:05Z** via PR #249 — all 27 callsites fixed with `{ data, error: <name>Err }` destructure + `if (<name>Err) throw <name>Err;` pattern. Static-grep audit test added at `src/lib/__tests__/maybeSingleErrorAudit.test.js` per anti-pattern #43 — locks pattern-A regex against re-introduction. Anti-pattern #36 fully closed in `src/`. |

### V-23 through V-28 (2026-05-18 evening "code-drop audit" surfacing)

Surfaced by Frank's session-end audit (Sunday 2026-05-18, late evening Italy time) cross-referencing pre-v2-retirement chats and prompt docs against actual code/migration evidence. These items represent **potential missed code drops** — work that was either spec'd in a handoff doc or prompted in a build sprint, but where ship evidence has not been re-verified post-main-merge / post-L99 audit cycle.

Registered here under anti-pattern #45 acid-test: a new audit surfaced new pending items, so the reconciliation is owed in the same session as a ledger amendment PR (this PR). Verification methods are mechanical (grep + git log + spec-doc walk), not interpretive.

| # | Item | Arc tag | Source doc / chat | Effort | Blocking | Verification method |
|---|------|---------|-------------------|--------|----------|---------------------|
| V-23 | M2-2 iCal subscription URL per team ship status | §4.B (calendar/iCal feeds) | CC_SESSION_HANDOFF_APR19.md (referenced; full read pending) | 10 min | iCal feed surface for parents/coaches | `grep -rn 'ical\|webcal\|\.ics\|tournament_feed' src/ supabase/functions/` + check route map + look for `team_feed_token` or similar share-URL columns on `teams` |
| V-24 | EMBER_TENANCY Steps 5-14 completion vs Steps 1-4 closed | §4.H (pre-existing locked items) | EMBER_TENANCY_ARCHITECTURE_v3.md + April 25 chat handoff | 20 min | tenancy hardening arc | Read EMBER_TENANCY_ARCHITECTURE_v3.md (currently in V-0 unread set) + `git log --oneline --all \| grep -iE 'tenan\|ember.tenancy'` + verify Steps 5-14 line items against shipped commits |
| V-25 | Rides remediation 7.6-7.10 ship status | §4.D (Sprint G Rides redesign) | RIDES_DESIGN_SPEC.md §7.6-7.10 + April 29 Rides Fix chat | 15 min | Sprint G Rides arc completeness | Read RIDES_DESIGN_SPEC.md §7.6-7.10 (full read pending per V-14) + `git log --oneline --all -- src/components/ride src/hooks/useRide* src/hooks/useEventRide*` cross-ref |
| V-26 | PROMPT_ELITE_POLISH.md outcome | §4.G (quick wins / Elite polish) | docs/PROMPT_ELITE_POLISH.md (April 10-13 build sprint) | 15 min | Elite Polish arc completeness | Read PROMPT_ELITE_POLISH.md top-to-bottom + cross-ref ELITE-* tags against CLAUDE.md §16 + git log for sprint commits |
| V-27 | PROMPT_FUNCTIONAL_FEATURES.md (ToastContext + usePullToRefresh) ship status | §4.G | docs/PROMPT_FUNCTIONAL_FEATURES.md (April 13 chat) | 10 min | functional-features arc | `grep -rn 'ToastContext\|usePullToRefresh' src/` (both already shipped per repo state — confirm scope matched prompt doc) + read prompt doc for any unshipped sub-items |
| V-28 | PROMPT_NEXT_LEVEL.md outcome | §4.G | docs/PROMPT_NEXT_LEVEL.md (April 10-13 build sprint) | 15 min | next-level features arc | Read PROMPT_NEXT_LEVEL.md top-to-bottom + git log cross-ref for shipped sub-items + flag any unshipped items to §4.G as concrete tasks |

Total estimated verification effort: ~7-8 hours when bundled (with V-17 through V-22 additions +1 hour, V-23 through V-28 additions +1.5 hours).
Recommended cadence: batch V-1 through V-7 + V-17 through V-21 (Migrations + BUGs + Phase 1/3 ship-status confirms, ~1.5 hours) as the first Monday pass — these are the highest-value unknowns AND closable with grep/DB queries. V-8 through V-14 + V-27 (~3 hours) as a focused mid-Monday session — these include spec-doc deep reads that benefit from sustained focus. V-15 + V-16 + V-22 + V-23 through V-26 + V-28 (~3 hours) as a separate "rebuild + tidy" pass when energy is low — these are mostly read-and-flag with low decision burden.
