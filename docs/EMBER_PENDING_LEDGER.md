# EMBER Pending Ledger

> Living source of truth for everything in-flight on the Skyfire / Ember
> platform. CC + chat both read this at session start to avoid
> re-discovery. Updated per session and per PR.
>
> Created: 2026-05-18 (Italy CEST) from L99 cross-role audit consolidation
> Last updated: 2026-05-22 (§4.AA followup reconciliation against 7 PRs #467-#473 from extended session 2026-05-22; total 19 PRs)

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

### Session 2026-05-21 — L99 platform-wide audit + Teams arc + session-cleanup wave (49 PRs)

Categories preserve dispatch arcs (Phase 1 platform audit → Teams →
Phase 5 micro-fixes → perf-pass → a11y polish → session-cleanup →
discipline lock → foundation #36 sweep → edge function #36 sweep →
header bell + RequireAuth → relkind audit migrations → team-feed RFC
5545 → #36 audit test → SECDEF helper library → messaging P0 cluster).

#### Phase 1 platform-audit-v2 (PRs #410-#418)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #410  | 2026-05-21 | Hook anti-pattern #48 dead `foreignTable .order` cleanups (PR γ)   | useOrgTeamRecords + useTeamGamesByTournament |
| #411  | 2026-05-21 | Page tap-target fixes — 3 surfaces to §7 44px (PR β)               | Messages + FinancialDashboard + ImportSchedule |
| #412  | 2026-05-21 | Hook anti-pattern #36 batch — 6 violations (PR α)                  | useCoachHomeSignals + useGameResultsMap + useKindUsage + usePrefetchChildRsvps + useUnreadCounts + useBriefingFilters |
| #413  | 2026-05-21 | L99 platform audit v3 — claude.ai v2 review refinements            | Docs                |
| #414  | 2026-05-21 | CLAUDE.md amend #49 + add #50/#51 candidates + §16.15              | Docs + doctrine     |
| #415  | 2026-05-21 | gitignore `.claude/` worktree storage                              | Repo hygiene        |
| #416  | 2026-05-21 | BriefingsInboxPage loading-gate gap (PR δ; P0 closed)              | Briefings inbox     |
| #417  | 2026-05-21 | Teams PR A — stop-the-bleeding (B1 + B2 + B3 + B4)                 | Team detail / Heatmap |
| #418  | 2026-05-21 | Teams PR D — data-layer hardening                                  | Teams data layer    |

#### Teams arc + cleanup (PRs #419-#425)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #419  | 2026-05-21 | Teams PR B — hero card consolidation (TeamDetailHero)              | Team detail         |
| #420  | 2026-05-21 | Edge function mirror byte-compare audit (Platform PR ζ; CI-enforced #30) | Edge functions |
| #421  | 2026-05-21 | Engine fragility cleanup E1 + E2 (Platform PR ε)                   | Engine send helpers |
| #422  | 2026-05-21 | Mirror drift cleanup — 4 pairs closed (102 → 17 TS-only residuals) | Edge functions      |
| #423  | 2026-05-21 | Teams PR C — polish + cleanup + dead-feature retirement (anti-pattern #51 candidate, second instance) | Team detail / Player rows |
| #424  | 2026-05-21 | Home-page preemptive split per PQ3 — 3 pages, 9 sub-components     | Home pages          |
| #425  | 2026-05-21 | L99 audit arc closure addendum (Teams + platform)                  | Docs                |

#### Phase 5 micro-fixes (PRs #426-#434)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #426  | 2026-05-21 | callup-handler `alts` parameter for rsvp-handler parity            | Edge functions      |
| #427  | 2026-05-21 | Button sm tap target + PublicSchedulePage RLS comment-pin          | Shared Button + Public schedule |
| #428  | 2026-05-21 | Teams A3 aria-labels + C2/C7 perf-pass (Teams Phase 5)             | Team detail a11y + perf |
| #429  | 2026-05-21 | Extract RideIndicator + DutyBadge (component cleanup arc start)    | Shared components   |
| #430  | 2026-05-21 | V5 Pulse grid horizontal scroll indicator                          | TeamHeatmap         |
| #431  | 2026-05-21 | CLAUDE.md register anti-pattern #52 candidate (worktree-path)      | Docs + doctrine     |
| #432  | 2026-05-21 | Extract ModalBackground from 4 centered-modal callsites (L99 P2.5 D3) | Shared modals    |
| #433  | 2026-05-21 | ScopeChoiceDialog backdrop canonical rgba(0,0,0,0.3)               | Event scope dialog  |
| #434  | 2026-05-21 | Schedule perf — lift useNow into ScheduleListSections slot         | Schedule list       |

#### Perf-pass on hot pages (PRs #435, #437)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #435  | 2026-05-21 | Extract `<Badge variant='pill'>` (PQ7 cleanup continuation)        | Shared Badge        |
| #437  | 2026-05-21 | Event detail perf — lift useNow into EventLocationSlot + memo stable children | EventDetailPage |

#### A11y polish (PRs #436, #438)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #436  | 2026-05-21 | aria-label on TeamHeatmap container (A11y P2)                      | TeamHeatmap         |
| #438  | 2026-05-21 | FormGuide + TeamAccordion + RecordsPage + BriefingComposer a11y polish | 4 surfaces      |

#### Session-cleanup wave (PRs #439-#442)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #439  | 2026-05-21 | 2 tap-target regressions introduced in PR #423                     | Teams PR C followup |
| #440  | 2026-05-21 | Delete DutyBadge orphan (anti-pattern #42)                         | Shared cleanup      |
| #441  | 2026-05-21 | Consolidate 3 player-sort impls into pure helper (anti-pattern #42) | Player sort        |
| #442  | 2026-05-21 | Team-pulse — drop misleading 'Not enough data yet' qualifier       | TeamPulseHeader     |

#### Discipline-lock CLAUDE.md amendments (PR #443) + ErrorBoundary §16.10 exemption (PR #444)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #443  | 2026-05-21 | Bundle 7 discipline amendments from session 2026-05-21             | Docs + doctrine     |
| #444  | 2026-05-21 | Document ErrorBoundary §16.10 bundle-budget exemption              | Docs + doctrine     |

#### LoginPage combo (PRs #445, #447) + foundation aria-live (PR #446)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #445  | 2026-05-21 | Lock LoginPage brand-reset behavior per #43 invariant              | LoginPage           |
| #446  | 2026-05-21 | Foundation aria-live sweep — toast, offline banner, unread badge   | Foundation a11y     |
| #447  | 2026-05-21 | LoginPage #36 destructure + REDIRECT_ALLOWLIST admin route expansion | LoginPage         |

#### Foundation #36 sweep (PR #448) + Header bell + RequireAuth (PR #449)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #448  | 2026-05-21 | Foundation bundle — 5 anti-pattern #36 destructure-without-error fixes | Foundation hooks |
| #449  | 2026-05-21 | Header — remove duplicate bell + lock role-resolution contract     | Header + RequireAuth |

#### relkind verification migrations (PRs #450, #451)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #450  | 2026-05-21 | Migration audit relkind='r' filter on player_game_stats RLS check  | DB / migrations     |
| #451  | 2026-05-21 | Migration audit relkind='r' filter on team_types RLS check         | DB / migrations     |

#### Edge function #36 sweep (PR #452) + team-feed RFC 5545 (PR #453)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #452  | 2026-05-21 | Bundle anti-pattern #36 destructure-without-error sweep (edge functions) | Edge functions |
| #453  | 2026-05-21 | Team-feed bound events query + RFC 5545 ICS compliance             | team-feed edge function |

#### #36 audit test (PR #454) + SECDEF helper library (PR #455)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #454  | 2026-05-21 | Static-grep gate for anti-pattern #36 destructure-without-error    | Audit tests         |
| #455  | 2026-05-21 | `assert_org_owns_*` SECDEF helper library for cross-org validation | DB security helpers |

#### Messaging P0 cluster (PRs #456, #457)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #456  | 2026-05-21 | P0 — NewDmPicker query nonexistent `org_members` table             | Messaging DM picker |
| #457  | 2026-05-21 | P0 — useDmThreads `otherName` mislabels partner as self            | Messaging DM thread |

49-PR session. L99 platform-wide audit (14 batches dispatched +
executed, ~204 findings) + Teams arc close + session-cleanup wave +
2 P0 messaging fixes at session-end. See §4.Z for the
audit-findings synthesis and §4.X (closed) + Teams §4.U (closed)
for arc-level closure narratives.

### Session 2026-05-22 — discipline-validating wave + extended dead-feature retirement + Phase 3 close (19 PRs total)

Original 7-PR discipline-validating window (PRs #458-#464) opened the
session. Extended into a 19-PR wave with Phase 2 dead-feature
retirement (PRs #465-#471), Phase 3 design-call closures (PRs #472,
#473), and ledger reconciliations (PR #466 + this followup PR).
Categories: catalog amendments + advisor hygiene + ledger
reconciliation (yesterday) + Cluster 1 closure + Cluster 3 closure
(#36 hooks cascade across PR-A/B/C) + anti-pattern #51/#52/#54
promotions + dead-feature retirement sweep + SECTION_RENDERERS
orphan deletion + dual-compose / fan-out deferral comments.

#### Catalog amendments + advisor hygiene + yesterday ledger (PRs #458-#460)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #458  | 2026-05-22 | CLAUDE.md register anti-patterns #55-#59 + RLS auth.uid() wrapper  | Docs + doctrine     |
| #459  | 2026-05-22 | Close 2 P3 hygiene followups from PR #450 + #451 (advisor cleanup) | DB / migrations     |
| #460  | 2026-05-22 | §4.Z reconciliation against 49 PRs from session 2026-05-21         | Docs                |

#### Cluster 1 closure (PR #462) + Cluster 3 #36 hooks cascade (PRs #461, #463, #464)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #461  | 2026-05-22 | Close 6 P1 anti-pattern #36 sites — Cluster 3 PR-A                 | Hooks (high-priority) |
| #462  | 2026-05-22 | P0 — academy-callup picker flow bypasses registry, ships without tokens | Academy callup (Cluster 1 P0) |
| #463  | 2026-05-22 | Close 5 P2 anti-pattern #36 sites — Cluster 3 PR-B realtime + ride | Realtime + ride hooks |
| #464  | 2026-05-22 | Close ~6 anti-pattern #36 sites — Cluster 3 PR-C legacy sweep      | Legacy hooks        |

7-PR session. Discipline-validating shape: pre-flight (Section 9.1
three-item opener) ran cleanly at session-open AND session-restart;
contract (max 7-8 PRs, no new audits) held; anti-pattern #54
(same-MCP-burst) held 7/7; anti-pattern #55 (use actual PR# from
create_pull_request response) held 7/7; anti-pattern #52 (worktree
path) held 7/7 with refinement surfaced. Audit cycle did not
self-generate. See §4.AA for the close synthesis + Cluster 1 +
Cluster 3 closures + Pattern ALPHA hooks-half closure.

#### Catalog promotions + first ledger reconciliation (PRs #465, #466)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #465  | 2026-05-22 | CLAUDE.md: #52 refinement + #51 + #54 promotions to registered     | Docs + doctrine     |
| #466  | 2026-05-22 | §4.AA reconciliation against 7 PRs from session 2026-05-22         | Docs                |

#### Phase 2 dead-feature retirement sweep — anti-pattern #51 (PRs #467-#471)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #467  | 2026-05-22 | Delete TeamPlayerStats + PlayerStatsTable orphans (Phase 2.2b)     | stats/ (-119 lines) |
| #468  | 2026-05-22 | Delete InstallPrompt + WelcomeOverlay dead stubs (Phase 2.2c)      | home/ (-18 lines) — first #54 break in 22+ holds, manually flipped ready |
| #469  | 2026-05-22 | Delete 5 event/ orphan files per #51 retirement (Phase 2.2a)       | event/ (-285 lines, RsvpSummaryBlock + EventDetailTab + EventCancelActions + MyActionsSection + AcademyActivationPanel + Badge.test.jsx INLINE_REMAINING) |
| #470  | 2026-05-22 | Remove useSortedPlayers dead export (Phase 2.2d)                   | hooks/ (-7 lines, anti-pattern #42 zero-consumer detection) |
| #471  | 2026-05-22 | Delete legacy renderers/scheduleChange.js (Phase 2.2e)             | engine/ (-219 lines, name-collision trap eliminated; active composer at resolvers/scheduleChange.js) |

#### Phase 3 design-call closures — SECTION_RENDERERS orphans + dual-compose deferral (PRs #472, #473)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #472  | 2026-05-22 | Delete 8 SECTION_RENDERERS orphans — Phase 3 Q4                    | engine/ (~24 files, -651 lines; wave 3 build-ahead never adopted, Option A locked routing) |
| #473  | 2026-05-22 | Q5+Q7 deferral comments for dual-compose + schedule_change fan-out | engine/ (2 files, +24 lines, Pattern B locked routing) |

19-PR session total. Original 7-PR discipline window held cleanly;
extended wave engaged Phase 2 (dead-feature retirement after #51
promotion) + Phase 3 (Q1/Q4/Q5/Q6/Q7 design calls). 12 of 19 PRs
were file-deletion sweeps: total ~1300 lines retired across orphan
components, renderers, hooks, and section types. Anti-pattern #54
broke once (PR #468 shipped draft initially, manually flipped) —
first break in 22+ consecutive holds. Anti-pattern #52 refinement
broke once mid-flight (PR #473 parent-checkout leakage detected
post-merge). See §4.AB for the extended close synthesis (Phase 2 +
Phase 3 closure status) and §5 for watch-list status on #52 + #54.

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
- Status: **RESOLVED (render layer)** via PR #298 (2026-05-19); Migration 021 (data hygiene) still queued
- Severity: LOW (data hygiene)
- Examples found in production:
  - "9U Boys Game" (team name embedded as title)
  - "10U Blue · 6th Boro 4AB · May Reschedule"
  - "10U Blue · Holy Family-NR · May Reschedule"
- Root pattern: ad-hoc free-text edits to `event.title` during reschedule + event creation workflows. No constraint on what gets stored in the title field.
- Resolution:
  - PR #298 — `formatEventTitle` helper computes from `event.opponent` + `event.event_type` + `event.home_away`; `event.title` intentionally NOT consulted. Drift-hedge audit test locks the render invariant.
  - Migration 021 (still queued) — sanitize existing event titles in DB. Render-layer fix above neutralizes user-visible drift even before data hygiene lands.

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
- Status: **RESOLVED** via PR #298 (2026-05-19)
- Severity: MEDIUM
- Surfaces affected:
  - Coach: B2 (Schedule "vs. 9U Boys Game" vs Home NEXT EVENT "vs. 6th Boro 3AB · 9U Boys")
  - Admin: A9 (Schedule lists redundant team line below title)
  - Parent: P25 (8U Boys event detail "8U Boys Practice" with redundant "8U Boys" team line)
- Root cause confirmed: 6 surfaces composed their own title fallback (`event.title || vs. ${opponent} || typeLabel || event_type`). Some echoed free-text literal, some stripped prefixes inconsistently, some appended redundant team name.
- PR #298 resolution:
  - `src/lib/eventTitle.js` — `formatEventTitle(event)` returns `{ prefix, body }` computed from opponent + event_type + home_away. Flat-string sibling `formatEventTitleString`.
  - Migrated callsites: EventCard, NextEventCard (admin), PublicSchedulePage, + 4 ACTION ZONE hooks (usePendingRsvps, useRideNeeded, useVolunteerSlots, useLiveNowEvents).
  - Drift-hedge per #43: `eventTitleAudit.test.js` static-grep fails CI on any inline `vs. ${opponent}` recomposition outside the allowlist (ical export + briefing emit channels intentionally preserve admin-curated labels).
  - 11 unit tests cover the contract surface (home/away/neutral/tbd, missing fields, free-text rejection, unknown event_type).

### Cluster 4 — Notification bell badge has no inbox to consume it
- Status: **RESOLVED** via PR #295 (2026-05-19; resolution path (a))
- Severity: MEDIUM (UX clarity)
- Frank's clarification: bell tap routes to Settings; no actual inbox
- Surfaces affected: bell appears on all role headers — was showing "4" / "1" / "2"
- PR #295 resolution (path (a)):
  - Removed badge count entirely from `Header.jsx`; bell still routes to `/account` settings shortcut
  - Anti-pattern #42 honored: `useNotificationBadge()` hook + supporting query file deleted in the same PR (no parallel-system buildup; the hook was orphan since no inbox existed to consume it)
- Path (b) (real notification inbox) — deferred to Phase plan, not in §2 scope
- Anti-pattern #44/#45 catch (registered 2026-05-20): like Cluster 5, this §2 entry stayed stale ("Status: OPEN") for one day post-PR-#295 merge while §1 SHIPPED and §15 verification surfaces were updated. Same staleness shape as Cluster 5; closed in PR #315 alongside Cluster 7.

### Cluster 5 — Coach Home MY TEAMS source divergence
- Status: **RESOLVED** via PR #239 (2026-05-18)
- Severity: HIGH
- Root cause (CC code-validated):
  - `CoachHomePage.jsx:47-51` built `myTeams` from direct `team_staff` query — no records data
  - `ParentHomePage.jsx:124` passed `byTeamId={recordsByTeam}` from `useOrgTeamRecords(orgId)` to same downstream component
  - Both used `ParentHomeTeamCard`; one passed records, one didn't
- PR #239 resolution:
  - Added `useOrgTeamRecords(orgId)` to `CoachHomePage.jsx:35` (cobranching ParentHomePage's pattern)
  - Threaded `summary={recordsByTeam[t.id]}` + `loading={recordsLoading}` to `ParentHomeTeamCard` at `:143-144`
  - Cross-surface invariant test landed at `src/components/home/__tests__/myTeamsCrossSurfaceInvariant.test.jsx` (anti-pattern #43)
  - Production cross-check confirmed 35 published games aggregate correctly across all 5 teams (see §15 Layer 4 entry for PR #239)
- **Anti-pattern #45 catch (registered 2026-05-20 morning):** PR #239's ledger update covered §1 SHIPPED row and the §15 Layer 4 verification table, but this §2 entry stayed stale ("Status: OPEN, Anticipated PR: #239 (tonight)") for two days post-merge. The §4.P Tuesday session-contract pre-flight surfaced the staleness when CC went to execute "Move 2 = Cluster 5 closure" on what turned out to be already-closed work. Both Frank's pressure-test letter Monday night ("root cause pre-validated in ledger lines 137-144, fix is mechanical") and CC's recap ("1 OPEN MEDIUM (Cluster 5)") were operating off this stale entry. The trap that anti-pattern #45 catches in real time on session 1 of the post-#45-registration window. Reinforces the discipline: planning-doc updates ship as a coordinated set across ALL surfaces (§1 SHIPPED + §2 ACTIVE BUGS + §15 verification + helper-extraction backlog if relevant) — not selectively.
- **Anti-pattern #44 corollary:** CC should have traced `git log -- src/pages/CoachHomePage.jsx` before confirming OPEN status last night. Stopping at the §2 entry was the gate-check failure. Trace-the-full-pipeline applies to ledger reads too, not just regression triage.

### Cluster 6 — Admin Home cache/query race (A2 + A3)
- Status: **A3 RESOLVED via PR #241; A2 RESOLVED via PR #327**
- Severity: HIGH (A3 confirmed regression) / MEDIUM (A2 state-transition flicker)
- A3 final root cause: **PR #235 regression** in `useAlertEvaluator.js`, not in AlertZone.
  - CC's D5 diagnostic missed this — focused on AlertZone gate logic (structurally correct) and didn't trace upstream evaluator timing.
  - Frank's 2026-05-18 smoke confirmed the green-flash-before-amber pattern persisted in production post-PR-#235.
  - Actual race: `useState([])` for configs made the initial state and "fetched + empty" state indistinguishable. The evaluate callback fired on mount with `configs=[]`, hit its empty-configs early return (`setAlerts([]); setLoading(false); return`), and flipped `loading=false` BEFORE the configs fetch completed. AlertZone briefly rendered the green AllClearPill before re-rendering with the real alerts once configs loaded and evaluate re-fired.
  - Fix in PR #241: `useState(null)` as "not yet fetched" sentinel. The evaluate's null branch returns without touching loading. AlertZone's loading gate stays armed through the configs-fetch window.
  - Drift-hedge test (`useAlertEvaluator.loadingGate.test.js`) asserts `loading=true` persists through the configs-fetch phase + only flips to false after evaluate completes.
- A2 (count flip 63→31 / 159→77): identified as season-context state-transition flicker. Downgraded HIGH → MEDIUM.
- A2 final root cause: `useAdminStats` effect re-fired when `seasonId` changed from `null` (no active season resolved yet) to a real UUID (active season resolved post-mount), but `counts.loading` stayed `false` from the prior fetch. KpiGrid rendered the placeholder-bypass flicker — stale/zero values briefly visible before the new values landed. Same structural shape as Cluster 6 A3's `useAlertEvaluator` configs race, just on a different upstream signal.
- Fix in PR #327: `setCounts((prev) => ({ ...prev, loading: true }))` at the start of every effect run. KpiGrid renders the placeholder during the refetch window, preventing the flicker. Anti-pattern #44 reinforced — trace the full state pipeline; downstream gate (KpiGrid placeholder) was structurally correct, but upstream loading-state never returned to true after first fetch.
- Lesson registered for CLAUDE.md anti-pattern future-extension: code-side review of a downstream gate isn't sufficient when an upstream hook can output values that bypass the gate. Trace the FULL state pipeline before ruling out a regression.

### Cluster 7 — Admin Home greeting not NY-pinned
- Status: **RESOLVED** via PR #295 (2026-05-19)
- Severity: LOW
- Surfaces affected: Admin Home only (A12)
- Parent Home (P21) was correct; Admin Home was using browser-local time and skewed for admins traveling outside ET
- PR #295 resolution:
  - `AdminGreeting.jsx` now imports `firstNameFrom` + `greetingFor` from `src/lib/greetings.js` (NY-pinned helper from PR #233/#234 cascade)
  - Greeting helper is shared with parent home so future drift on either surface fails the same way
- Anti-pattern #44/#45 catch (registered 2026-05-20): like Clusters 4 + 5, this §2 entry stayed stale ("Status: OPEN, ~5-min one-liner") for one day post-PR-#295 merge while §1 SHIPPED was updated. Closed in PR #315 alongside Cluster 4.

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

Status: **5 OF 7 PRs SHIPPED OR CODE-COMPLETE; PR 7a SHIPPED 2026-05-22; PR 6 + PR 7b GENUINELY OPEN.** PRs 1, 2, 3 shipped May 15-16; PRs 4 + 5 code-complete pending Frank's actor-validation send; PR 7a (token + schema foundation) shipped 2026-05-22 per session-open routing; **PR 6 + PR 7b remain genuinely unshipped.** 7-PR arc per `CUTOVER_WAVE_GAP_AUDIT.md`. Status corrected via §4.N Layer 2 audit (2026-05-18 evening) — git log confirmed PR 4 = #185/#186/#187, PR 5 = #217/#219/#220. **§4.A second reconciliation 2026-05-22 (this commit)** — git log confirmed PR 1 = #172 (b0efef4, 2026-05-15), PR 2 = #173 (db82f99, 2026-05-15), PR 3 = #182 + #184 (3a + 3b, 2026-05-16). Anti-pattern #45 catch — these three ships were 11+ days stale in the ledger; surfaced when CC went to scope "PR 1 next" and discovered all renderers + parser route + venue notes + LLM closer already in production.

- ~~**PR 1**~~ ✅ **SHIPPED PR #172** (b0efef4, 2026-05-15) — `tournament_prelim` renderer alignment. 7 new renderers shipped: `dayHeader.js`, `rsvpCallout.js`, `venueList.js`, `logisticsLine.js`, `taglineFooter.js`, `brandFooter.js`, `bracketCallout.js`. Plus `header.js` `variant: 'cobalt_band'` for full cobalt-background + white-text treatment. Plus `tournamentPrelimSections.js` section-builders module. Plus `tagline` body field on TournamentPrelimBody. Plus orphan-kind dev-mode warning in `composer.renderSections` (catches silent empty-renders of unregistered section kinds — root cause of pre-PR-1 `team_schedule_table` orphan). Implementation surfaced two corrections beyond audit framing: (1) cobalt header is visual STRUCTURE not string swap (added `variant: 'cobalt_band'` parameter); (2) `team_schedule_table` was silently orphaned end-to-end before this PR (replaced with day-grouped `game_card` sections). Section 12 of `CUTOVER_WAVE_GAP_AUDIT.md` captures both corrections inline.
- ~~**PR 2**~~ ✅ **SHIPPED PR #173** (db82f99, 2026-05-15) — Schedule parser at `/admin/import-schedule`. Single-paste TourneyMachine flow. Route live in `src/App.jsx:89` via lazy-loaded `ImportSchedulePage`. Closes V-12 (parser route partial status).
- ~~**PR 3**~~ ✅ **SHIPPED PR #182 + #184** (908cc67 + 390f082, 2026-05-16) — Per-venue notes + LLM-suggested closer. PR 3a (#182): per-venue notes section + schedule-gaps utility. PR 3b (#184): LLM-suggested closer button on StepBodySignoff.
- **PR 4** ⚠ **CODE-COMPLETE, ACTOR-VALIDATION-PENDING** (#185 skeleton, #186 aggregation + renderers, #187 body) — Coach Roundup kind. `coach_roundup` in RESOLVER_REGISTRY; multi-team header + per-team-color game rows + conflict callout. **Code-merged 2026-05-16; actor validation send never executed.** Per §4.N.5 Layer 4 verification 2026-05-19: section builders are fully complete (unlike PR 5 — `buildTeamSections` correctly iterates events and emits `color_striped_row` per event with day_label/time/primary/secondary at `coachRoundupSections.js:33-52`), wizard supported (4c flipped flag), resolver query chain wired, but zero `sent` rows in `comms_messages` for `kind='coach_roundup'`. Reclassified from SHIPPED → CODE-COMPLETE, ACTOR-VALIDATION-PENDING for ledger truth-telling symmetric with PR 5 framing (see §4.N.3 / §4.N.5 for the symmetry analysis). **Unblock path: Frank drives one `coach_roundup` send through the wizard against his admin context → row lands in `comms_messages` with `status='sent'` + email delivered via Resend → confirm rendered output matches expectations → PR 4 status → SHIPPED.** ~10-15 min of Frank's time on desktop whenever convenient. No further code work needed (different from PR 5's 3-sub-PR queue).
- **PR 5** ⚠ **CODE-COMPLETE, ACTOR-VALIDATION-PENDING** (#217 skeleton, #219 aggregation + renderers, #220 body + wizardSupported flip; **#264 5b-1 kind-aware label + #265 5b-3 conflict_callout + #266 5b-2 per-event rows + URLs all merged 2026-05-19**) — Family Guide kind. Originally code-merged 2026-05-16 but landed CODE-PARTIAL: actor validation send never executed (per V-37 unblock 2026-05-19 / §4.N.3) AND core content under-delivered (5b TODO documented in `familyGuideSections.js:10-13` comment was deferred and forgotten across the 5a/5b/5c chain). V-37 sub-PR queue 2026-05-19 closed all three structural gaps: kind-aware "PRACTICES/GAMES/EVENTS" label across vip_header + kid_color_pill (PR #264 5b-1), `conflict_callout` section with kid-aware renderer matching coach_roundup pattern (PR #265 5b-3), per-event `color_striped_row` rows under each kid_color_pill + `quick_link_nav` URLs wired to `/teams/<team_id>` (PR #266 5b-2). 23/23 family_guide contract tests + 11/11 coach_roundup tests + 293/293 engine + timezone audit pass. Reclassified from CODE-PARTIAL → CODE-COMPLETE, ACTOR-VALIDATION-PENDING for symmetric framing with §4.A PR 4 post-§4.N.5 cycle. **Unblock path: Frank drives one `family_guide` send through the wizard against his guardian context (fsamaritano@gmail.com / Charlie + Milo) → row lands in `comms_messages` with `status='sent'` + email delivered via Resend → confirm rendered output matches expectations → PR 5 status → SHIPPED.** ~10-15 min of Frank's time on desktop whenever convenient. No further code work needed.
  - ~~**PR 5b-1** (V-37 PR A)~~ ✅ **MERGED PR #264** — kind-aware event-count label. `summarizeEventKinds(events)` helper reads `event_type` and emits "N PRACTICES" / "N GAMES" / "N EVENTS" per single-kind / mixed / unknown case. Applied to vip_header + kid_color_pill for cross-surface invariant per #43.
  - ~~**PR 5b-2** (V-37 PR B)~~ ✅ **MERGED PR #266** — load-bearing: per-event `color_striped_row` rows under each kid_color_pill (mirrors coach_roundup pattern) + quick_link_nav URLs wired to `/teams/<team_id>`. Cross-surface invariant test locks vip_header.event_count === sum of color_striped_row counts.
  - ~~**PR 5b-3** (V-37 PR C)~~ ✅ **MERGED PR #265** — `conflict_callout` section added to Family Guide composer (was missing entirely; Coach Roundup had it). Renderer updated to surface kid names when present (`kid_a (team_a) vs kid_b (team_b)`), backward-compat with coach_roundup's team-only render. Cross-surface invariant: vip_header.conflict_count === conflict_callout.items.length.

  Until Frank's actor validation send fires, **PR 5 is not yet SHIPPED** in the strict-interpretation sense applied to PR 4 post-§4.N.5. Only the actor-send remains.
- **PR 6** — Coverage delegation schema + UI. New
  `event_coach_assignments` table (Option B); conflict detection at
  parse time + delegation prompt in import preview.
- **PR 7** ⚠ **PARTIALLY SHIPPED (7a foundation + 7b-1 rendering infrastructure).** Cutover gate infrastructure. Split into 7a (token + schema foundation) → 7b-1 (rendering infrastructure pure) → 7b-2 (emit + per-recipient send pipeline) → 7b-3 (admin aggregation + UI). Per session-open routing decision 2026-05-22 + mid-session scope refinement 2026-05-22 (per AP #39 truer-position lens — emit + send-pipeline modification require a coherent unit and don't ship safely without each other).
  - **PR 7a** ✅ **SHIPPED (this commit)** — Token + schema foundation. Migration `20260522074242_cutover_pr_7a_briefing_feedback_infrastructure` mirrors callup-token pattern: `briefing_feedback` table (nonce PK + message_id FK to comms_messages + recipient_email + rating SMALLINT 1..5 + free_text + ip/ua audit) + `feedback_token_secret` in app_secrets (per AP #33) + `mint_feedback_token` + `verify_feedback_token` + `apply_feedback_submission` RPCs (all SECURITY DEFINER with REVOKE FROM PUBLIC + explicit REVOKE FROM anon per AP #23 + #57) + RLS SELECT policy for admins via comms_messages → user_roles chain (with `auth.uid()` subselect wrapper per CLAUDE.md §5). Edge function `feedback-token-handler` deployed v1 (verify_jwt:false; config.toml entry locks the flag per AP #31; audit test passes). DO $$ verification block confirms mint+verify roundtrip for all 5 ratings + 3 boundary rejections (rating=0, rating=6, empty email). No app-layer code yet — emit/render is PR 7b scope.
  - **PR 7b-1** ✅ **SHIPPED (this commit)** — Rendering infrastructure pure. New `feedback_survey` atomic renderer (5 stacked star buttons with cobalt gradient by rating + fail-loud `{{feedback_*_url}}` fallback per AP #29) + composer.js SECTION_RENDERERS registration + `substituteFeedbackTokens` helper (mirror substituteCallupTokens / substituteRsvpTokens pattern, keyed by recipient_email). No kind emits feedback_survey yet → no production behavior change. Unit tests: 14 across renderer + helper (XSS escape coverage + fail-loud fallback + pure-function guarantees + bad-input rejection). Mid-session re-scope: original plan included tournament_prelim emit + URL wrap in this PR, but architecture investigation surfaced that the send pipeline modification (currently uses team slices with shared body via queueComposedMessages, not per-recipient like rsvp_nudge) wants to ship as a single coherent unit. AP #39 truer-position call: ship infrastructure first, wire emit + pipeline together in PR 7b-2.
  - **PR 7b-2** ✅ **SHIPPED 4-OF-5 KINDS (this commit)** — Emit path + per-recipient send pipeline (composerSubmit-path kinds). Design locks per Frank 2026-05-22: per-recipient tokens + Option A (queueComposedMessages callback) + after-signoff-before-brand_footer position + v1 rating-only. Files: (a) `queueComposedMessages.js` adds optional `perRecipientSubstitutor` callback parameter (additive; backward-compat for all existing callers) — builders extracted to `queueComposedMessagesBuilders.js` to stay under 150-line cap; (b) new `feedbackSubstitutor.js` factory mints 5 tokens × recipient via `mint_feedback_token` RPC, wraps into handler URLs (`?t=<token>&r=<rating>`), runs `substituteFeedbackTokens`, re-renders body_html + body_plain; (c) new `feedbackSurveySection.js` helper exports `buildFeedbackSurveySection()` for resolver emit; (d) 4 resolvers emit `feedback_survey` between signoff and brand_footer (tournament_prelim, family_guide, coach_roundup, game_recap); (e) `composerSubmit.js` wires `createFeedbackSubstitutor` into `queueForDispatch` for the 4 FEEDBACK_ENABLED_KINDS; (f) admin BCC row deliberately excluded from substitution (mirrors `adminSample` isolation in rsvp_nudge — admin sees placeholder body); (g) row-transient `__content_sections` field carried through `buildFanoutRows` for substitutor access, stripped before INSERT. Tests: 9 substitutor unit tests + signature lock in queueComposedMessages test + snapshot fixture updates for tournament_prelim + game_recap. weekly_digest deferred to **PR 7b-2.5** (digestSend uses a separate pipeline at 150-line cap; structural changes warrant their own coherent unit).
  - **PR 7b-2.5** — weekly_digest feedback survey. Open. Scope: digestSend.js modification (per-family mint loop + substitute + re-render at `renderSlice` time) + weeklyDigest resolver emits `feedback_survey` section + test fixture updates. Defers from PR 7b-2 because digestSend is at 150 lines exactly and pipeline shape differs from composerSubmit (per-family inline render, not deferred queue substitution). Estimated ~3-4 files.
  - **PR 7b-3** — Admin aggregation + UI. Open. Scope: aggregation hook (mean rating per message + ≥4.0 over last N sends) + per-briefing rating UI on BriefingHistoryDetail + cutover-gate metric surface (location TBD between admin home / new admin briefings index). Estimated ~4-6 files.

---

### §4.B — Briefing IA remainder (Wave 4.4-B)

Status: ✅ **CLOSED 2026-05-22** — Session 1 partially shipped May 13; remainder shipped this session (TournamentHeader relocation + IA_FRAMING.md doc). §4.B fully closed.

- ~~**TournamentHeader Send Briefing relocation**~~ ✅ **SHIPPED (this commit)** — `src/components/tournament/TournamentHeader.jsx` now uses a `<Link>` deep-link to `/admin/briefings/compose?anchor=tournament&id=<tournament.id>` (no kind preset; admin lands at Kind step). Removed legacy `SendBriefingButton` import + the now-unused `tournamentBriefingKinds` helper. `ComposeAnchorCta` (kind-specific CTA gated on ctaKind) preserved as the moment-specific primary CTA when applicable. Cross-surface invariant test at `src/components/tournament/__tests__/TournamentHeaderSendBriefingDeepLink.test.jsx` (5/5 pass) locks: anchor-only URL shape, ctaKind-independence (in-flight tournaments still get the link), staff gating, no kind preset, and that the legacy `SendBriefingButton` import never returns. EventDetailHeader.jsx:59 still uses `SendBriefingButton` (icon-only overflow variant) — explicitly out of §4.B scope per IA_FRAMING.md follow-up note.
- ~~**docs/IA_FRAMING.md**~~ ✅ **SHIPPED (this commit)** — Light reference doc capturing the locked briefing IA strategy: one canonical portal (`/admin/briefings/compose`) + three classes of entry surfaces (cold start Quick Action, anchor-only deep-link, anchor+kind deep-link). Includes per-surface shipped table, URL param hydration decision tree, anti-pattern compliance notes (#34, #42, #43). Closes Decision D from Wave 4.4-B Session 1 (2026-05-13).

---

### §4.C — Sprint B-F Home Page completion

Source: `SKYFIRE_BUILD_QUEUE_v2.md` Phase 1 Sprint plan, references
`HOME_DESIGN_SPEC.md` (CC hasn't read in this session — see §15).

Status: **SUBSTANTIVELY COMPLETE END-TO-END** as of 2026-05-20 Wednesday
session. Sprints B, C, D, E are essentially done across the full spec
§1 / §2 / §3 section enumeration. Sprint F (cross-role polish) is
~30% done. Only schema-blocked items remain (UPCOMING PREP for parent
+ coach require event_prep_notes table — not yet created).

- **Sprint B — Parent home Phase 1**: COMPLETE.
  - MY TEAMS dynamic data: SHIPPED via PR #239 (Cluster 5 fix)
  - ACTION ZONE shell + 3 signals: SHIPPED via PR #281 (RSVP pending),
    #282 (ride needed), #283 (volunteer slot). Generalized to signal-
    agnostic shape in #288 (item.href + item.secondary fields).
  - Density toggle wiring: SHIPPED (DensityToggle component exists)
  - **ActionZone density variants**: SHIPPED via PR #308
    (Compact ↔ Detailed cross-role).
  - Relative date language: PARTIAL via PR #234
  - Empty state design: SHIPPED (welcome card)
  - **4th ACTION ZONE signal area — payment overdue**: UNBLOCKED via
    PR #303 (lane on admin home) + PR #304 (RegistrationReminderCard on
    parent home; parent payment surface now exists).

- **Sprint C — Parent home Phase 2**: 6 OF 6 SECTIONS SHIPPED.
  - LIVE NOW card: SHIPPED via PR #284
  - Tournament weekend banner: SHIPPED via PR #285
  - Recognition card: SHIPPED via PR #286
  - Coach message block: SHIPPED via PR #287
  - Emergency alert banner: PARTIAL via existing AlertZone (could
    extend with red-bordered cancellation-specific render)
  - **Registration/payment reminder**: SHIPPED via PR #304
    (RegistrationReminderCard reads useSeasonFinancials with
    guardianId filter — 3rd consumer of the shared hook).

- **Sprint D — Coach home**: COMPLETE end-to-end except UPCOMING PREP.
  - CoachHomePage.jsx new file: SHIPPED via Tier 3 v1
  - Alerts + roster snapshot + MY TEAMS: SHIPPED via Tier 3 v1
  - ACTION QUEUE shell + 2 signals: SHIPPED via PR #288 (pending
    achievements) + #289 (unpublished scores).
  - **MESSAGING BLOCK (§2.1.4)**: SHIPPED via PR #296 (useRecentTeamMessages
    + CoachMessageBlock reused from PR #287; same component, opposite-
    direction data flow — cross-role infra validation).
  - **QUICK ACTIONS ROW (§2.1.6)**: SHIPPED via PR #310
    (CoachHomeQuickActions — Start Check-In, Message Team, Quick Score).
  - **useCoachHomeSignals extracted**: PR #310 (third role with
    signal-aggregator hook pattern; mirrors useParentHomeSignals
    PR #304 + useAdminHomeSignals PR #297).
  - UPCOMING PREP (§2.1.5): BLOCKED — needs event_prep_notes schema.

- **Sprint E — Admin home redesign**: COMPLETE end-to-end.
  - AdminHomePage exists + alerts + KpiGrid: SHIPPED
  - **KpiGrid units bug fix**: SHIPPED via PR #305 ($702 → $70,243
    display — pre-existing units-mismatch surfaced during consolidation).
  - MANAGE section added: SHIPPED via PR #269.
  - **ADMIN SHORTCUTS redesign close**: SHIPPED via PR #309 (regrouped
    8 flat tiles into CREATE / COMMUNICATE / OPERATE buckets per May 16
    audit Tier 1+2 item).
  - ACTION QUEUE shell + 3 signals: SHIPPED via PRs #291/#292/#293.
  - **PENDING QUEUES lanes (§3.1.4)**: SHIPPED via PR #297 (achievements +
    coach payouts) + PR #303 (3rd lane: families with outstanding balance)
    + PR #313 (Compact/Detailed density variants — mirror PR #308).
  - **PROGRAM HEALTH card (§3.1.5)**: SHIPPED v1 via PR #307 (season
    progress + payment %) + v2 via PR #311 (+ RSVP rate + Attendance +
    Registration pipeline). All 4 spec metrics now rendered; Attendance
    gracefully renders '—' until check-ins workflow is in active use.
  - **RECENT ACTIVITY feed (§3.1.6)**: SHIPPED v1 via PR #312 (3 streams:
    RSVPs, announcements, game results; merged + sorted desc, 24h,
    top 8). Hidden today (zero recent activity); surfaces when data
    arrives.
  - **QUICK ACTIONS ROW (§3.1.7)**: EFFECTIVELY SHIPPED via ADMIN
    SHORTCUTS redesign (PR #309). Spec listed 4 generic chips
    [Create Event] [Send Announcement] [Export Data] [View Reports] —
    superseded by the richer 8-tile + sub-grouping treatment.
  - Remaining sprint-E adjacent: overdue-waivers signal (schema dep),
    expired discount codes signal, missing emergency contacts signal —
    all defer to schema work or product calls.

- **Sprint F — Cross-role polish**: ~30% done.
  - Bundle perf SHIPPED via PR #277 (SDK lazy-load — main bundle
    893 kB → ~440 kB on Vercel).
  - **Density variants** SHIPPED via PR #308 (ActionZone) + PR #313
    (PendingQueuesLanes) — 2 of 3 cross-role shells. MessageBlock
    density deferred (no section header; pattern doesn't map naturally).
  - Dark mode complete (Q10), accessibility full audit (Q1), analytics
    instrumentation (Q9) — NOT SHIPPED.

- **Financial-math single-source consolidation** (anti-pattern #42
  end-to-end closure): PRs #303 → #306. Five render-time consumers
  now route through `useSeasonFinancials`:
    1. FinancialDashboardPage (KPI cards + family balance list)
    2. Admin home payment-overdue lane (via useAdminHomeSignals)
    3. Parent home RegistrationReminderCard (via useParentHomeSignals)
    4. Admin home KPI grid (via useAdminStats)
    5. Admin home ProgramHealthCard (via useProgramHealthMetrics)
  Sixth consumer reads (FamilyBalanceList) flow through the same hook
  via the `balances` map. Drift-hedge audit at
  `lib/__tests__/financialMathAudit.test.js` fails CI on any inline
  re-implementation.

**Cross-role infrastructure validated this stretch:**
- `ActionZone` component is signal-agnostic — parent + coach + admin
  ALL consume the same component. Items emit `kind`, `primary`,
  optional `secondary`, optional `href`. New signals add hooks; the
  component needs no further work. **Tally: 3 pages × 8 signal hooks
  × 1 shared component.**
  - Parent: usePendingRsvps, useRideNeeded, useVolunteerSlots
  - Coach: usePendingAchievements, useUnpublishedScores
  - Admin: useLowRsvpEvents, useUnscoredGames, usePendingInvitations
- Recognition card pattern (relative timestamp + composed title
  + team-color stripe + click → /teams/<id>) similarly reusable for
  any team-scoped recognition surface.
- Per-role data-scope pattern locked: parent signals scope by
  myChildren×teams, coach signals scope by coachedTeamIds, admin
  signals scope by orgId. All three follow anti-pattern #36 + #37.

**Symmetric "3 signals per page" pattern locked** for parent + admin
(coach has 2 today, pending 2-3 more). The shell pattern is now
proven; future Sprint D/E work adds hooks rather than rewriting
infrastructure.

---

### §4.D — Sprint G Rides redesign

Source: `RIDES_DESIGN_SPEC.md`. Status reconciled 2026-05-20 via
PR #329 + corrected via PR #330.

**Anti-pattern #44 recursive catch (PR #330):** PR #329 was itself
stale at a deeper layer. Initial grep flagged `useRideOffers` /
`useRideClaims` as "orphan hooks" but only checked `src/components` +
`src/pages` for direct consumers — missed the indirection through
`src/hooks/useEventRidesView` (a meta-hook composing both ride hooks,
consumed by `EventRidesTab` 150 lines, wired into `EventDetailPage`
Rides section). The trace should have run `grep -rln useRideOffers
src/`, not `grep -rln useRideOffers src/components src/pages`.
**Lesson:** when verifying "this hook has no consumers," grep MUST be
src-tree-wide; intermediate-hook indirection is the failure mode.

**Status (after PRs #332 + #333): AGGREGATE-COVERAGE SIGNAL SHIPPED END-TO-END.**

Schema + hooks + parent UI + admin widget + coach section all built.
Interactive v2 features (CTAs, arrival/return split, waitlist surface)
deferred.

Component-by-component verification:

- ✅ **Schema** — `event_ride_offers` + `event_ride_claims` match
  RIDES_DESIGN_SPEC §1 column-by-column (17 columns each).
- ✅ **Hooks** — `useRideOffers.js` (Realtime + optimistic
  postOffer/cancelOffer), `useRideClaims.js`, composing
  `useEventRidesView.js`, plus new `useRidesTodaySummary.js`
  (PR #332/#333) — cross-role hook with optional teamIds filter.
- ✅ **Parent UI (§4)** — `EventRidesTab.jsx` (150 lines) on
  EventDetailPage Rides section. Handles ride requests, Need ride /
  Offer ride buttons, PostOfferForm, my claimed seats with
  OfferCard, other offers with claim flow, density toggle,
  RideRequestCard.
- ✅ **Coach RIDES COORDINATION section (§5)** — SHIPPED via PR #333.
  `RidesTodayCard` on `CoachHomePage` below ActionZone, scoped to
  coachedTeamIds via `useRidesTodaySummary` teamIds filter. Renders
  aggregate coverage + per-team breakdown bars.
- ✅ **Admin home Rides Today widget (§6)** — SHIPPED via PR #332.
  `RidesTodayCard` on AdminHomePage between PROGRAM HEALTH and
  RECENT ACTIVITY. Renders "RIDES TODAY · N events · X% avg coverage"
  + per-team breakdown with CoverageBar (green ≥80% / amber ≥50% /
  red <50%). Org-wide via `useRidesTodaySummary(orgId, now)`.
- ⚠ **Waitlist + auto-confirm UI** — DB shape supports
  (waitlist_position, lifecycle flows §2.3/2.4); render-layer
  surfacing not fully audited.

Anti-pattern #42 honored on the new infra: ONE hook
(`useRidesTodaySummary`) serves both admin (org-wide) and coach
(team-scoped) consumers. Second arc of cross-role infra after the
financial-math single-source consolidation (PRs #303-#306).

V2 chunks (deferred, priority order):
1. **Interactive CTAs**: admin `[Send program broadcast]`; coach
   `[Suggest match]` / `[Post team ride request]` / `[Offer rides myself]`.
   Need broadcast flow + audience-picker integration + suggestion
   algorithm. ~60-90 min each.
2. **Arrival vs return split**: today the aggregate is
   undifferentiated. Spec §5 wants two coverage bars
   (arrival_seats / return_seats). ~30 min hook extension + 15 min UI.
3. **Waitlist + auto-confirm UI audit pass**. Confirm DB lifecycle
   maps to render-layer states; surface waitlist promotion notices.

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

Items <30 min each.

- ~~**Cluster 3** event title centralization~~ — **DONE** (PR #298, 2026-05-19).
  Migration 021 sanitization still queued under §2 Cluster 3.1.
- ~~**Cluster 4** bell badge removal~~ — **DONE** (PR #295, 2026-05-19;
  §2 Cluster 4 marked RESOLVED). Ledger referent here was stale —
  rediscovered + closed via sweep audit 2026-05-20 PM.
- ~~**Cluster 7** admin greeting NY-pin~~ — **DONE** (PR #295,
  2026-05-19; §2 Cluster 7 marked RESOLVED). Same stale referent
  shape as Cluster 4 above.
- ~~**Cluster 6.A2** KpiGrid loading gate refinement~~ — **DONE**
  (2026-05-20 PM, current-surface follow-up). Original referent
  ("KpiGrid" / "useAdminStats") was removed in a later refactor; PR
  #327 fixed the now-defunct surface. The equivalent shape on the
  current shared hook (`useSeasonFinancials`) carried the same
  one-render stale gap on `seasonId` change — pre-fix, consumers saw
  prior-season `accounts` with `loading=false` for one render before
  the microtask-deferred refetch scheduled `setLoading(true)`. Fix:
  `fetchedKeyRef` + `isStale` derived in render; visible `loading` is
  `loading || isStale`. Same shape as PR #241 / anti-pattern #43.
  Drift-hedge test: `useSeasonFinancials.loadingGate.test.js`. Stale
  comments referencing the removed `useAdminStats` cleared from
  `SeasonContext.jsx` + `financialMathAudit.test.js`.
- Async-ordering test replication for `useHomeRole`,
  `useAttendanceData`, `useActivities` per anti-pattern #44 (see §11).
  Note: `useAdminStats` was removed by the same refactor that closed
  Cluster 6.A2; the equivalent target on the current surface is
  `useSeasonFinancials` (already covered by the loadingGate test
  above) + `useProgramHealthMetrics`.
- ~~**P6 RSVP copy normalization**~~ — **DONE** (PR #399, 2026-05-20 PM).
  Canonical: buttons → "Can't" everywhere; status/headers → "Not Going"
  everywhere. RsvpPlayerRow.BUTTONS was the lone outlier ("Not going");
  fixed + test updated.

#### §4.G close (2026-05-20 PM, post-sweep audit)

Frank-requested late-night sweep of §4.G + §4.S P1 surfaced that
several items were already shipped in prior PRs but the ledger
referents stayed stale. Acid-test catch (anti-pattern #45 corollary —
same pattern as Clusters 4/5/7 staleness on 2026-05-19):

| Ledger referent | Actual status | Closed in |
|---|---|---|
| §4.G Cluster 4 (bell badge) | DONE | PR #295 |
| §4.G Cluster 7 (admin NY-pin) | DONE | PR #295 |
| §4.S B1 (Tournament checkbox) | DONE | TeamMultiSelect comment cites L99 v6 §5.1 B1 |
| §4.S B3 (Financials empty seasons) | DONE | FinancialDashboardPage comment cites L99 v6 §5.1 B3 |
| §4.S B4 (sparse RSVP %) | DONE | PlayerRow comment cites L99 v6 §5.1 B4 |
| §4.G P6 (RSVP copy) | SHIPPED THIS SWEEP | PR #399 |
| §4.S C1 (Engine Preview placement) | SHIPPED THIS SWEEP — route+page deleted | PR #398 |
| §4.S C2 (Tournament conflict warning) | DONE | TournamentFormSheet `conflictMessage` lines 57-68 |
| §4.S C3 (Red asterisk pattern) | DONE | PR #374 (merged earlier this PM after rebase unblock) |
| §4.S D1 (30 opponent strings) | SHIPPED THIS SWEEP — actually 1 row | direct SQL backfill 2026-05-20 PM (PHD - McCurdy linked to existing opponents row) |
| §4.S B2 (1 historical TBD-opponent row) | SKIPPED — Frank-manual task (1-tap edit) |
| §4.S E1 (anti-pattern #46 CI guard) | SHIPPED THIS SWEEP | PR #400 |
| §4.S E2 (PR template) | DONE | `.github/PULL_REQUEST_TEMPLATE.md` already exists |

Net new this sweep: PRs #398, #399, #400 + 1 SQL backfill. Other
items were already done; the sweep proved them via grep + db query
rather than re-shipping.

**Process discipline reinforced:** before re-shipping a ledger item,
grep the codebase for an L99 §X.Y comment marker (the doc-author
adds these inline when closing an item from a §). The reverse —
ledger marked DONE but code missing — has yet to occur in this
codebase; ledger marked OPEN but code already done is the recurring
staleness shape, registered as a corollary to anti-pattern #45.

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

**Status: SWEEP CLOSED 2026-05-20 Wednesday session.** 8 of 11 items
shipped today as one-PR-each through the §4.Q session. Items 17
(anti-patterns #37 + #38 CLAUDE.md) already closed pre-Wednesday.
Item 18 (Admin Home IA Tier 3) is a design exercise, parked.

| Item | Description | Closed by |
|------|-------------|-----------|
| 8 | useWeather localStorage signout cleanup | PR #320 |
| 9 | BriefingComposer state reset on org change | PR #318 |
| 10 | useHasUnread channel name + filter org-scope | PR #319 |
| 11 | RecordsPage game_results count org-scope | PR #321 |
| 12 | useAcademyCallupCandidates lacks useAuth | PR #322 |
| 13 | event_ride_requests.org_id FK CASCADE | PR #324 |
| 14 | game_results.player_of_game_id FK SET NULL | PR #324 |
| 15 | briefing_templates.org_id NOT NULL | PR #325 |
| 16 | legacy renderers/tournamentRecap.js dead code | PR #323 |
| 17 | anti-patterns #37 + #38 CLAUDE.md | CLOSED pre-Wed |
| 18 | Admin Home IA Tier 3 (design exercise) | PARKED |

Drift-hedge note: every fix carried PR-body smoke evidence + an
anti-pattern citation (#21 mirror migrations, #37 org_id scoping,
#42 parallel-system, #45 ledger reconciliation). The single
sustained discipline arc produced eight ledger-aligned PRs in
~75 minutes across the back half of the Wednesday session.

---

### §4.M — May 16 Audit Cycle carryovers (Phase 1-5 + Beta)

Source: Phase 1 Core Subset read 2026-05-18 19:30 CEST (Sunday post-dinner hour). Six docs walked in sequence: `AUDIT_PHASE1_WIRING` → `PHASE2_REGISTRY_STATE` → `PHASE3_MIGRATION_DEPLOY` → `PHASE4_RLS_SECURITY` → `PHASE5_TYPE_CONTRACT` → `AUDIT_BETA_SYNTHESIS`.

**30+ findings across 5 phases + Beta synthesis.** Some shipped during the audit-day itself (PR #210-#215 + Phase 1 P0 batch + Phase 3 P0 mirror). Many P0-LATENT / P1 items remain unshipped or unknown-status. Each entry below either flags SHIPPED (with evidence cite) or queues a V-* verification item.

**KEY FINDING for Monday Phase 4**: the "22-bug catalog" referenced in Frank's Monday-opener prompt is NOT in `BETA_SYNTHESIS`. The synthesis doc has 6 sub-area verdicts + carryover items but no "22-bug" enumeration. The 22-bug catalog lives in `SKYFIRE_BUILD_QUEUE_v2.md` as documented in §4.E. Phase 4 of the Monday-opener (22-bug reconciliation) should focus on §4.E + SKYFIRE_BUILD_QUEUE_v2, NOT on the May 16 audit docs. Saves ~15-20 min of misdirected search.

#### §4.M.1 — Phase 1 (Wiring + Schema Drift): mostly SHIPPED, some P1 remaining

**VERIFIED SHIPPED** via V-17 (2026-05-18 19:50Z): PRs #195 + #203 closed P0-1 + P0-2 + P1-1 + P1-2 + P1-7. Code-grep confirmed `.eq('org_id', ...)` + `.is('archived_at', null)` present in the affected files.

P1 STATUS (sweep 2026-05-20 Wednesday — PR #328 reconciliation):
- ✅ P1-1: `EventLocationTab.jsx` tournaments query — already has `.eq('org_id', orgId)` (shipped silently between audit and sweep)
- ✅ P1-2: `CreateActivityWizard.jsx` events series-recurrence — already has `.eq('org_id', orgId)`
- ✅ P1-3: `notificationBadgeQueries.js` — file DELETED via PR #272 (knip orphan sweep) alongside the bell-badge UI removal (Cluster 4). Issue auto-closed.
- ⚠ P1-4: `FinancialDashboardPage.jsx`/`useSeasonFinancials` financial_transactions over-fetch — still ships `.from('financial_transactions').eq('org_id', orgId)` and filters client-side by acctIds. Bounded over-fetch (production: ~100-200 rows); optimization deferred.
- ✅ P1-5: `useRsvps.js` event_rsvps wildcard select — closed via PR #328 (explicit column list).
- ✅ P1-6: `useEventArrivals.js` event_arrivals wildcard select — closed via PR #328 (explicit column list).
- ✅ P1-7: tournaments `archived_at` filter — shipped on `StepDetails.jsx:14-16` (`.is('archived_at', null)`).

Status: **6 of 7 closed.** Only P1-4 (optimization, not correctness) remains, deferred to a focused perf pass when financial_transactions row counts grow.

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

### §4.P — Tuesday session contract (2026-05-20) — anti-pattern #48 promotion test

**Stated before any code, per the discipline lock from Monday evening session close.** The 40-PR Monday cycle (PR #260 → #299) extended past every implicit stopping point until Frank stopped, not until the work stopped — same shape as Sunday's 8-PR cascade. Anti-pattern #48's candidate ("time-budget revisions require ledger reconciliation") didn't fire Monday because no budget was set. Tuesday is the promotion test: can the workflow hold a stated budget for the first time in this build cycle?

**Contract terms (Frank-stated 2026-05-20 ~04:36 UTC / morning NYC):**
- Max hours: **10**
- End time: **midnight local NYC**
- Max PRs: **40**

**Operational discipline locked alongside contract:**
1. Move 1 (this entry) — contract written to ledger BEFORE any code.
2. Move 2 — Cluster 5 closure + #43 cross-surface invariant test as first execution unit. ~15-20 min. Mechanical: useOrgTeamRecords already exists; thread records prop through CoachHomePage matching ParentHomePage:124 pattern.
3. Move 3 — **hard pause** after Move 2. No auto-chain. Route from a stopped position, not from momentum. Pause is the discipline.

**Promotion criteria for anti-pattern #48:**
- If contract terms hold (all three numbers respected) → #48 promotes from candidate to registered rule in CLAUDE.md §11.
- If terms breach (any of the three exceeded) → ledger-reconciliation move required at the breach point, candidate remains as "tried, didn't take" learning artifact, workflow accepts session-extending as its actual shape.
- Either outcome produces useful information.

**Branch state at contract open:** main, clean, 0 ahead / 0 behind origin.

**Tuesday close (2026-05-20 ~05:09 UTC):** Contract held. Final state:
- PRs: 2 of 40 cap (PR #300 contract entry; PR #301 Cluster 5 ledger reconciliation)
- Elapsed: ~33 min of 10h cap
- End-time: closed well before midnight
- Anti-pattern #48 promotion verdict: **HOLD CANDIDATE.** Honest read — Tuesday's contract terms all held, but the session was atypically short. Move 2 collapsed from "code fix + #43 test" to "ledger reconciliation only" when CC's pre-flight surfaced that Cluster 5 had already shipped via PR #239 (anti-pattern #44/#45 catch). One short session doesn't stress-test the chain-vs-pause discipline under load. #48 stays in candidate status pending a full-budget session that tests pause discipline at the 4h+ mark. Tuesday's data point: "shape supports the discipline" — not strong enough for promotion to registered rule.

---

### §4.Q — Wednesday session contract (2026-05-20) — anti-pattern #48 ongoing test

**Second session under stated-budget discipline.** Tuesday's data point ("shape supports") needs a longer session to validate. Wednesday's contract tests pause-discipline-under-load: does the hard-pause-after-each-Move structural commitment hold when the session has real runway, or does momentum chain past it?

**Contract terms (Frank-stated 2026-05-20 ~07:15 NYC):**
- Max hours: **10**
- End time: **midnight local NYC**
- Max PRs: **50**

**Operational discipline:**
1. Move 1 (this entry) — contract written to ledger BEFORE any code.
2. Move 2 — Payment overdue lane for PendingQueuesLanes (HOME_DESIGN_SPEC §3.1.4 third lane). Scope: 75-90 min, lane work + `useFamiliesOwing` hook extraction + flow back through `FinancialDashboardPage:60-68` for consistency. One PR per anti-pattern #42 (avoid parallel-system buildup) — shipping the hook without FinancialDashboardPage consuming it would create two sources of truth for "outstanding balance."
3. Move 3 — **hard pause** after Move 2. Same discipline as Tuesday. Route from stop.

**Promotion criteria (carries forward from §4.P):**
- If contract terms hold across the Wednesday session → second data point supporting #48; promote based on accumulated evidence.
- If terms breach → ledger reconciliation at breach point; candidate remains "tried, didn't take."

**Branch state at contract open:** main, clean, 0 ahead / 0 behind origin.

**Mid-session checkpoint (2026-05-20 ~07:46 NYC, after PR #325):**
- PRs: 26 of 50 cap (52%)
- Elapsed: ~3h 50m of 10h cap (38%)
- End-time: midnight, still ~16h runway
- Contract terms holding all three caps under-budget
- **Hard-pause discipline removed** mid-session (Frank explicit;
  contract numbers still bound the envelope). The mechanism #48
  was meant to stress-test (pause-after-each-Move) is no longer
  the operative test for this session — reduces #48 promotion
  test to "do budget numbers hold as soft ceilings?" Different
  question than original test.

**Wednesday session arc so far:**
- §4.C home-page completion: COMPLETE across all 3 roles (#296-#317)
- Financial-math consolidation (anti-pattern #42 end-to-end): #303-#306
- ActionZone + PendingQueuesLanes density variants: #308, #313
- Sprint completion ledger reconciliation: #314
- §2 stale-OPEN sweep (Clusters 4 + 5 + 7): #301, #315
- Home page invariant audit: #316
- UPCOMING PREP card (parent + coach): #317
- May 16 audit P2 sweep — 8 items closed: #318-#325
  - useWeather signout, BriefingComposer org reset, useHasUnread
    channel scope, RecordsPage org-scope, useAcademyCallupCandidates
    org-scope, FK CASCADE gaps (2), briefing_templates NOT NULL,
    legacy renderer dead code
- §4.L close + §4.Q mid-session checkpoint: #326

**End-of-day checkpoint (2026-05-20 ~08:50 NYC, after PR #336):**
- PRs: 37 of 50 cap (74%)
- Elapsed: ~4h 52m of 10h cap (49%)
- End-time: midnight, still ~15h runway
- All three contract caps still holding under-budget

**Second-half arc (PRs #327-#336):**
- §2 Cluster 6 A2 closure + ledger flip: #327 (Admin KPI loading state
  on season-change refetch; same shape as Cluster 6 A3's #241 fix on
  a different upstream signal)
- §4.M.1 P1 sweep — 6 of 7 items closed + wildcard select cleanups:
  #328 (useRsvps + useEventArrivals)
- §4.D Sprint G rides reconciliation — staleness catches + corrections:
  #329 (initial), #330 (anti-pattern #44 recursive correction; PR #329
  itself was stale at a deeper layer; lesson: grep src-tree-wide, not
  src/components-only)
- V-23 iCal subscription URL: verified PARTIAL (download yes,
  subscribe no): #331
- V-23 iCal subscription URL: PARTIAL → SHIPPED end-to-end (migration
  + edge function + UI subscribe button): #342 (Thursday 2026-05-20
  morning, post-Wed-checkpoint substantive action 3 from end-of-Wed
  letter). Closes the last polish-tier verification queue row.
  Migration 20260520093701 added teams.team_feed_token; edge function
  team-feed deployed v1 (verify_jwt=false per anti-pattern #31, audit
  test auto-picked it up); PublicSchedulePage gained Subscribe to
  Calendar bottom sheet with webcal:// (Apple) + Google Calendar URLs.
- Sprint G aggregate-coverage signal: shipped end-to-end:
  - Admin Rides Today widget (§6): #332
  - Coach RIDES COORDINATION section (§5): #333
  - §4.D reconciliation post-shipping: #334
  - useRidesTodaySummary aggregator extracted + 7 unit tests: #335
- Home page invariant audit extended to 12 home-arc components: #336

**Cross-arc structural wins of the day:**
- 2 cross-role hook abstractions shipped (useSeasonFinancials and
  useRidesTodaySummary), each with 2-5 consumers via teamIds/seasonId
  optional filters
- 4 drift-hedge audit tests added (financialMathAudit,
  homePageInvariantAudit + extension, ridesSummary unit tests, plus
  the pre-existing eventTitleAudit family)
- §2 ACTIVE BUGS now down to 2 Frank-gated items (Cluster 1.1 + 1.2);
  all code-actionable HIGH/MEDIUM bugs closed
- §4.L Tier 4 P2 sweep — 8 of 11 items closed (1 pre-Wed + 2 deferred)
- §4.M.1 Phase 1 P1 — 6 of 7 items closed (1 deferred as perf-only)
- §4.D Sprint G aggregate signal SHIPPED end-to-end (parent UI was
  already shipped pre-Wed; coach + admin widgets shipped today)

**Anti-pattern #48 status — Framing C resolution (Frank-locked Wednesday eve):**

CC's mid-session checkpoint framed promotion as a binary (promote /
hold candidate). Frank's end-of-Wed letter introduced Framing C —
split the candidate into two distinct rules so each can be tested
honestly against the data that actually exists.

**Anti-pattern #48 (CANDIDATE, ORIGINAL FORM) — STILL UNTESTED.**
Claim: pre-set exit conditions need an external commitment mechanism
to fire reliably; internal intention does not produce stops.
Status: not testable in the Wednesday session because Frank explicitly
removed the pause-after-each-Move structural commitment mid-session.
Re-test required: a future under-load session WITH the
pause-after-each discipline intact + a real cap-approach scenario.
Risk if never tested: stays candidate forever — accept that as the
honest state rather than promote on weaker data.

**Anti-pattern #48' (CANDIDATE, MODIFIED FORM) — WEDNESDAY DATA.**
Claim: stated maximums written to ledger at session-start, with
self-monitoring against caps during execution, produces stops in
advance of cap-hit when work is engaging.
Tuesday data: 2 PRs / 33min / well before midnight cap → atypically
short, doesn't stress budget-holding-under-load. Weak data point.
Wednesday data: 39 PRs / ~5h / well under all 3 caps under sustained
under-load execution. Strong data point on the soft-ceiling claim.
Promotion criteria: holds across ONE more under-load session
(matches the test design — empirical confirmation across multiple
sessions before durable rule).

**Why split rather than promote either form alone:**
- Promoting original #48 over-claims (the data tests a weaker thing).
- Holding everything as candidate under-claims (the soft-ceiling
  data is real and useful; encode it).
- Modifying original #48 retroactively risks losing the original
  insight.
- Framing C respects the data without overclaiming what either form
  was tested for. Captured durably; reviewable across sessions.

**Generalization status note for anti-pattern #44 (CLAUDE.md §11 #44):**
Four distinct work-class applications across three sessions:
  - PR #241 (Sunday)      regression triage at gate vs upstream
  - PR #260 (Monday)      doc claims vs production evidence
  - PR #277 (Monday)      perf root-cause validation
  - PR #330 (Wednesday)   audit-output verification (recursive)
The principle is generalized — not situational. Worth registering
inline on the #44 entry in CLAUDE.md when next that section is
touched. Not promoted via this PR (CLAUDE.md edit is its own
discipline; this is a ledger note flagging the durable observation).

**Next-session opener — clean read state:**
- §2 ACTIVE BUGS: 2 Frank-gated items only
- §4.C: COMPLETE all sprints
- §4.D Sprint G: aggregate signal SHIPPED; v2 (interactive CTAs +
  arrival/return split) deferred
- §4.L: 8 of 11 P2 items closed; #18 (Admin Home IA Tier 3) parked
- §4.M.1: 6 of 7 P1 items closed; P1-4 (financial_transactions
  over-fetch) deferred as perf-only
- V-23 iCal subscription URL: SHIPPED end-to-end Thursday 2026-05-20
  via PR #342 (migration + edge function + UI). No follow-up work.
- Anti-pattern #48: split via Framing C per Wednesday-eve letter.
  #48 (original) stays candidate, untested. #48' (modified, soft-
  ceiling) stays candidate, awaits one more under-load session.

Next-session candidate moves (no priority assigned):
- Anti-pattern #48' re-test on a future under-load session (then
  promote if holds). Anti-pattern #48 (original) re-test requires
  reinstating pause-after-each discipline first.
- Anti-pattern #44 generalization note inline on CLAUDE.md §11 #44
  (four-class evidence: PRs #241/#260/#277/#330)
- Sprint G v2 — interactive CTAs (broadcast, suggest match, etc.)
- Sprint G v2 — arrival/return split
- §4.D Waitlist + auto-confirm UI audit
- Admin Home IA Tier 3 design exercise (§4.L #18)
- Async-ordering tests for useAdminStats / useHomeRole /
  useAttendanceData / useActivities (TEST COVERAGE GAPS §11)

### §4.R — Thursday continuation (2026-05-20 morning NYC) — V-23 + Frank-reported loading bug arc

**Frame:** Continuation of the Wednesday session's "Continue with the
lean" under-load discipline. Substantive items executed from the
end-of-Wed locked Thursday plan, plus an in-session bug Frank surfaced
mid-execution.

**Shipped (in order):**
- PR #339, #340 — Coach + Admin home LoadingSkeleton gates (Thursday
  Action 1 from end-of-Wed letter)
- PR #341 — Anti-pattern #48 Framing C ledger lock (Thursday Action 2)
- PR #342 — V-23 iCal subscription URL: migration + edge function +
  UI three-phase build (Thursday Action 3; SHIPPED end-to-end)
- PR #343 — V-23 ledger reconciliation (PARTIAL → SHIPPED across
  §4.Q + §15 V-23 row + CLAUDE.md §8 Prompt 3-B) per anti-pattern #45
- PR #344 — Home loading-gate comprehensive fix (Frank-reported
  2026-05-20: admin home cascade-flash from single-signal gate).
  Extended all three role homes' isLoading gates to combine multiple
  loading signals; added homePageLoadingGateAudit invariant test per
  anti-pattern #43
- PR #345 — Brand-flash cached-colors fix (Frank-reported same
  session: Ember/Skyfire defaults rendering before AuthContext
  applies Legacy Hoopers brand_colors). New orgBrandingCache module
  with synchronous pre-mount CSS-var application; cache invalidation
  through registerCacheBuster registry → no AuthContext changes

**Bug-arc methodology note:** Frank's screenshot report named one
symptom ("old screens load in first") but the diagnosis surfaced TWO
distinct bugs at different layers — in-page cascade (PR #344) and
brand-flash (PR #345). The two were entangled in the same Capture
timeline but had different root causes. Split into two PRs rather
than one bundled fix: each PR's diff stays scoped to one concern,
each gets its own invariant test (homePageLoadingGateAudit for #344;
orgBrandingCache.test for #345), and the §15 auto-merge discipline
runs cleanly per PR. Reverse pattern of bundling worth registering
durably — the "two bugs, one symptom" framing is a recurring shape
worth pre-flighting on similar reports.

**Anti-pattern compliance:**
- #11 (150-line cap): all touched files under cap (149/145/145
  for #344; 67/56/41 for #345). PR #344 trimmed AdminHomePage's
  comment to land at 149 from 152.
- #21 (migration mirror), #23 (REVOKE order), #30 (helper mirroring),
  #31 (config.toml + audit) — all honored on PR #342
- #43 (cross-role invariant test): homePageLoadingGateAudit on
  PR #344 locks the multi-signal gate shape across all three role
  homes; orgBrandingCache.test on PR #345 covers the cache contract
- #44 (trace full pipeline before ruling at the gate): the cascade
  bug diagnosed by tracing each downstream-of-gate hook's loading
  state, not by inspecting the gate logic
- #45 (planning-doc reconciliation): PR #343 (V-23 docs) + this §4.R
  entry (PR #344 + #345 docs) ship reconciliation in the same
  coordinated set as the substantive code

**Cross-arc structural wins of Thursday morning:**
- 1 substantive feature shipped end-to-end (V-23 iCal subscription)
- 2 Frank-reported UX bugs closed with invariant tests
- 1 new audit test (homePageLoadingGateAudit, 6 cases)
- 1 new module with unit coverage (orgBrandingCache, 9 cases)
- AuthContext.jsx (pre-existing 164 lines over-cap) untouched —
  brand-flash fix wired through registerCacheBuster registry

**Next-session opener — clean read state (refreshed end of §4.R):**
- All §4.Q "next-session opener" items still apply, PLUS:
- §2 ACTIVE BUGS: 2 Frank-gated items only (unchanged)
- §4.D Sprint G: aggregate signal SHIPPED; v2 still deferred
- V-23: SHIPPED end-to-end (no follow-up)
- Loading-gate cascade: CLOSED across all three role homes
- Brand-flash: CLOSED with localStorage cache + pre-mount apply
- Anti-pattern #48 (original): still candidate, untested
- Anti-pattern #48' (modified, soft-ceiling): still candidate,
  awaits one more under-load session
- Anti-pattern #44 generalization note inline on CLAUDE.md §11 #44:
  still pending (queued from §4.Q)

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

### Propagation patterns locked 2026-05-21

- **Density-aware Card extraction (288 callsites)**
  Status: design call locked (Card v1 API decided 2026-05-21).
  Propagation arc: ~10-15 PRs across multiple sessions, gradual
  migration per surface (Records → Schedule → Event Detail → Briefings
  → Roster). First available no-urgent-work week as trigger. Per
  anti-pattern #42 (parallel-system buildup) — closes 288 instances of
  the same visual treatment that have drifted into 6+ variants. Pure
  function migration with cross-surface invariant test per #43.

- **A11y live regions across loading states**
  Status: pattern locked PR #438 (RecordsPage loading-state live region).
  Propagation: extend to other async-loading surfaces (BriefingsInbox,
  ScheduleListSections, RosterSection, FinancialsPage). Each surface gets
  `<div role="status" aria-live="polite">` for loading state announcement.
  Per anti-pattern #43 cross-surface invariant: if pattern recurs >3
  surfaces, extract a shared `<LoadingLiveRegion />` component.

- **Serial-merge-discipline-at-scale (workflow learning)**
  Origin: 2026-05-21 session (33 PRs merged with zero cross-PR
  interaction failures). Discipline: serial merges with smoke gates
  between PRs (not parallel batch-merging). Sequential rather than
  parallel batch-merging means each PR's effects are observed before
  the next lands. Scales to 30+ PR days without producing cross-PR
  regressions that smaller batches in earlier sessions exhibited.
  Registered as workflow learning — informs how future high-output
  sessions sequence PRs.

### Propagation patterns locked 2026-05-22 (post 49-PR L99 session)

- **Pattern ALPHA — anti-pattern #36 destructure cascade**
  Status: foundation half CLOSED (PR #448, 5 callsites) + edge function
  half CLOSED (PR #452, bundle) + **hooks half CLOSED (PRs #461 + #463
  + #464, Cluster 3 PR-A/B/C)**. Audit-test static-grep gate locked
  (PR #454). **Audit baseline reduced 50 → 32 across hooks (~17 sites
  closed across PR-A/B/C); remaining 32 sites are in surfaces not yet
  audited — `lib` utilities have 3 sites flagged in Batch 2b, deferred
  to future audit/sweep.**
  Each callsite follows the anti-pattern #36 pattern: destructure
  `error` alongside `data` + throw or log error before consuming data
  + `|| []` fallback only for empty-success case. Drift-hedge audit
  test (PR #454) catches regressions on land. With foundation + edge
  + hooks halves CLOSED, propagation is effectively complete for the
  shipped-code surface area; residual sweep is bounded.

- **Pattern BETA — aria-live regions**
  Status: foundation half CLOSED (PR #446) — toast, offline banner,
  unread badge each got `aria-live`. RecordsPage covered earlier
  (PR #438).
  Propagation queued: messaging surface remaining (DM thread + new-
  message surfaces); pattern extraction to shared `<LoadingLiveRegion />`
  per the earlier §5 entry's ≥3-surface threshold (now met).

- **Pattern DELTA — focus-visible (RECONCILED — false alarm)**
  Status: audit candidate raised, then withdrawn — global `:focus-visible`
  rule in foundation CSS already covers the surface. No propagation
  work needed; entry recorded so future audits don't re-raise the same
  concern.

- **Latent timezone bug — `coachRoundupHelpers` + `familyGuideHelpers`**
  EDT-only hardcoded offset (UTC-4) baked into helper code. Currently
  invisible because Frank is in EDT through the May-October window;
  trips silently Nov-Mar when NY shifts to EST (UTC-5). The result
  would be every briefing emitting times shifted +1 hour during the
  EST window. Fix: replace inline `-04:00` literal with a timezone-aware
  helper (`formatInTimeZone(date, 'America/New_York', format)` via
  `date-fns-tz` or equivalent). Drift-hedge per #43:
  `coachRoundupHelpers.tz.test.js` + `familyGuideHelpers.tz.test.js`
  using `vi.setSystemTime` to simulate EST dates. Trigger window: ship
  before 2026-11-02 (DST end). P1, not P0 — silent today, breaks
  silently on a calendar boundary.

- **Multi-tenant readiness — 3 P0 season-rollover blockers (NEW)**
  Surfaced from Batch 11 P0s in the L99 audit. SeasonRolloverPage +
  useSeasonRollover assume single-org context; 3 distinct multi-tenant
  blockers identified for routing forward (see §4.Z table for tags
  P0-E/P0-F/P0-G). Joins the §4.Y multi-tenant readiness arc; promotes
  PQ5 timeline forward if St. Patrick's onboarding accelerates.

### Watch lists updated 2026-05-22 PM (post extended Phase 2 + Phase 3 close)

- **Pattern ALPHA — anti-pattern #36 destructure cascade (status update)**
  Status unchanged from morning entry: foundation + edge function + hooks
  halves ALL CLOSED. Audit baseline 50 → 32. Remaining ~3 sites in `lib`
  utilities deferred to future audit/sweep (Batch 2b). No new sites
  introduced by today's extended Phase 2 + Phase 3 work (file-deletion
  sweeps, not data-layer additions).

- **Anti-pattern #52 refinement watch list (registered today via PR #465)**
  Edit tool path resolution — broke TWICE today on its registration day:
  - PR #460 (recovered mid-flight by agent — explicit-path discipline
    surfaced as a refinement-to-#52, captured in §14 discipline-notes)
  - PR #473 (parent-checkout leakage detected post-merge — agent reported
    explicit-path but the Edit tool still resolved against parent
    checkout for one file)
  Watch list: third break promotes to deeper investigation (Section A.4
  in remaining-phases audit doc — needs a structural answer beyond
  "explicit path in every Edit call").

- **Anti-pattern #54 watch list (promoted to registered today via PR #465)**
  Same-MCP-burst ready + auto-merge — broke ONCE today in 22+ consecutive
  holds:
  - PR #468 (shipped draft initially, manually flipped ready — no auto-
    merge fired in same burst as create_pull_request).
  Promotion mechanism was reliable across 21 holds before today's break;
  one slip in 22 attempts ≈ 4.5% break rate. Watch list: second break in
  the next 10 PRs triggers pause + document. If break rate stays under
  5% across the next 50 PRs, mechanism considered stable.

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
> - ~~`CoachHomePage.jsx` (likely close)~~ — SPLIT in §4.W (149 → 78)
> - `AdminHomePage.jsx` (142) — deferred per PQ3 (more headroom)
> - ~~`ParentHomePage.jsx`~~ — SPLIT in §4.W (149 → 79)
> - `formatters.js` (137 lines post-PR-#234, room left)
> - `useAttendanceData.js`
>
> §4.W also closed `AdminSeasonsPage.jsx` (145 → 71) which was at
> equal risk per the L99 platform audit PART 5 Phase 4 / PQ3.

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

1. ~~**`formatEventTitle(event)`** — solves Cluster 3 + multi-surface
   redundancy.~~ **DONE** (PR #298, 2026-05-19). Shipped at
   `src/lib/eventTitle.js` returning `{ prefix, body }`; flat-string
   sibling `formatEventTitleString`. Drift-hedge audit at
   `src/lib/__tests__/eventTitleAudit.test.js`.
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

### Helper-extraction candidates added 2026-05-22 (post L99 audit)

8. **`ORG_NAME_DEFAULT` + sibling constants — 8 copies across 7
   resolvers + `digestSend`** (Batch 8a P2-4 finding). Each resolver
   re-declares the org-name fallback string locally; if the canonical
   default ever changes (e.g., Skyfire → Ember rebrand), 8 files must
   change in lockstep. Extract to `src/lib/engine/resolvers/constants.js`
   + import everywhere. Drift-hedge static-grep audit.
9. **`formatDayLabel` + `formatTime` — 2 copies between Wave 5 PR 4b
   + PR 5b files** (Batch 8a P2-5 finding). Same helper logic duplicated
   across `coachRoundupHelpers.js` + `familyGuideHelpers.js`. Extract
   to shared `src/lib/engine/timeFormatters.js`. **NOTE:** ties to the
   §5 latent-timezone bug — the helpers' inline EDT offset is the
   same bug class; extraction is the natural moment to fix both.
10. **9 inline formatter duplicates across send helpers** (Batch 2b
    finding). Common patterns: phone number formatting, currency
    formatting, date-range labels. Inventory pending; estimate 9 sites
    across `*Send.js` files. Extract to `src/lib/formatters.js`
    (already canonical for date formatters).
11. **`CIRCUIT_LABELS` constant in 4 files** (Batch 7 P3-1 finding).
    Mapping of `circuit_type` enum to display label ("AAU (Zero Gravity)"
    / "League Play" / etc.). Lives in 4 files independently. Extract to
    `src/lib/constants.js` (where `TEAM_COLORS` already lives per
    CLAUDE.md §10).

Each extraction PR ships with:
- The helper / component
- Migration of all known callsites to the helper
- A drift-hedge audit test (static-grep flagging inline reimplementations)

This section is the operational target for "stop running audits."
When this list is empty, the structural drift surface area is
minimal.

### Discipline-notes adjacent to helper-extraction (added 2026-05-22)

These are not helper extractions but discipline observations from
agent-driven worktree work today. Captured here for the next
CLAUDE.md amendments PR.

- **Anti-pattern #52 refinement — explicit worktree path in Edit tool
  calls.** Per the parent prompt this session, anti-pattern #52
  (worktree-path pwd-first) needed refinement: `pwd` confirmation
  alone is insufficient when the Edit tool's path resolution defaults
  to the parent checkout even when `pwd` reports the worktree
  directory. Discipline: agents working in worktree-isolated context
  must use **explicit absolute worktree paths** (e.g.,
  `/home/user/skyfire-app/.claude/worktrees/agent-XXX/...`) in every
  Edit tool call, not just pwd-relative paths. Held cleanly across
  7/7 agents today. Refinement queued for the next CLAUDE.md
  amendments PR (parallel to this ledger PR).

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
| V-12 | `/admin/import-schedule` route partial status | §4.A PR 2 | this audit | 5 min | parser PR scope | **CLOSED 2026-05-22** — PR #173 (db82f99, 2026-05-15) shipped the full TourneyMachine schedule parser. Route live in `src/App.jsx:89` via lazy-loaded `ImportSchedulePage`. V-12 closure rolled in with §4.A PR 1+2+3 ledger reconciliation. |
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
| V-23 | M2-2 iCal subscription URL per team ship status | §4.B (calendar/iCal feeds) | CC_SESSION_HANDOFF_APR19.md (referenced; full read pending) | **SHIPPED 2026-05-20 Thursday (PR #342)** | iCal feed surface for parents/coaches | **SHIPPED end-to-end.** PARTIAL verification on Wed (PR #331) confirmed subscription URL not built; Thursday Action 3 from end-of-Wed letter shipped the three-phase build: (a) Migration `20260520093701_teams_add_feed_token_for_ical_subscription` added `teams.team_feed_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text` + `get_team_by_feed_token` SECURITY DEFINER RPC; (b) Edge function `team-feed` deployed v1 returning `text/calendar` ICS body keyed by token (verify_jwt=false in config.toml, audit test auto-detected the new function +2 tests); (c) `PublicSchedulePage` gained Subscribe to Calendar bottom sheet with webcal:// (Apple Calendar) + `calendar.google.com/calendar/r?cid=...` (Google Calendar) options. Anti-patterns honored: #21 (migration mirror), #23 (REVOKE PUBLIC before anon), #30 (ICS helpers mirrored from src/lib/icalHelpers.js into the edge function), #31 (config.toml entry + audit test). Production verified: 5/5 teams have unique tokens. |
| V-24 | EMBER_TENANCY Steps 5-14 completion vs Steps 1-4 closed | §4.H (pre-existing locked items) | EMBER_TENANCY_ARCHITECTURE_v3.md + April 25 chat handoff | 20 min | tenancy hardening arc | Read EMBER_TENANCY_ARCHITECTURE_v3.md (currently in V-0 unread set) + `git log --oneline --all \| grep -iE 'tenan\|ember.tenancy'` + verify Steps 5-14 line items against shipped commits |
| V-25 | Rides remediation 7.6-7.10 ship status | §4.D (Sprint G Rides redesign) | RIDES_DESIGN_SPEC.md §7.6-7.10 + April 29 Rides Fix chat | 15 min | Sprint G Rides arc completeness | Read RIDES_DESIGN_SPEC.md §7.6-7.10 (full read pending per V-14) + `git log --oneline --all -- src/components/ride src/hooks/useRide* src/hooks/useEventRide*` cross-ref |
| V-26 | PROMPT_ELITE_POLISH.md outcome | §4.G (quick wins / Elite polish) | docs/PROMPT_ELITE_POLISH.md (April 10-13 build sprint) | 15 min | Elite Polish arc completeness | Read PROMPT_ELITE_POLISH.md top-to-bottom + cross-ref ELITE-* tags against CLAUDE.md §16 + git log for sprint commits |
| V-27 | PROMPT_FUNCTIONAL_FEATURES.md (ToastContext + usePullToRefresh) ship status | §4.G | docs/PROMPT_FUNCTIONAL_FEATURES.md (April 13 chat) | 10 min | functional-features arc | `grep -rn 'ToastContext\|usePullToRefresh' src/` (both already shipped per repo state — confirm scope matched prompt doc) + read prompt doc for any unshipped sub-items |
| V-28 | PROMPT_NEXT_LEVEL.md outcome | §4.G | docs/PROMPT_NEXT_LEVEL.md (April 10-13 build sprint) | 15 min | next-level features arc | Read PROMPT_NEXT_LEVEL.md top-to-bottom + git log cross-ref for shipped sub-items + flag any unshipped items to §4.G as concrete tasks |
| V-29 | PR #21 disposition — coach contact in briefings (WIP draft, closed 2026-05-12 unmerged) | §4.N Layer 1 | Layer 1 git log audit 2026-05-18 evening | 10 min | Confirm A/B decision routed correctly; no orphaned ship | Read PR #21 body (A vs B framing) + grep `staff_profiles` + `coach_user_ids` + briefing renderer dynamic-coach-array code in `src/` to verify path A shipped through a different PR. If shipped: close V-29 with cite. If unshipped: re-scope to §4.G as concrete work item. |
| V-30 | BUG-005 ride duplicate-offer prevention — DB UNIQUE constraint + frontend edit-mode guard | §4.N Layer 5 / §4.E | SKYFIRE_BUILD_QUEUE_v2 §BUG-005 + Layer 5 catalog walk 2026-05-18 evening | 15 min | Confirm BUG-005 closed at both DB and UI layers | DB query confirmed Migration 025 (rides_redesign) applied BUT `event_ride_offers` has zero UNIQUE constraints — only PK + CHECKs. No `(event_id, guardian_id)` UNIQUE guard at DB layer. Frontend: `grep existingOffer\|hasExistingOffer src/` returned no matches → likely no edit-mode guard in RideFormOverlay. Both layers need verification: (a) is duplicate-offer prevention via a different mechanism (RLS policy / trigger / app-layer query)? (b) does RideFormOverlay check existing-offer state before insert? If both negative → re-scope to §4.D Sprint G as concrete work item. |
| V-31 | VAL-001 stale validation closure — Apr 23 11U Girls RSVP count anomaly (13 vs 10-12 roster) | §4.N Layer 5 | SKYFIRE_BUILD_QUEUE_v2 §VAL-001 (Apr 23, 2026) | 5 min | Confirm closed by Migration 022 duplicate deletion | Cite Migration 022 (`rls_privacy_lockdown_plus_roster_left_at`) verified applied; per CLAUDE.md §11.5 the migration deleted duplicate roster rows and added `left_at` for date-windowed eligibility. Verification: query `event_rsvps` for the Apr 23 11U Girls practice event_id, count distinct guardian responses, confirm matches current roster size. If duplicate count still anomalous → re-open with named follow-up. |
| V-32 | `AdminMembersPage` / Member-Family Directory build status | §4.N Layer 2 / §3-A extension | ADMIN_SESSION_SCOPE.md Tier 1 | 10 min | Determine if Tier 1 admin surface is complete or open | `ls src/pages/Admin*` confirmed: only AdminHomePage, AdminSeasonsPage, AdminTeamsPage, admin/BriefingHistoryDetail. No AdminMembersPage. Spec target: `/admin/members` route. Verify against ADMIN_SESSION_SCOPE.md Tier 1 P0 list; if genuinely unbuilt → new §4 sub-arc or §4.G entry. |
| V-33 | `AdminOpponentsPage` build / §3-A "Location + opponent mgr" completion | §4.N Layer 2 | ADMIN_SESSION_SCOPE.md Tier 1 + CLAUDE.md §8 (3-A PARTIAL) | 10 min | Determine §3-A completion path | CLAUDE.md §8 marks "3-A Location + opponent mgr" as ⚠ PARTIAL — locations seeded (9 venues), no mgmt UI. Same for opponents. Spec target: `/admin/opponents` route. Read CLAUDE.md §8 + verify locations mgmt UI ship status + opponents mgmt UI ship status; if both unbuilt → consolidate into §4 sub-arc (likely §4.G or new §4.O). |
| V-34 | `admin_audit_log` table determination vs existing `event_change_audit` | §4.N Layer 2 | ADMIN_SESSION_SCOPE.md + ledger schema inventory | 5 min | Resolve: do we need a new table or does `event_change_audit` suffice? | DB query confirmed `event_change_audit` exists; no `admin_audit_log`. Determine if the admin-audit-trail use case (operator action history) is covered by `event_change_audit` (event-row mutations) or needs a separate operator-action log. If separate → new schema migration item. If covered → V-34 closes with cite. |
| V-35 | LH_BRAND_CONTENT_MODEL Part 11 — 95% delight features triage | §4.N Layer 2 / §4.G or new §4.O | LH_BRAND_CONTENT_MODEL.md Part 11 | 20 min | Triage 10 delight feature candidates into §4.G quick wins, §4.C Sprint B-F, or P2 backlog | Read Part 11 in full + dispatch each of 10 candidates (auto-badging, tournament archive, "Run of Play", Quick Score propagation, Winter archive, achievement timelines, arrival reminders, RSVP countdown, "Car Ride Home" toast, Academy handbook in-app) to appropriate ledger section. Most are P1 polish; expect majority absorbed into §4.G or §4.C, 2-3 net new §4 entries. |
| V-36 | EMBER_TENANCY v3 Steps 11-13 deferral status (V-24 sub-finding) | §4.N Layer 2 / V-24 sub | EMBER_TENANCY_ARCHITECTURE_v3.md Section 22 | 5 min | Confirm Steps 11-13 explicit deferral captured in V-24 scope | Per agent 3 read: v3 Section 22 explicitly defers Steps 11-13 (BrandTransition animation, Coach welcome card dismissible via localStorage, Admin welcome + 4-item checklist). Document as V-24 sub-deferral so future V-24 closure attempts don't expect these Steps. No new work; just sub-tracking. |
| V-37 | 5c-VALIDATE findings batch — Family Guide actor validation follow-ups | §4.N Layer 2 / §4.A PR 5 follow-up | AUDIT_DAY_2026-05-16_FINAL_CLOSE.md + STATE_OF_AFFAIRS_L99_v5.md | 30 min orig → **CLOSED 2026-05-19 (PR-queue path)** | Was: resolve 6 enumerated findings from Frank's actor validation send. Now: ✅ all 3 sub-PRs merged. | **CLOSED 2026-05-19.** Original premise (Frank reads send, fills findings) invalidated: the May 16 admin@ send never actually happened. Replaced with PR-queue path: 5b-1 (PR #264) + 5b-3 (PR #265) + 5b-2 (PR #266) all merged 2026-05-19. Family Guide CODE-PARTIAL → CODE-COMPLETE, ACTOR-VALIDATION-PENDING (symmetric with PR 4 framing). Acceptance criteria (a) all 3 sub-PRs merged ✓; (c) findings checklist re-walked against successive preview renders ✓; (b) actor validation send still pending Frank's wizard click — that's the only remaining gate, tracked via §4.A PR 5 status flip to SHIPPED. Full closure narrative in §4.N.6. |
| V-38 | Audit-day May 16 P2 carryovers — consolidated 8-item batch | §4.N Layer 2 / §4.L extension | AUDIT_DAY_2026-05-16_FINAL_CLOSE.md P2 carryover list | 60 min | Triage 8 P2 items into individual §4 entries or single quick-wins batch | Items: (a) localStorage fallback cleanup, (b) BriefingComposer state reset on close, (c) useHasUnread channel name reconciliation, (d) RecordsPage cross-org count, (e) useAcademyCallupCandidates auth context, (f) FK CASCADE gaps on 2 tables, (g) `briefing_templates.org_id` nullable cleanup, (h) legacy renderer dead code removal. Each is small (<30 LOC). Recommend batching as single multi-PR "audit-day P2 sweep" or absorbing into §4.L. No individual V-* per item — would fragment. |
| V-39 | Tier 3 V2 performance items — polling cost + per-team useAttendanceData mount cost | §4.N Layer 2 / §4 Phase 2 backlog | TIER_3_V1_RETROSPECTIVE_NOTES.md "Performance Items for V2" | 5 min | Confirm tracking — not actionable today, V2 deferred | Two named items: (1) 60s home page client polling cost — trigger = simultaneous-open spike OR org 500+ users; path = edge function with shared cache OR cron-cache table. (2) Per-team `useAttendanceData` mount cost scaling linearly — trigger = coach 10+ teams OR mobile load >3s; path = batched `useAttendanceData(teamIds[])` hook. Add as backlog markers (no immediate action); becomes V-39's named cite for when triggers fire. |

### Layer 5 findings (2026-05-18 evening — §4.N audit, 22-bug catalog walk)

Layer 5 of the §4.N Two-Week L99 Audit executed in continuation of Layer 1's soft start. Mechanical bug-by-bug status check against the catalog in `docs/SKYFIRE_BUILD_QUEUE_v2.md §🐛 Open Bugs & 95% UX Audit` (logged Apr 23, 2026). Catalog count is **25 items**, not exactly 22 — the "22-bug catalog" framing in §4.N was approximate. Distribution: 5 P0 BUGs + 14 P1 UX gaps + 1 validation + 5 P0 RLS holes.

**Per-bug closure status:**

| Bug | Catalog severity | Status | Evidence cite | Routing |
|-----|------------------|--------|---------------|---------|
| BUG-001 (Admin NextEventCard data) | P0 | EXISTS-IN-CODE; render verification owed | `src/components/admin/NextEventCard.jsx:23` exports default function | Already tracked: **V-4** |
| BUG-002 (Duty count 2/2 vs 1+1) | P0 | LIKELY FIXED — hook correctly distinguishes `claimed_by_name OR guardian_id` | `src/hooks/useEventDutyCounts.js` aggregation logic correct vs original bug hypothesis | Already tracked: **V-5** |
| BUG-003 (Ride summary undercount) | P0 | LIKELY FIXED — hook uses `seats_offered/seats_requested/seats_needed` (SUM not COUNT) | `src/hooks/useEventRideCounts.js:18-22` uses correct seat-count columns | Already tracked: **V-6** |
| BUG-004 (Same-user offer+request) | P1 | UNVERIFIED — no frontend guard found via grep; DB CHECK status unknown | No `existingOffer\|sameUserGuard` matches in `src/components/ride/RideFormOverlay.jsx` | Already tracked: **V-7** |
| BUG-005 (Duplicate ride offers) | P1 | PARTIALLY OPEN — Migration 025 applied but DB has zero UNIQUE constraints on `event_ride_offers`; frontend guard not found | DB query: only `event_ride_offers_pkey` + 5 CHECKs, no `UNIQUE(event_id, guardian_id)`. Grep: no `existingOffer` matches. | **NEW V-30** |
| UX-001 to UX-006 (parent Next Up CTAs / countdown / multi-child) | P1 | UNSHIPPED — Sprint B-F arc | No grep evidence for any of the 6 UX items | Absorbed into **§4.C** (Sprint B-F Home Page completion). No individual V-* needed. |
| UX-007 to UX-010 (coach Next Up enrichment) | P1 | UNSHIPPED — Sprint D arc | No grep evidence for `StaffRSVP`, `Start Check-In`, etc. | Absorbed into **§4.C** (Sprint D within Sprint B-F). No individual V-* needed. |
| UX-011 (admin multi-event dashboard) | P1 | UNCERTAIN — AdminHomePage exists but redesign extent unknown | `src/pages/AdminHomePage.jsx` shipped, but per UX-011 spec "needs full redesign" not "small fix" — extent unclear | Absorbed into **§4.C** (Sprint E). No individual V-* needed. |
| UX-012 (admin operational alerts strip) | P1 | **SHIPPED** | `src/pages/AdminHomePage.jsx:53` mounts `<AlertZone ... sectionLabel="ALERTS" />` via Tier 3 v1 PR #229 | Closed by Tier 3 v1 alert framework. |
| UX-013 (achievement queue indicator) | P1 | UNSHIPPED — gated on Migration 018 UI | No grep evidence | Absorbed into **§4.C** Sprint E. No individual V-* needed. |
| UX-014 (notification audit trail) | P1 | UNSHIPPED — gated on Migration 019 UI | No grep evidence | Absorbed into **§4.C** Sprint E. No individual V-* needed. |
| VAL-001 (Apr 23 RSVP count anomaly) | Validation | LIKELY CLOSED by Migration 022 | Migration 022 (`rls_privacy_lockdown_plus_roster_left_at`) verified applied; deletes duplicate roster rows + adds `left_at` for date-windowed eligibility | **NEW V-31** (one-query cite confirmation) |
| HOLE-001 (`guardians`) | P0 RLS | **CLOSED** | `relrowsecurity=true`, 6 policies | Migration 022 |
| HOLE-002 (`player_guardians`) | P0 RLS | **CLOSED** | `relrowsecurity=true`, 3 policies | Migration 022 |
| HOLE-003 (`players`) | P0 RLS | **CLOSED** | `relrowsecurity=true`, 7 policies | Migration 022 |
| HOLE-004 (`roster_members`) | P0 RLS | **CLOSED** | `relrowsecurity=true`, 7 policies | Migration 022 |
| HOLE-005 (`tournament_pool_teams`) | P0 RLS | **CLOSED** | `relrowsecurity=true`, 2 policies | Migration 022 |

**Synthesis:**

- **Verified CLOSED with evidence: 6 items** (UX-012 + HOLE-001-005). 5 closed by Migration 022; 1 closed by Tier 3 v1 PR #229.
- **Likely closed pending narrow re-check: 3 items** (BUG-002, BUG-003 via hook-content inspection; VAL-001 → V-31 cite-confirm).
- **Already in §15 queue from prior arcs: 4 items** (BUG-001-004 → V-4-V-7). Layer 5 re-confirms tracking, no duplicate V-* added.
- **NEW V-* added: 2** (V-30 BUG-005 partial-open, V-31 VAL-001 cite-confirm).
- **Absorbed into §4.C Sprint B-F arc: 11 items** (UX-001-011 + UX-013-014). No individual V-* added — Sprint B-F completion is the unit of work, not per-UX-item.

Net new V-*: 2 (V-30, V-31). Significantly below §4.N's L5 sizing prediction (+18-22). The reason: most catalog items either (a) verified closed at grep time, (b) already in V-* queue from prior arcs, or (c) absorbable into existing §4.C arc rather than individual V-*. Layer 5 closes "named uncertainty" by confirming the 22-bug catalog is mostly addressed; the residual is concentrated in Sprint B-F Home Page completion (§4.C) rather than scattered open bugs.

**Layer 5 sign-off conditions check:**

- ✅ Anti-pattern #45 compliance — findings → ledger same commit (this PR)
- ✅ Findings count + ledger-growth report → 2 new V-* (V-30, V-31), 1 findings block (~70 lines with status table)
- ✅ Strategic arc routing decision: residual bug-catalog work consolidates into §4.C (Sprint B-F completion) — no fragmentation into per-bug V-*
- ✅ Closes "named uncertainty" raised in 2026-05-18 session-end audit (was: only 4 of 22 in §15; now: 4 in §15 from prior + 2 new = 6, but **also**: 6 verified closed + 11 absorbed = 23 of 25 accounted for, 2 truly new)

**Layer 5 effort actual:** ~25 minutes (matches §4.N estimate of 20 min with small SQL roundtrip overhead).

### Layer 2 findings (2026-05-18 evening — §4.N audit, doc-diff sweep bounded by mtime > May 4)

Layer 2 of the §4.N Two-Week L99 Audit executed via three parallel `Explore` sub-agents reading clustered doc subsets. Methodology delegation per anti-pattern #45 acid-test: findings → ledger same commit; sub-agent constraint hallucinations flagged transparently rather than retried indefinitely.

**Sub-agent execution outcomes:**

| Cluster | Docs | Outcome |
|---------|------|---------|
| Audit/briefing (16 docs) | Phase 1-5 + Beta + Synthesis + Verification + Briefing references | Partial — agent self-aborted at doc 3 citing a tool-use constraint that wasn't in the prompt (hallucination). Of 3 docs completed (Phase 1, 2, 3), **0 new findings** — all already captured in §4.M.1-§4.M.3. CC spot-read Phase 4 + Phase 5 doc heads directly, confirmed same reconciliation pattern continues. Audit-cycle cluster judged fully reconciled in §4.M without need to re-launch agent. |
| Handoff/state (7 docs) | CC_SESSION_HANDOFF + COUNTER_PLAN + STATE_OF_AFFAIRS + CUTOVER_WAVE_GAP_AUDIT + REACT_HOOKS_71_TRIAGE + AUDIT_DAY_FINAL_CLOSE + TIER_3_V1_RETROSPECTIVE | Complete — agent returned state-of-affairs synthesis (not the requested delta format) but contents minable for items. CC verified each candidate against ledger before adding. **Net:** 4 genuine new items (V-37, V-38, V-39, §4.A status correction). |
| Spec/reference (5 docs) | ADMIN_SESSION_SCOPE + LH_OPS_SPEC + EMBER_TENANCY_ARCHITECTURE_v3 + LH_BRAND_CONTENT_MODEL + README | Complete — agent returned 28 candidate items. CC verified each against current DB schema + code state. **False positives filtered:** `game_results` exists (Migration 010), `tournaments` first-class exists, `team_achievements` exists (Migration 018), `staff_profiles` exists, `opponents` exists, calendar sync ICS already tracked as V-23, agent's "Migrations 1-5 missing" claim fully reduced to false positive. **Genuine new:** 5 items (V-32, V-33, V-34, V-35, V-36). |

**§4.A status correction (inline):** Layer 2 cross-reference with Layer 1 git log revealed §4.A status was stale. PR 4 (Coach Roundup) shipped 2026-05-16 via PRs #185/#186/#187. PR 5 (Family Guide) shipped 2026-05-16 via PRs #217/#219/#220. Updated §4.A in-place to mark PRs 4 + 5 SHIPPED with cites. PRs 1, 2, 3, 6, 7 remain OPEN. PR 5 5c-VALIDATE follow-ups extracted to V-37.

**Per-doc reconciliation status (28 total docs in window, mtime > 2026-05-04):**

| Status | Count | Examples |
|--------|-------|----------|
| Fully reconciled in §4.M | 11 | Phase 1-5 audit docs, Beta B1/B3/Synthesis, Audit Synthesis, AUDIT_DAY_CLOSE, AUDIT_VERIFICATION |
| Already absorbed in §4.A/§4.B/§4.C/§4.G | 6 | CUTOVER_WAVE_GAP_AUDIT (PR 1-7 = §4.A), STATE_OF_AFFAIRS_L99_v5 (audit-day status), CC_WAVE_4_4_COUNTER_PLAN (4.4-C2 sequence), CC_SESSION_HANDOFF_2026-05-13 (PostHog work, hooks triage), REACT_HOOKS_71_TRIAGE (16/16 closed May 15), AUDIT_DAY_FINAL_CLOSE (top-level synthesis of audit-day work) |
| Reference docs, no action items | 3 | README.md, BRIEFING_RENDERER_REFERENCES.md, BRIEFING_TEMPLATES.md |
| V-* already tracking | 3 | V-23 ICS feed, V-24 EMBER_TENANCY Steps 5-14, V-22 maybeSingle (closed PR #251) |
| Spec docs surfacing new items | 3 | ADMIN_SESSION_SCOPE (→ V-32, V-33, V-34), LH_BRAND_CONTENT_MODEL (→ V-35), EMBER_TENANCY_ARCHITECTURE_v3 (→ V-36 sub-tracking) |
| State docs surfacing new items | 2 | AUDIT_DAY_FINAL_CLOSE P2 carryovers (→ V-38), TIER_3_V1_RETROSPECTIVE Performance (→ V-39) |

**Findings synthesis:**

- **§4.A status drift caught.** PR 4 + PR 5 shipped May 16; ledger still marked "NOT STARTED" — exactly the drift class that anti-pattern #45 was registered to prevent. The fact that this drift survived Sunday's PR #246 May 16 Audit Cycle reconciliation suggests §4.A wasn't audited against git log at that point. Layer 1's git log cross-reference was the structural inverse of this blind spot — finding paid off in Layer 2 synthesis.
- **5c-VALIDATE findings are the highest-value Layer 2 item.** V-37 captures 6 enumerated polish findings from Frank's actor validation send on the Family Guide ship. These are likely the next concrete follow-up PRs for §4.A; resolving them advances the Cutover Wave further toward production readiness.
- **Sub-agent hallucination class (anti-pattern candidate #47?):** Both Explore agents launched independently reported a "tool-use constraint" that wasn't in the prompts. The constraint appears to be a sub-agent-side artifact (possibly a recent system-message injection sub-agents are misinterpreting). Worth registering as anti-pattern if it recurs — for now, single-agent retries didn't resolve it; CC fallback to direct reads worked. Future Layer 2-style sweeps should budget for sub-agent unreliability and have a CC-direct fallback path.
- **False-positive rate on agent 3 sub-agent: 23 of 28 (82%).** The agent's "missing from ledger" flag conflated "not explicitly mentioned in ledger" with "not yet built". Many spec doc references to schema items are descriptive (the items exist; spec just describes them). CC verification via Supabase MCP `information_schema.tables` query was the right filter. Reinforces anti-pattern #42 / #43 framing on sub-agent outputs.
- **Layer 2 found 8 net new V-* items (V-32 through V-39).** Matches §4.N's L2 prediction range (+5-10). Items skew P1/P2; none are P0-blocking — consistent with the audit's "completeness check, not bug discovery" thesis.

**Layer 2 sign-off conditions check:**

- ✅ Anti-pattern #45 compliance — findings → ledger same commit (this PR)
- ✅ Findings count + ledger-growth report → 8 new V-* (V-32-V-39) + 1 §4.A inline correction + 1 findings block (~80 lines)
- ✅ Strategic arc routing decision: 5c-VALIDATE findings (V-37) gate Cutover Wave forward progress; admin-pages items (V-32, V-33) consolidate into a future §4.O or absorb into §4.G
- ✅ Bounded version of Monday-opener Phases 1-3 — Layer 2 closes the V-0 "22 unread docs" inventory work (most absorbed into §4.M; remainder triaged via V-32-V-39)

**Layer 2 effort actual:** ~50 minutes (matches §4.N estimate of 45-60 min). Sub-agent parallelism + CC verification overhead balanced.

### Layer 2 validation pass (2026-05-18 evening — L99 shipped-vs-open determinations)

Per Frank's routing: validate the 8 Layer 2 findings (V-32 through V-39) to confirm shipped vs unshipped status, so Monday opens with a clean actionable list rather than uncertain V-* items. L99 fidelity: each V-* gets a direct code-grep + DB-query verification, not gate-only inference.

**Per-V-* validation result:**

| V-* | Item | Validation method | Status confirmed | Routing for Monday |
|-----|------|-------------------|------------------|---------------------|
| V-32 | AdminMembersPage | `ls src/pages/Admin*` → only AdminHomePage, AdminSeasonsPage, AdminTeamsPage. No grep matches for `admin/members` route, `AdminMembersPage`, or `MembersDirectory`. | **UNBUILT (CONFIRMED).** | Promote to **new §4.O — Admin Manager Pages**; merge with V-33 as a single arc. Concrete deliverable: `AdminMembersPage.jsx` + `/admin/members` route + guardian/player directory query. |
| V-33 | AdminOpponentsPage + LocationsManager | No grep matches for `admin/opponents`, `AdminOpponentsPage`, `OpponentManager`, `admin/locations`, `AdminLocationsPage`, `LocationsManager`. CLAUDE.md §8 marks 3-A PARTIAL. | **UNBUILT (CONFIRMED).** Both opponent and location mgmt UI absent. | Promote to **§4.O** alongside V-32. Closes the §3-A PARTIAL line in CLAUDE.md §8. Concrete deliverables: AdminOpponentsPage.jsx + AdminLocationsPage.jsx + routes. |
| V-34 | admin_audit_log vs event_change_audit | DB query: `event_change_audit` columns = `(id, org_id, event_id NOT NULL, changed_by, changed_at, change_kind, recurrence_scope, before_jsonb, after_jsonb, dispatch_email_id)`. Scoped to event-row mutations only. | **DESIGN GAP CONFIRMED.** `event_change_audit` covers event mutations; non-event admin actions (member edits, settings changes, payment edits) are unaudited. | Stays open as a **design call**: (a) build separate `admin_audit_log` for general operator actions, (b) extend `event_change_audit` schema to be generic with optional event_id, or (c) accept unaudited non-event admin actions today. Recommend (a) for separation-of-concerns + simpler RLS. Nominate for Monday's product-judgment review. |
| V-35 | LH_BRAND_CONTENT_MODEL Part 11 — 10 delight features | Code-grep on 5 spot-checked features. Results: auto-badge UNBUILT (only static "Nationals Qualified" label exists), Run of Play UNBUILT, Arrival protocol UNBUILT, RSVP countdown PARTIAL (tournaments have `rsvp_deadline_at` + nudge config in `AutoNotificationSettingsSheet`, but no urgent visual banner), Car Ride Home toast UNBUILT. | **9 UNBUILT + 1 PARTIAL of 10.** | Re-scope to **§4.G** as a 10-item batch entry titled "LH_BRAND_CONTENT_MODEL Part 11 95% delight features". Each ranks P1 polish; none are P0-blocking. Recommend cherry-picking 2-3 for Sprint B-F absorption (the rest stay backlog). RSVP countdown PARTIAL — the missing urgent visual banner becomes a concrete sub-item under §4.J Weather/notification arc. |
| V-36 | EMBER_TENANCY v3 Steps 11-13 deferral | Doc read confirmed Section 22 line 220: *"Minimum-viable tonight: steps 1-10. Steps 11-13 (BrandTransition, coach welcome, admin checklist) can defer."* | **EXPLICIT DEFERRAL CONFIRMED in source doc.** | Closes as **documentation-only sub-finding under V-24**. No action required; V-24 closure attempts should expect Steps 5-10 as the completion target, with Steps 11-13 explicitly out of scope until brought back via separate decision. |
| V-37 | 5c-VALIDATE findings batch | Doc read: AUDIT_DAY_2026-05-16_FINAL_CLOSE.md line 65 = *"[CONFIRMATION + FINDINGS TO BE FILLED ON FRANK'S READ — render quality on VIP header tone, kid color (Charlie 11U Girls violet / Milo 8U Boys amber), quick link nav rows, day-grouped events, conflict callouts, brand footer.]"* | ✅ **CLOSED 2026-05-19.** Was Frank-gated, then PR-queue-gated, now closed: 5b-1 (#264) + 5b-3 (#265) + 5b-2 (#266) all merged 2026-05-19. Cross-surface invariant tests per #43 lock the fixes against future drift. Actor validation send is the only remaining gate, but that's tracked at §4.A PR 5 status (CODE-COMPLETE → SHIPPED), not as V-37 acceptance criteria. See §4.N.6 for V-37 close narrative. | n/a — closed. |
| V-38 | Audit-day May 16 P2 carryovers — 11 items (originally 8 per Layer 2 framing; doc read found 11) | Full P2 list from AUDIT_DAY_2026-05-16_FINAL_CLOSE.md lines 93-118: items 8-18 (useWeather signout cleanup, BriefingComposer state reset, useHasUnread channel name, RecordsPage cross-org count, useAcademyCallupCandidates auth, 2 FK CASCADE gaps, briefing_templates nullable, legacy renderer dead code, anti-patterns #37/#38 CLAUDE.md, Admin Home IA Tier 3). | **10 OPEN + 1 CLOSED.** Item 17 (anti-patterns #37 + #38 CLAUDE.md) already CLOSED — both registered in CLAUDE.md §11. | Re-scope V-38 to **10 actionable items** as a single "audit-day P2 sweep" entry in §4.L. Each is small (<30 LOC); recommend batching as one multi-commit PR Monday. Item 18 (Admin Home IA Tier 3) is a design exercise, splits out separately. |
| V-39 | Tier 3 V2 performance items | Code-grep: `useAttendanceData` confirmed consumed by CoachRosterSnapshotTeam in a per-team loop pattern (line 49). 60s polling exists in `useNow.js:15` + `useAlertEvaluator.js:38`. | **CONFIRMED real concerns + V2 triggers not yet fired.** Org currently <500 users; no mobile-load >3s reports. | Stays as **documented backlog markers** under new §4 sub-arc or §4.G "V2 perf watchlist". Not actionable today; triggers (org 500+ users OR coach 10+ teams OR mobile load >3s) become V-39 close conditions. |

**Monday-actionable summary:**

**§4.O — Admin Manager Pages (NEW sub-arc, P1 build):**
- AdminMembersPage.jsx + `/admin/members` route (V-32 promoted)
- AdminOpponentsPage.jsx + `/admin/opponents` route (V-33 promoted)
- AdminLocationsPage.jsx + `/admin/locations` route (V-33 promoted, closes §3-A PARTIAL)

**§4.A PR 5 follow-ups (Frank-gated, V-37):**
- 6 named 5c-VALIDATE findings: VIP header tone, kid color rendering, quick link nav rows, day-grouped events, conflict callouts, brand footer
- Frank reads May 16 admin@ Family Guide send → fills findings → 1-6 follow-up PRs

**§4.L audit-day P2 sweep (V-38, single multi-commit PR):**
- 10 items (8-16, 18 from FINAL_CLOSE list; item 17 already closed)

**§4.G batch additions (V-35, P1 polish):**
- 9 UNBUILT delight features (auto-badge, Run of Play, Arrival reminders, Car Ride Home, Tournament archive, Quick Score propagation, Winter archive, Achievement timelines, Academy handbook in-app)
- 1 PARTIAL feature: RSVP countdown urgent banner → routes under §4.J

**Design call (V-34, P2 product judgment):**
- admin_audit_log: separate table vs extend event_change_audit vs accept gap

**Documented backlog (V-36, V-39):**
- V-36: EMBER_TENANCY Steps 11-13 explicit deferral — no action
- V-39: V2 perf watchlist (polling cost, useAttendanceData per-team) — trigger-gated

**Validation pass net result:**
- 8 V-* items validated to **L99 fidelity**
- 4 V-* promote to concrete §4 build entries (V-32, V-33, V-35, V-38)
- 2 V-* stay open as forward gates (V-37 Frank read, V-34 design call)
- 2 V-* close as documentation/backlog (V-36 deferral confirmed, V-39 trigger-gated)
- 1 V-* finding already CLOSED at validation time (V-38 item 17)

**Validation pass effort actual:** ~30 minutes. Brings total Layer 2 to ~80 min — above §4.N's 45-60 min estimate, but L99 validation depth was added to the original scope per Frank's routing.

**Tomorrow's plan opens clean:** Monday-opener now starts from concrete action items (5 named admin pages, 6 named Family Guide findings, 10 named P2 cleanup items, 9 named delight features) rather than 8 abstract verification queue entries.

### §4.N.2 — Claude AI pressure-test resolutions + Monday-opener sequence lock (2026-05-18 ~20:30 CEST)

Captured post-session-recap exchange with Claude AI. Five open questions raised in the recap got direct answers; Monday-opener sequence locked at 4 actions. Per anti-pattern #45 acid-test: structural plan refinement happens in chat → ledger reconciliation owed same session. Captured here so Monday-morning Frank reads concrete decisions, not chat-archaeology.

**Q1 — Anti-pattern #47 (sub-agent constraint hallucination) promotion criterion:** HOLD as candidate, do not promote tonight. Two data points isn't a pattern. Mitigation (CC fallback to direct reads) worked. **Promotion trigger:** third occurrence OR same class on Monday's Layer 4 sub-agent usage. Cost of bounded retry (~10 min) is less than cost of anti-pattern catalog bloat if rule doesn't repeat. **Status:** observation-only, monitor Monday.

**Q2 — V-34 admin_audit_log design call:** **PATH (a) LOCKED — separate `admin_audit_log` table.**
- Path (b) extend `event_change_audit` to be generic: rejected. Recreates anti-pattern #42 risk in reverse (parallel-system buildup via expanding scope). Table name + columns are event-scoped; generic-ifying = rename + nullable FKs + RLS expansion = rewrite with backward-compat baggage.
- Path (c) accept unaudited admin actions: rejected. Non-starter once §4.O ships three admin manager pages — those produce admin actions needing audit trails for the same reasons event mutations do (compliance, debugging, multi-tenant attribution).
- Path (a) lock specifics: separate table, generic shape day-one, no migration of existing `event_change_audit` data. The two tables coexist with clear semantic boundaries. **Schema design caveat (LOAD-BEARING):** `org_id NOT NULL` + RLS via `current_user_org_id()` pattern that doesn't recurse on `org_members` (per CLAUDE.md anti-pattern #11.1). Skip that and we're back here in 3 weeks.

**Q3 — V-37 Frank-gated 5c-VALIDATE findings priority pin:** **MONDAY ACTION #1 — clear V-37 FIRST.** Even before Layer 3 chat scan. Cost of running L3 / L4 with V-37 still open: any new chat-surfaced briefing-arc decisions might conflict with whatever Frank decides on the 5c-VALIDATE read. Sequence: Frank reads May 16 admin@ Family Guide actor-validation send → fills findings → 1-6 follow-up PRs land in §4.A. Until that gate clears, §4.A PR 5 follow-up cycle is blocked.

**Q4 — §4.O AdminManagerLayout design call:** **LEAN UNIFIED wrapper. Locked design parameters:**
- New `src/components/admin/AdminManagerLayout.jsx`: 80-120 lines, owns page header (Inter font, brand cobalt accent, breadcrumb back) + search + Add CTA + tabs slot (Active/Archived if needed) + empty state
- Each of 3 child pages: 80-100 lines, mounts layout, supplies own table + form sheet + data hooks
- **NOT in scope tonight:** pulling existing `AdminSeasonsPage` + `AdminTeamsPage` into the wrapper. Sample-of-two is not precedent — those pre-date the design discipline. New code uses new layout; old code stays as-is until independent refactor reason emerges. Anti-pattern #42 (parallel-system buildup) caution: don't refactor what works just because new pattern exists.
- ~~**Design call to confirm Monday before code:** does AdminManagerLayout absorb the page header, or does each page render its own header and the layout only owns the body? **CC recommendation: header included** — visible-consistency win is what drove unified call.~~ **LOCKED 2026-05-19 — header included** (Monday-opener Action 2 close; see §4.N.4). AdminManagerLayout owns the page header. Child pages mount the layout and supply body content only — no per-page header rendering. The visible-consistency win across the 3 new admin manager pages (Members / Opponents / Locations) drives the unified call; cost of a future "this page needs a custom header" exception is low (escape hatch via optional prop later if a real need surfaces).

**Q5 — Layer 3 chat-side query list:** Frank runs Tier 1 queries first via `conversation_search`; if Tier 1 yields <5-10 distinct items, run Tier 2; Tier 3 only if `recent_chats` walk surfaces unexpected gaps.

```
Tier 1 (highest signal):
  "decision locked"
  "park this"
  "queued for next session"
  "next session"
  "TODO" + date range filter to May 4-18

Tier 2 (medium signal):
  "remind me to"
  "we'll do that later"
  "added to backlog"
  "deferred"
  "let me write that down"

Tier 3 (long-tail, only if walk surfaces gaps):
  "we discussed"
  "yesterday we"
  "last session"
  "you mentioned"
```

The `recent_chats` sequential walk over May 4-18 is the validation pass — if `conversation_search` returns thin results from Tier 1+2 (<5-10 items), the walk confirms thin = actually thin. If rich (15+ items), walk catches what's missing.

**Monday-opener locked 4-action sequence:**

```
Action 1 (Frank-side, ~15 min, FIRST)
  V-37 clearance — read May 16 admin@ Family Guide actor-validation send,
  fill 5c-VALIDATE findings, route each into PR scope or "acceptable as
  shipped" buckets

Action 2 (CC + Frank, ~20 min, after V-37)
  §4.O design call — confirm AdminManagerLayout scope locked above;
  decide page-header-included-in-layout vs each-page-renders-own
  (CC recommends included)

Action 3 (Frank chat-side, ~45-60 min Frank time, parallel-ready)
  Layer 3 execution — Tier 1 conversation_search queries → recent_chats
  walk validation. Yield → ledger amendments same-session per #45.

Action 4 (CC, ~60-90 min, PEAK ENERGY SLOT)
  Layer 4 execution — production verification sweep over §1 SHIPPED
  items in window. Anti-pattern #44 applied retroactively per item.
  5-15 items @ 5-10 min each. SLOT: hour 3-4 of Monday session when
  fresh on prod state. If energy wrong by hour 3-4, DEFER to Tuesday
  rather than rush. The audit-cycle commitment is "all 5 layers merged
  with #45 compliance" — session goal, not calendar deadline.
```

**Strategic three-arc routing (post-Action 4):**

After all 5 §4.N layers close, Monday-to-Wednesday plan converges on three coherent arcs:
1. **§4.A PR 5 follow-up cycle** ✅ — V-37 fully closed 2026-05-19 (§4.N.3 + §4.N.6); all 3 sub-PRs landed (5b-1 #264 + 5b-3 #265 + 5b-2 #266). PR 5 flipped CODE-PARTIAL → CODE-COMPLETE, ACTOR-VALIDATION-PENDING. Only Frank's actor validation send remains to flip → SHIPPED.
2. **§4.O admin managers build** — three pages on the locked layout pattern
3. **§4.C Sprint B-F start** — the strategic question after the first two. Layer 5's framing inversion ("residual concentrates in Sprint B-F") makes this the next architectural priority, not a parked arc.

**Sprint G (Rides redesign) stays deferred** behind these three. §4.D content remains accurate but lower-priority than the three above.

**Tonight's true sign-off:** every structural decision from the Claude AI exchange now lives in §4.N.2. Monday-morning Frank reads concrete actions in the ledger, not chat history. Anti-pattern #45 acid-test cycled 9 times tonight (8 PRs + this amendment), held every time.

### §4.N.3 — Monday-opener Action 1 (V-37 unblock) close + Family Guide structural-gap findings (2026-05-19)

Action 1 (V-37 clearance) executed Monday morning per §4.N.2 sequence. **Outcome: V-37 unblocked, but not by Frank reading a send — by CC discovering the send never happened.** The Frank-gated framing was structurally wrong; the gate was actually upstream.

**Execution path:**

1. **CC opened V-37 by querying the source artifact.** Goal: surface the May 16 admin@ Family Guide send body_html via Supabase MCP so Frank read source-of-truth, not mailbox-archaeology. Setup time elimination.
2. **Query returned zero rows.** No `family_guide` entries in `comms_messages` at any status. Three explanations enumerated: (a) send never fired; (b) bypass path through alternate code; (c) kind value mismatch with schema.
3. **Diagnostic ruled out (b) + (c).** `comms_messages_kind_check` confirmed `family_guide` in enum (eliminates c). `comms_message_recipients` zero rows May 15-18 of ANY kind (eliminates b — any send path would populate this table). Latest send activity (any kind) was May 11. All May 12-18 activity is cron-generated drafts with `sent_by IS NULL`. Conclusion: (a) confirmed — actor validation send never executed.
4. **Reframed: drive preview render from resolver directly.** Per Frank's routing answer to the V-37 unblock options ("CC scaffolds preview from resolver directly"). CC wrote a standalone vite-node harness adapting the `familyGuide.contract.test.js` mockSb pattern with production data (Frank's guardian record, 2 kids, 2 teams, 4 events May 19-26, 2 coaches, org name). Rendered HTML delivered as `.html` file via `SendUserFile`.
5. **Preview render surfaced structural gaps not in the 6 anticipated findings.** Source-comment evidence: `familyGuideSections.js:10-13` *"5a ships placeholder shapes — real per-event row builders land in 5b"* and `:51` *"5b wires per-kid links once the resolver supplies real player_id / team_id values to embed in the URL slugs"*. Both 5b TODOs were never closed. 5c added wizard UI + contract tests but didn't backfill 5b's load-bearing content work.

**8 V-37 findings consolidated (6 anticipated + 2 newly via render):**

| # | Finding | Verdict | Routing |
|---|---------|---------|---------|
| 1 | VIP header tone + "4 GAMES" inaccuracy (events were PRACTICES) | Block cutover; bug + design | **PR 5b-1** (V-37 PR A) |
| 2 | Kid color rendering (violet/amber per teams.team_color) | Acceptable as shipped | None |
| 3 | Quick link nav rows — render correctly but URLs are placeholder per `:51` | Block cutover; bug | **PR 5b-2** (V-37 PR B) |
| 4 | Day-grouped events — completely missing per `:10-13` | Block cutover; P0 scope under-delivery | **PR 5b-2** (V-37 PR B) |
| 5 | Conflict callouts — untestable from preview (no conflicts in date range) | Defer verification | **PR 5b-3** (V-37 PR C) |
| 6 | Brand footer — matches Frank's hand-composed pattern | Acceptable as shipped | None |
| 7 (NEW) | 5b under-delivery: per-event row expansion missing per source comment | Block cutover; same root cause as #4 | **PR 5b-2** combined |
| 8 (NEW) | quick_link_nav URL stubs deferred from 5b | Block cutover; same root cause as #3 | **PR 5b-2** combined |

**§4.A PR 5 status correction:** from SHIPPED to CODE-PARTIAL. The schema migration + resolver query chain + composer scaffolding are production-ready; per-event content + URL wiring + tone/accuracy pass + conflict callout verification are the residual work captured as 5b-1/5b-2/5b-3.

**Documentation narrative-drift discovery (observation-only, not registering as anti-pattern candidate):**

`AUDIT_DAY_2026-05-16_FINAL_CLOSE.md:65` claimed an actor validation send had occurred (placeholder line for findings was scaffolded *"TO BE FILLED ON FRANK'S READ"*, implying Frank had unread findings waiting). Reality: no send fired, no email to read, no findings actually pending. The doc captured *anticipated* validation that never happened.

Generalized failure mode: planning docs that scaffold "validation pending" placeholders for actor work that wasn't actually executed produce a downstream session that wastes time hunting for an artifact that doesn't exist.

Per Frank's standing rule (registered in §4.N.2 Q1, applied to AP #48 candidate Sunday): **one instance is not a pattern.** Logging as observation-only. Promotion trigger: second instance of same class (doc scaffolds "validation pending" for an action that didn't occur and downstream session blocks on the missing artifact). If a second case surfaces in subsequent sessions, register as anti-pattern candidate.

**Monday-opener routing (unchanged from §4.N.2 4-action sequence):**

Action 1 (V-37) **CLOSED 2026-05-19** — unblocked via structural discovery. Output: this §4.N.3 amendment + §4.A PR 5 status correction + V-37 row updates + 3 sub-PRs queued.

Action 2 (§4.O AdminManagerLayout design call) **NEXT.** Locked design parameters from §4.N.2 Q4 stand; only the open question is page-header-included-in-layout vs each-page-renders-own (CC still recommends included).

Actions 3 + 4 (L3 chat scan, L4 prod verification sweep) **unchanged.**

**Forward implication — the §4.N.3 surfacing IS a Layer 4 finding.** Production verification on §1 SHIPPED items, applied retroactively to PR 5 (Family Guide) via Action 1 prep. The full Layer 4 sweep scheduled for Monday hour 3-4 will likely surface similar narrative-drift instances on other §1 SHIPPED items. Worth budgeting for: Layer 4 may find more "code-merged but actor validation not executed" cases.

**Anti-pattern #45 acid-test cycle 10:** structural findings from Action 1 execution → ledger amendments same session. Cycle holds.

### §4.N.4 — Monday-opener Action 2 (§4.O AdminManagerLayout design call) close (2026-05-19)

Action 2 executed per §4.N.2 sequence following Action 1 close. **Outcome: header-included-in-layout LOCKED.** §4.O arc design parameters fully resolved; ready for code build when arc reaches turn in strategic-three-arc routing.

**Decision lock:**

Q4's open question (*"does AdminManagerLayout absorb the page header, or does each page render its own header and the layout only owns the body?"*) resolved with CC's recommendation: **header included.** AdminManagerLayout owns:
- Page header (Inter font, brand cobalt accent, breadcrumb back)
- Search bar
- Add CTA
- Tabs slot (Active/Archived if needed)
- Empty state

Child pages (AdminMembersPage / AdminOpponentsPage / AdminLocationsPage) mount the layout and supply body content only — no per-page header rendering.

**Rationale:**

Visible-consistency win across the 3 new admin manager pages drives the unified call. Three pages built independently produce drift between header layouts within weeks; unifying at the layout boundary makes that impossible by construction. The cost of a future "this page needs a custom header" exception stays low — escape hatch via optional `headerOverride` prop can land later if a real need surfaces. Premature flexibility isn't free; YAGNI (per anti-pattern #39: lean-with-hedge usually means the hedge is wrong; don't pre-build the override).

**NOT changed by this lock:**

- §4.N.2 Q4's "NOT in scope tonight" guard still holds: existing `AdminSeasonsPage` + `AdminTeamsPage` stay as-is. Sample-of-two is not precedent. Anti-pattern #42 (parallel-system buildup) caution applies — don't refactor what works just because the new pattern exists. If a real refactor reason emerges later, that's a separate decision.
- File-size targets unchanged: AdminManagerLayout 80-120 lines, each child page 80-100 lines.

**§4.O arc state after lock:**

- Design: fully resolved
- Implementation: NOT STARTED — arc waits in strategic-three-arc routing (arc 2, between §4.A PR 5 follow-ups and §4.C Sprint B-F start)
- Concrete deliverables (from §4.O-related Layer 2 validation entries V-32 + V-33):
  - `src/components/admin/AdminManagerLayout.jsx` (new shared wrapper)
  - `src/pages/AdminMembersPage.jsx` + `/admin/members` route (V-32)
  - `src/pages/AdminOpponentsPage.jsx` + `/admin/opponents` route (V-33)
  - `src/pages/AdminLocationsPage.jsx` + `/admin/locations` route (V-33, closes §3-A PARTIAL)

**Monday-opener routing (unchanged from §4.N.2 4-action sequence):**

Action 2 **CLOSED 2026-05-19** — header-included locked. Output: §4.N.2 Q4 marked LOCKED + this §4.N.4 amendment.

Actions 3 (Layer 3 chat scan, Frank-side) + 4 (Layer 4 production verification sweep, CC peak energy hour 3-4) **next.**

**Forward implication:** Action 2 cost was minimal (single decision lock, ~5 minutes including ledger reconciliation) compared to §4.N.2's ~20-min estimate. The estimate was conservative because the recommendation was strong and the surrounding parameters were already locked in §4.N.2 Q4. Useful calibration data: when the recommendation IS the decision, "design call" collapses to "lock the recommendation."

**Anti-pattern #45 acid-test cycle 11:** locked decision in planning doc → ledger reconciliation same session. Cycle holds.

### §4.N.5 — Monday-opener Action 4 (Layer 4 production verification sweep) close (2026-05-19)

Action 4 executed per §4.N.2 sequence following Action 2 close. **Outcome: 9 §1 SHIPPED PRs all production-healthy via anti-pattern #44 retroactive trace.** Layer 4's major finding was already surfaced earlier during Action 1 prep (§4.A PR 5 reclassification to CODE-PARTIAL, captured in §4.N.3). The remaining §1 sweep confirms no other code-merged-but-actor-validation-missing instances in the May 4 → May 18 window.

**§1 verification table (9 PRs):**

| PR | Claim | Verification | Verdict |
|----|-------|--------------|---------|
| #233 | formatters.js NY-pin canonical helpers | `NY_TZ = 'America/New_York'` at `formatters.js:5`; threaded through every `toLocale*` call (lines 14, 28, 60, 75-76, 83-85, 96, 99, 109) | ✓ HEALTHY |
| #234 | 51 leaf-callsite NY-pin + static-grep audit | `timezoneAuditPin.test.js` test passes 1/1; bracket-balance design holds | ✓ HEALTHY |
| #235 | AlertZone loading-state gate | Closed by #241 — see below | ✓ HEALTHY (via #241) |
| #236 | Tier 3 v1 retrospective doc | `TIER_3_V1_RETROSPECTIVE_NOTES.md` present | ✓ HEALTHY (doc-only) |
| #237 | Coach roster overdue gate <72h | `HIGHLIGHT_WINDOW_MS = 72*60*60*1000` at `CoachRosterSnapshotTeam.jsx:39`; boundary test passes 5/5 incl. *"d. event EXACTLY 72h out + no RSVP → yellow (threshold inclusive)"* | ✓ HEALTHY |
| #238 | EMBER_PENDING_LEDGER + AP #43 | Ledger exists; AP #43 registered in CLAUDE.md line 419 | ✓ HEALTHY (doc-only) |
| #239 | CoachHomePage MY TEAMS records (Cluster 5) | `useOrgTeamRecords` imported `:12`, wired `:30`, threaded `:116`; production cross-check confirms 35 published games aggregate correctly (11U Girls 5-2, 10U Black 5-4, 10U Blue 3-2, 9U Boys 1-5, 8U Boys 3-5) | ✓ HEALTHY |
| #240 | `% Going` label invariant (Cluster 2) | `playerGoingLabelInvariant.test.jsx` passes 5/5 | ✓ HEALTHY |
| #241 | `useAlertEvaluator` null sentinel (Cluster 6.A3) | `useState(null)` sentinel at `:46`; gate at `:82` correctly guards `configs === null`; loadingGate test passes 3/3 | ✓ HEALTHY |

**Extended cross-check (outside strict §1 scope, in scope by Layer 4 logic):**

After Action 1 reclassified PR 5 (Family Guide) to CODE-PARTIAL, the natural question per anti-pattern #39 (hedge-as-truth) was: is PR 4 (Coach Roundup) the same drift class? Quick check produced asymmetry:

| Aspect | PR 4 (Coach Roundup) | PR 5 (Family Guide) |
|--------|----------------------|---------------------|
| Resolver query chain | Wired (`coachRoundup.js`) | Wired (`familyGuide.js`) |
| Section builders complete | **YES — `buildTeamSections` iterates events and emits `color_striped_row` per event with day_label/time/primary/secondary** (`coachRoundupSections.js:33-52`) | **NO — `buildKidColorPillSections` emits summary chip only**, never iterates events; the TODO in `familyGuideSections.js:10-13` was never closed |
| Quick-link nav URLs wired | N/A (no nav section for coach kind) | NO — placeholder per `:51` |
| Wizard supported | YES (4c flipped flag) | YES (5c flipped flag) |
| Actor validation send executed | NO — zero `sent` rows in `comms_messages` for kind | NO — same |

**Conclusion:** PR 5 drift is unique. PR 4 is code-complete; the only missing piece is the actor validation send. Different class of "not actually shipped" — PR 4 needs Frank to drive a send; PR 5 needs 3 sub-PRs to land first.

**Routing for PR 4:** Status correction-candidate. Currently §4.A PR 4 says SHIPPED. Strict interpretation: SHIPPED requires actor validation completed. Reality: code-complete, send-pending. Two options:
- (a) Reclassify PR 4 to "CODE-COMPLETE, ACTOR-VALIDATION-PENDING" — symmetric with PR 5 framing, ledger truth-telling
- (b) Leave PR 4 as SHIPPED on the grounds that the wizard works; awaiting a send isn't the same as awaiting more code

Lean: **(a) reclassify.** Same standard PR 5 was held to. The "actor validation send is part of shipped" definition is what made the V-37 unblock necessary; applying the looser definition to PR 4 because the code happens to be complete creates inconsistent status. Concrete action: future PR amends §4.A PR 4 to ACTOR-VALIDATION-PENDING; Frank drives a coach_roundup send through the wizard whenever convenient to actually clear PR 4. NOT in scope for this PR — surfaced for routing decision in a follow-up.

**Production data cross-checks (in passing during verification):**

| Cluster reference | Production state | Cross-check verdict |
|-------------------|------------------|---------------------|
| §2 Cluster 1 (tournaments) | Confirmed: tournament events from May 16-17 have `published_at IS NULL` on `game_results` (no rows). Workflow gap holds — Frank to Quick Score the 13 tournament results. | ✓ matches §2 Cluster 1 D1 finding |
| §2 Cluster 1.2 (10U Blue Game 6) | Production shows 10U Blue at 3-2, not 3-3. Resurrection Blue 4AB May 9 (25-27 L) is the missing Game 6. | ✓ matches §2 Cluster 1.2 workflow gap; remains OPEN until Frank enters Game 6 |

**Anomalous observation (NOT registering as Layer 4 finding pending Frank confirmation):**

One `coach_roundup` row in `comms_messages` (id `ab1e7015-...`) with `status='queued'`, `last_edited_by=Frank admin user_id`, `last_edited_at=2026-05-19 11:49:25 UTC`. Anomalies:
- `subject: null` (composer normally sets `Coach roundup — <name>`)
- `content_sections: {"body": {}}` — an object with a `body` property holding an empty object, NOT the composer's array of section objects (e.g., `[{kind: 'coach_header', ...}, {kind: 'team_color_pill', ...}, ...]`)
- `audience_filter: {"coach_user_id": "1e06a3d4..."}` (Frank's admin user_id)

Most likely benign: Frank opened the Coach Roundup wizard today (possibly during this session after the V-37 conversation) and the wizard saved its initial-state shape as a draft before the composer ran. If that's the case, the wizard-save shape is wrong — the wizard should either NOT save before composer runs, OR save the composer output. If Frank did NOT open the wizard, then the row was created by some other path (auto-cron? trigger?) and the draft-shape bug is a genuine Layer 4 finding requiring its own PR. Surfaced here for Frank confirmation before promotion.

**Audit-methodology calibration note:**

CC's initial verification query for #239 used the wrong enum value (`gr.result = 'win'` / `'loss'` / `'tie'` — full lowercase strings) instead of the production value (`'W'` / `'L'` / `'T'` — single-character uppercase per `teamRecords.js:38-40`). The mistake produced a momentary "Layer 4 finding" panic (35 published games but zero wins/losses/ties) before cross-check against the JS code. Real bug class: when running an audit query against an unfamiliar table, **always first grep the JS code for the column's enum semantics** rather than assuming database conventions. Anti-pattern #36 (destructured defaults silently swallow errors) is the structural inverse; this is its query-side cousin. Logging as audit methodology observation, not promoting to candidate anti-pattern (one instance; per Frank's standing one-instance rule).

**Layer 4 sign-off conditions check:**

- ✅ Anti-pattern #45 compliance — findings → ledger same commit (this PR)
- ✅ Findings count + ledger-growth report → 0 new V-* (sweep clean) + 1 PR 4 reclassification candidate (routing-deferred) + 1 anomalous observation (Frank-gated)
- ✅ Strategic arc routing decision: §4.A PR 4 reclassification routing stays open; arc 1 (PR 5 follow-up cycle) unchanged from §4.N.3; arcs 2 + 3 unchanged from §4.N.4

**Layer 4 effort actual:** ~40 minutes (under §4.N estimate of 60-90 min). The §1 list was tight (9 items) and most verifications collapsed to test-suite runs + targeted grep. The expensive verification was actually the Action 1 unblock that surfaced PR 5 — that's where the cognitive load lived. Calibration: when §1 is well-curated (forward-tracking + recent), Layer 4 sweeps are faster than estimated. When §1 has stale ship claims (the PR 5 case), Layer 4 expands into investigation territory.

**Anti-pattern #45 acid-test cycle 12:** Layer 4 findings + observations → ledger same session. Cycle holds.

### §4.N.6 — V-37 closure + §4.A PR 5 status flip (2026-05-19)

V-37 sub-PR queue executed in three sequential PRs Monday afternoon following the §4.N.5 Action 4 close. **Outcome: V-37 fully closed; §4.A PR 5 flipped CODE-PARTIAL → CODE-COMPLETE, ACTOR-VALIDATION-PENDING** (symmetric with PR 4 framing post-§4.N.5).

**Sub-PR landing sequence:**

| Sub-PR | PR # | Scope | Findings closed | Tests | Lines |
|--------|------|-------|-----------------|-------|-------|
| 5b-1 | #264 | Kind-aware `summarizeEventKinds` helper + apply to vip_header + kid_color_pill labels | #1 (tone/accuracy) | 16/16 → +5 | +72/-8 |
| 5b-3 | #265 | `buildConflictCalloutSection` + kid-aware `conflictCallout` renderer + composer wires it after vip_header | #5 (conflict callouts) | 19/19 → +3 | +82/-10 |
| 5b-2 | #266 | Per-event `color_striped_row` under each kid_color_pill + `quick_link_nav` URLs to `/teams/<team_id>` | #3, #4, #7, #8 (per-event rows + URLs) | 23/23 → +4 | +122/-19 |

**Cumulative impact:**
- 3 PRs landed sequentially over ~90 min CC execution time (within §4.N.2 PR 5b-2 budget of ~3-5h — under estimate because PR 5b-1's kind-aware label helper was reusable in 5b-3 + 5b-2, and 5b-3's renderer pattern was reusable in 5b-2).
- **Sections per Family Guide email: 7 → 11** (added `conflict_callout` + 4 `color_striped_row` sections for a 4-event date range).
- **23/23** family_guide contract tests + **11/11** coach_roundup contract tests (backward-compat held) + **293/293** engine + timezone audit pass.
- Cross-surface invariants per #43 locked in 3 places:
  1. VIP header `event_count` === sum of `color_striped_row` counts (5b-2)
  2. VIP header `conflict_count` === `conflict_callout.items.length` (5b-3)
  3. `events_label` consistent across vip_header + kid_color_pill within same email (5b-1)

**Documentation drift resolved:**

Two source-comment TODOs that drifted across multiple PRs are now closed:
- `familyGuideSections.js:10-13` (was: *"5a ships placeholder shapes — real per-event row builders land in 5b"*) — closed by PR #266. File header comment updated to reflect actual section order.
- `familyGuideSections.js:51` (was: *"5b wires per-kid links once the resolver supplies real player_id / team_id values"*) — closed by PR #266. quickLinkNav renderer comment updated.

The drift class (renderer comments referencing future work that gets deferred + forgotten across PR chains) is part of the V-37 root cause discovered via §4.N.3 investigation. Worth keeping as observation-only (per Frank's standing one-instance rule for anti-pattern candidates) until a second instance surfaces.

**Status of strategic three-arc routing:**

1. **§4.A PR 5 follow-up cycle** ✅ — CC-driveable portion complete. Only Frank's actor validation send remains (one wizard click → PR 5 → SHIPPED).
2. **§4.O admin managers build** — design fully resolved per §4.N.4; implementation queued. Now becomes the arc 1 candidate.
3. **§4.C Sprint B-F start** — strategic priority after arc 2.

**Forward implication — symmetric actor-validation gate now applies to two PRs:**

After today's session, §4.A has two CODE-COMPLETE, ACTOR-VALIDATION-PENDING entries:
- PR 4 (Coach Roundup) — reclassified by PR #263 (§4.N.5 follow-up)
- PR 5 (Family Guide) — reclassified by this PR

Both unblock with the same shape: Frank drives one send through the respective wizard. Could be done back-to-back in ~20-30 min (10-15 each) when Frank's at a desktop.

**Anti-pattern #45 acid-test cycle 13:** V-37 closure findings → ledger same session. Cycle holds.

### §4.N — Two-Week L99 Audit close marker (2026-05-19)

With §4.N.3 (Action 1 / Layer 4 retroactive) + §4.N.4 (Action 2) + §4.N.5 (Action 4 / Layer 4 §1 sweep) closed, the CC-driveable portion of the §4.N audit is **complete**.

**Remaining open:**
- Action 3 (Layer 3 chat scan) — Frank chat-side. Tier 1 `conversation_search` queries per §4.N.2 Q5; sequential `recent_chats` walk validation. Independent of CC work; can run whenever Frank chooses.
- §4.N Layer 1 + Layer 2 + Layer 5 — already closed Sunday evening (see below); only Action 3's Layer 3 remains.

**Strategic three-arc routing (post-Action 4) status:**
1. **§4.A PR 5 follow-up cycle** — 3 sub-PRs queued (5b-1, 5b-2, 5b-3) per §4.N.3
2. **§4.O admin managers build** — design fully resolved per §4.N.4; implementation queued behind arc 1
3. **§4.C Sprint B-F start** — strategic priority after arcs 1 + 2

**Optional follow-up surfaced by Action 4:**
- §4.A PR 4 reclassification to CODE-COMPLETE, ACTOR-VALIDATION-PENDING (symmetric with PR 5 framing; Frank-routing-deferred)
- Coach Roundup queued-row anomaly resolution (Frank-confirmation-gated)

### Layer 1 findings (2026-05-18 evening soft start — §4.N audit, low-cognitive pass)

Layer 1 of the §4.N Two-Week L99 Audit executed Sunday evening (post-sign-off, soft start per Frank's "Continue with the build" routing). Mechanical enumeration + sequence gap analysis. No interpretive findings — those wait for Layers 2-5 with fresh-head cognitive load.

**Quantitative ground truth:**

| Metric | Value | Notes |
|--------|-------|-------|
| Total commits in window (May 4 → May 18, main branch) | 616 | Required `git fetch --unshallow` to materialize — main was shallow-cloned with 72 commits visible |
| Commits with PR-squash markers `(#NNN)$` | 232 | Real PR landings |
| Commits via merge-commit style (`Merge pull request #NNN ...`) | 12 | Pre-PR-squash-discipline merges (#14, #93-#95, #97, #99-#104, others) — counted as landings, not orphans |
| Direct-to-main commits (no PR reference) | 384 | ALL pre-2026-05-12 (v2 history rolled into main on May 11 retirement). Zero post-retirement direct-to-main commits. Anti-pattern #19 holds firm. |
| Sequence gaps in PR numbers (window: #6-#254) | 17 raw → 5 real | 12 of 17 are merge-commit false positives. 4 of remaining 5 (#140-#143) are dependabot bumps superseded by consolidated PR #147 (§4.K). 1 real WIP orphan: PR #21 (→ V-29). |
| PRs referenced in EMBER_PENDING_LEDGER | 32 of 232 (14%) | Expected — ledger is forward-tracking from May 18 creation, not retroactive completeness over full window |
| PRs unreconciled to ledger | 200 | Expected; not actionable. Layer 1's scope ends at quantification. Layer 4 (prod verification sweep) cross-references actionable ship status; Layer 5 (22-bug catalog) cross-references the named-uncertainty subset. |

**Per-day landing density** (post-v2-retirement era only — May 12-18, all via PR):

```
2026-05-12: 28 PRs   wave 4.4 broadcast components + briefing IA
2026-05-13: 16 PRs   doctrine sweep + dependabot consolidation
2026-05-14:  2 PRs   quiet day (Italy travel transition)
2026-05-15: 18 PRs   schedule + briefings refinement
2026-05-16: 40 PRs   audit-day (5-phase audit + Beta + fixes)
2026-05-17: 12 PRs   Tier 3 v1 alert framework (6 PRs)
2026-05-18: 22 PRs   L99 cross-role audit + meta-discipline + ledger
```

**Findings synthesis:**

1. **Anti-pattern #19 status:** HOLDS FIRM post-2026-05-12. Zero direct-to-main commits in the 7-day post-v2-retirement window. The 384 direct commits are entirely v2 history rolled into main at the May 11 retirement merge. Not violations.

2. **Sequence gap class:** 12 of 17 raw gaps are merge-commit-style merges (`Merge pull request #NNN from ...`) that the squash-merge regex `\(#NNN\)$` doesn't catch. Refining the cross-reference regex for future Layer 1 runs is a Layer 1 method-improvement; not a finding requiring action.

3. **Dependabot consolidation pattern (PR #147):** Four individual dependabot bumps (#140-#143) were closed unmerged in favor of the consolidated `risky-runtime-deps` group bump landed as #147. §4.K already tracks #147 as the canonical record. The 4 closed PRs are intentional cleanup, not orphans.

4. **Real orphan: PR #21.** Frank-authored WIP draft titled "coach contact in briefings (PR-F partial — awaiting A/B decision)". Closed 2026-05-12 unmerged. PR body says: *"Migration `20260508194310` applied via Supabase MCP. Production already has these changes: `staff_profiles` table + `tournament_messages.coach_user_ids` column."* So the production schema reflects Path A artifacts. The code wiring (CoachPicker component, useTeamCoaches hook, composer wiring, useComposeBriefing) may or may not have shipped via a different PR. → V-29 verifies.

5. **Ledger reconciliation gap (200 unreconciled):** Expected and not actionable at Layer 1. The ledger is forward-tracking (created May 18 in PR #238); it captures pending/verify/active-bug items, not every shipped feature. The "200 unreconciled" framing is informational — Layer 4 cross-checks production state of ship claims and Layer 5 cross-checks named uncertainties; neither needs Layer 1 to pre-enumerate the 200.

**Layer 1 sign-off conditions check:**

- ✅ Anti-pattern #45 compliance — findings → ledger same commit (this PR)
- ✅ Findings count + ledger-growth report → 1 new V-* (V-29), 1 findings block (~50 lines)
- ✅ Strategic arc routing decision deferred to next layer (Layer 5 next per §4.N sequencing — clears mechanical 22-bug catalog uncertainty)

**Layer 1 effort actual:** ~35 minutes (matches §4.N estimate of 20-30 min with a small unshallow surprise overhead).

Total estimated verification effort: ~7-8 hours when bundled (with V-17 through V-22 additions +1 hour, V-23 through V-28 additions +1.5 hours, V-29 +10 min).
Recommended cadence: batch V-1 through V-7 + V-17 through V-21 (Migrations + BUGs + Phase 1/3 ship-status confirms, ~1.5 hours) as the first Monday pass — these are the highest-value unknowns AND closable with grep/DB queries. V-8 through V-14 + V-27 (~3 hours) as a focused mid-Monday session — these include spec-doc deep reads that benefit from sustained focus. V-15 + V-16 + V-22 + V-23 through V-26 + V-28 + V-29 (~3.5 hours) as a separate "rebuild + tidy" pass when energy is low — these are mostly read-and-flag with low decision burden.

---

### §4.S — Thursday afternoon arc (2026-05-20 PM NYC) — Frank-reported feedback marathon close + forward queue

Full session recap in `docs/STATE_OF_AFFAIRS_L99_v6.md`. This section captures the FORWARD queue (the P1-P4 items) so chat-side can plan routing without re-deriving from the L99 doc.

**Shipped this session (17 PRs + 2 migrations + 1 anti-pattern):** see L99 v6 Part 2.

**Forward queue ranked by tier:**

**P1 — small, clear, no design call (ship next):**
- **B1.** New Tournament form checkboxes have no visible "checked" state. ~20 lines in `TournamentFormSheet`'s team picker. Add `<Check />` icon (Lucide) or `aria-checked` pill style.
- **B2.** Historical events with `opponent = TBD` or null still show on Schedule and Results. Promoted from P3 per chat-side pressure-test — Frank will see these on iPhone within 24h. Surface in admin home alerts lane until cleaned (~30 lines + an alert config row). PR #350 prevents new ones; this addresses the ~7 historical rows.
- **B3.** Financials shows "Winter 2025-26" tab even when empty. ~10 lines — filter `seasons` query to ones with `financial_accounts.count > 0`.
- **B4.** Coach team roster shows "3% Going · 97% NR" with sparse data. ~10 lines — when player has ≤1 RSVP datapoint, render "No RSVPs yet" instead of misleading percentages.

**P2 — design call needed:**
- **C1.** Engine Preview surfaces a dev/preview tool in production admin (MANAGE section). Options: hide via flag / move to `/admin/dev` / remove. **CC recommendation: move to `/admin/dev` (preserve tool, remove from main flow).**
- **C2.** Tournament conflict warning: Jun 6-7 has 2 tournaments registered, no warning if admin double-books. ~30 lines for a banner on the New Tournament form when a selected team is already on another tournament in the same date range.
- **C3.** Form field required/optional indicators inconsistent across New Member / New Location / New Tournament / Edit Team. Adopt the red `*` pattern from PR #350 (Opponent on the wizard) across all required fields. ~50 lines across 4-5 forms.

**P3 — data hygiene (one-shot SQL):**
- **D1.** Import 30 tournament-opponent strings into the opponents directory. SQL one-shot insert from distinct `events.opponent` values where no matching opponent row exists, then backfill `events.opponent_id` via name match. ~15 mins. PR #363 closed the bug for 12 CYO opponents; D1 extends the same fix to the 30 tournament-opponent strings.
- ~~D2~~ — absorbed into B2 (alert-lane fix surfaces TBD-opponent events directly).

**P4 — process / discipline (compounds):**
- **E1.** Anti-pattern #46 CI guard. GitHub Actions step that fails CI if a `*Card.jsx` / `*Row.jsx` / `*Tile.jsx` file is in the diff WITHOUT an accompanying invariant test added in the same PR. Simple grep job.
- **E2.** PR template checklist at `.github/PULL_REQUEST_TEMPLATE.md`: 4 items (anti-pattern #46, #21 migration mirror, admin-home visual verify, #36 null-in-filter). ~10 min add.

**P-deferred (Frank to confirm pain):**
- **C4.** Members list — guardian/family grouping enhancement. ~3 guardians per family but no family grouping in the list. Possible enhancement to spot duplicates. Defer until Frank confirms real pain.

**Open decisions for Frank (block P2 work):**
1. Engine Preview placement (C1) — keep / move to /admin/dev / remove? **Chat-side + CC concur: lean (b) move to /admin/dev.**
2. Tournament conflict warning style (C2) — soft banner or hard block?
3. Required-field marker (C3) — adopt red asterisk pattern everywhere?
4. PR template (E2) — adopt or skip?

**Things Frank already locked this session (do NOT re-litigate):**
- Records page stays (H from earlier triage)
- "+ Player" stays as "+ Member" → /admin/members (PR #360)
- Attendance metric replaced by **Active teams** (NOT active players — Frank's explicit preference for "programs or teams")
- Engine Preview is currently in MANAGE grid (C1 will move it if Frank approves)

**Anti-patterns #46/#47/#48 registered:**
- **#46** (PR #359): cross-component visual rhythm requires invariant test / screenshot / token reference. Origin case in L99 v6 Part 1.2.
- **#47** (chat-side pressure-test 2026-05-20 PM): branch-reset hazard — switch to main before `git reset --hard`. Promoted to registered on first occurrence per calibration heuristic (mechanical operational rule preventing data loss; bounded recovery today, worst-case data loss tomorrow).
- **#48** (chat-side pressure-test 2026-05-20 PM): PostgREST `.order(col, { foreignTable })` is a no-op for parent rows — always sort in JS. Short corollary entry, not a full anti-pattern.

**Trigger pattern established (audit candidates for next session):**
- `team_achievements` aggregates (currently no manual columns — safe)
- Future per-player season stats if/when we add them
- Coach payouts derivable from `events × coach_assignments` — currently manual; potential next target

**Operator-CC discipline observations from this session:**
- Frank's "auto proceed" delegation pattern unlocks rapid serial shipping; CC's calibration is: if item involves DELETION / NEW SURFACE / non-obvious LABEL change, ask. Otherwise execute.
- Branch-reset hazard: twice CC did `git reset --hard origin/main` on a feature branch with uncommitted work, wiping work. ~5 min recovery each time. **Promoted to anti-pattern #47 immediately (chat-side pressure-test) — operational rule preventing data loss, register on first occurrence.**
- **Chat-side pressure-test loop:** L99 v6 v1 had a numbering question (raised by chat-side, verified clean by grep — catalog was contiguous, v6's #46 claim was correct) and an evidence claim that needed pinning (Notify-families E2E). Both corrections shipped via §4.S follow-up commit + L99 Part 7.1 edit. Pattern lock: chat-side reads L99 immediately on close, flags structural questions, CC verifies and reconciles in the same doc-pair.
- Webhook PR subscription pattern paid for itself: PR #361 CI failure caught and fixed within minutes via subscription, vs hours later via Frank's smoke.

**§4.S close conditions:**
- ✅ Anti-pattern #45 compliance — L99 v6 doc creation paired with ledger §4.S in same commit
- ✅ Forward queue captured with tier, scope, effort, recommendation per item
- ✅ Open decisions enumerated for Frank
- ✅ Locked decisions enumerated to prevent re-litigation

**Recommended next-session opener:**
- If shipping mode: start with B1 (lowest risk, surfaces visible bug)
- If process mode: start with E2 (compounds over every future PR; ~10 min)
- If discussion mode: walk Frank through the 4 open decisions, then route from there

---

### §4.T — Event detail page redesign (3-PR arc — PROPOSAL stage)

Frank-requested 2026-05-20 PM after iPad screenshot audit. Current event
detail page accumulates ~3200px of always-on chrome for staff drilling
into a future game (ArrivalBoard auto-expand alone is ~1500px on a
14-kid team). Practice events tolerable at ~1055px; tournament events
similar to games. Full audit + wireframes + responsive notes in
`docs/L99_EVENT_DETAIL_REDESIGN_2026-05-20.txt`.

**Status:** PROPOSAL. Doc handed to Frank for external review on
claude.ai before implementation. No code work yet.

**Proposed 3-PR arc** (per Part 6 of the doc):
- **PR A** — Stop the bleeding (small, zero new components, ~1800px
  reclaimed): drop GameDayMode auto-expand, gate it on isGameType
  (practices stop seeing it), wrap AcademyCallupPicker + LocationTab
  + EventBriefingHistory in CollapsibleSection, remove "Location"
  h2 heading.
- **PR B** — Hero card consolidation: new `GameDetailHero.jsx` (~120
  lines) replaces RsvpSummaryBlock + EventDetailTab +
  EventRosterLockCard from page. Per-event-type action stacks. Parent
  variant integrates MyActionsSection / ParentArrivalActions.
- **PR C** — Polish + Cancel relocation: ⋯ overflow menu in
  EventDetailHeader (Cancel + Delete inside). Drop "Compose recap"
  chip from header (CTA lives inside Briefings collapsible).

**Responsive verified:** uses existing `matchMedia (min-width: 600px)`
breakpoint. Hero action row side-by-side on iPad, stacked on iPhone.
Section header summaries get compact text variant on iPhone if needed.

**Open questions documented in doc Part 7** for reviewer:
1. Hero component scope (one cross-type component vs three)
2. Tournament draft state — show on Schedule list or hide
3. Parking notes prominence (auto-expand Location on game day?)
4. PR A solo first or bundle B+C
5. Action button order (Lock then Notify, or reverse)
6. Audit gaps the reviewer might spot

**Anti-pattern #45 compliance:** this entry created in same commit as
the proposal doc per #45 rule (planning-doc changes must reconcile
ledger §4 in same commit).

**Routing:** Frank → claude.ai review → response back → CC executes
selected PR(s) in order. Highest probability path: ship PR A first as
the no-new-components quick win, validate the impact visually, then
proceed to PR B based on review feedback.

---

#### §4.T close (2026-05-20 PM, post-review execution)

**Status:** SHIPPED (5 PRs merged + 2 deferred for explicit Frank
decision).

**claude.ai review feedback resolution:**
- Q1: one component with branches + EventHeroActions child split ✓
- Q2: tournament draft on schedule list with "Schedule pending"
  treatment — PR #382 already shipped; bracket-icon polish deferred
  to a follow-up schedule-list adjustment.
- Q3: Location auto-expand within game-day window when parking_notes
  exist. Q3 sub (Frank-confirmed): only for parents whose kid is
  RSVP'd Going. Both shipped in PR #396 via `shouldAutoExpandLocation`
  helper.
- Q4: PR A solo first, then PR B+C bundled — actually shipped as 3
  separate PRs (B and C diverged in scope mid-build; reviewer's
  "<250 lines bundling" threshold slightly exceeded).
- Q5 (Frank): Notify left, Lock right (frequency-weighted) — shipped
  in PR #393 EventHeroActions.
- Gap 1 (skeleton): `EventDetailHero.Skeleton` shipped in PR #393.
- Gap 2 (window constants): `src/lib/eventWindows.js` shipped in
  PR #393; threaded through `useEventTimeWindow`, `GameDayMode`,
  `ParentArrivalActions`.
- Gap 3 (cancelled hero variant): red border + Cancelled badge +
  action stack hidden — shipped in PR #393.
- Gap 4 (tournament parent view): parent variant on tournament drafts
  shows RSVP picker if kids on team; full tournament-parent surface
  remains future scope.
- Gap 5 (empty states): verified existing collapsibles use clean copy.

**Shipped PRs:**
- PR #392 — PR A: collapse defaults (~1800px reclaimed)
- PR #393 — PR B: GameDetailHero + EventHeroActions + eventWindows
  constants + skeleton + cancelled variant
- PR #394 — PR C: header overflow menu (Cancel + Delete) + cancel
  relocation + compose-recap chip removal + cancelled red strip
  removal
- PR #395 — CLAUDE.md §16.14 detail page hero + collapsibles pattern
  registered as positive design rule
- PR #396 — Q3 sub: parent Location auto-expand within game-day
  window when kid Going

**Deferred (explicit Frank decision needed):**
- **Lock bottom-sheet inline trigger.** Hero's Lock button currently
  scrolls to EventRosterLockCard below the hero (2-tap flow). Worth
  extracting `LockRosterSheet` from `EventRosterLockCard` only if
  Frank reports the scroll-then-tap friction is real. Lock is not a
  daily action.
- **PostHog instrumentation** (reviewer observation 3). Codebase has
  PostHog initialized but zero `capture()` call sites today; adding
  the first creates a precedent. CLAUDE.md §16.7.1 documents the
  PostHog GeoIP enrichment that hasn't been resolved (project-tier
  toggle not findable). Decision deferred to a separate explicit
  Frank decision on privacy posture + first-capture precedent.

**Anti-patterns reinforced this arc:**
- #11 (150-line cap) tested 4 times across the arc; each time the
  fix was a tighter extraction (helper to lib, child component,
  consolidated JSX). Cap forces good factoring.
- #45 (planning-doc + ledger same commit) followed on PR #391 (doc
  creation) and this close commit. Ledger stays in sync.
- §16.14 (new): positive design rule for detail pages established —
  future tournament / team / player / location detail surfaces use
  the same hero + collapsibles pattern.

**Total session output 2026-05-20 PM:** 13 PRs from the Frank-flagged
afternoon arc → 5 more from L99 redesign + 1 docs + 1 follow-up = 20
PRs in one session. L99 v6 doc captures the broader context.

---

### §4.U — Teams page redesign (3-PR arc — PROPOSAL stage)

Frank-requested 2026-05-20 PM after iPad screenshot audit. Same drift
class as §4.T: an admin-skewed detail page that's grown a mid-section
attendance grid + a "Player Stats" empty-state block + a "2% Going"
pulse metric that misreads to families. Goal stated as "100%
adoption by parents, coaches, and admins" — page must be valuable to
all three personas at a glance.

Full audit + wireframes + responsive notes in
`docs/L99_TEAMS_REDESIGN_2026-05-20.txt`.

**Status:** PROPOSAL. No code work yet. Stop-the-bleeding bugs
identified for PR A.

**Critical bug at the top of PR A (B1 in doc):**
- `TeamHeatmap.jsx:30-41` computes `teamPct = totalGoing / totalPast`
  which floors near zero when check-ins are absent. Header reads
  "Team Pulse · 2% Going" while the grid says "no data here." Two
  conflicting signals on the same surface, family-visible.

**Proposed 3-PR arc** (per Part 6 of the doc):
- **PR A** — Stop the bleeding (small, zero new components): gate
  Team Pulse on responseRate threshold, flip Roster `defaultOpen` to
  false, role-gate "No RSVPs yet" pill to staff only, adopt
  `useHomeRole().activeRole` at page level. Drift-hedge invariant
  test per AP #43.
- **PR B** — Hero card consolidation: new `TeamDetailHero.jsx`
  (~120 lines) replaces TeamHeaderCard + MyChildSpotlight +
  Send-briefing chip + CoachQuickActions. Per-role action stacks
  identical to event-detail hero shape from #393.
- **PR C** — Polish + overflow menu: ⋯ menu in back-chevron row,
  TeamAchievements collapsible, microcopy parent-variant pass.

**Open questions documented in doc Part 7** for Frank:
1. Adopt `useHomeRole().activeRole` at page level (recommend yes,
   in-row permissions stay on real role)
2. Canonical Team Pulse metric (a/b/c, recommend b: response-rate)
3. Roster `defaultOpen` for staff (recommend closed both roles)
4. Strip per-kid RSVP pill stack from parent view? (recommend yes
   except on parent's own kid row)
5. Coach contact line in parent hero — `useTeamHeadCoach` hook
   needed (defer to PR C if data path not yet built)
6. PR A solo first or combined (recommend split)
7. Hard-coded weather lat/lng (B5) — defer separately
8. Hero parent-RSVP picker — iterate over `myChildren` filtered to
   this team (sibling case)

**Anti-pattern #45 compliance:** this entry created in same commit
as the proposal doc per #45 rule.

**Routing:** Frank reviews doc → answers Q1-Q8 → CC executes PR A
first. PR A is the stop-the-bleeding ship (closes B1 + B2 which are
family-visible bugs).

#### §4.U close progress (2026-05-21)

- **PR A** SHIPPED (PR #417 `fix(teams): Teams PR A — stop-the-bleeding`).
- **PR D** SHIPPED (PR #418 `fix(teams): data-layer hardening`).
- **PR B** SHIPPED (this commit, `feat(teams): Teams PR B — hero card
  consolidation`). New `TeamDetailHero` (~142 lines) replaces
  `TeamHeaderCard` + `MyChildSpotlight` + `CoachQuickActions` mounts +
  the floating `Send-briefing` chip + `MessageTeamFAB` mount. Four
  slots per §9.2: identity, state-at-a-glance with `RsvpProgressBar`,
  per-role action stack, head-coach contact line. PLATFORM ADDITIONS
  shipped: co-coach rule via alphabetical sort (head_coach boolean not
  present in `team_staff` schema — verified via MCP), coach-viewing-
  self hides contact line, hero `ChildRsvp` uses `compact={false}` for
  A4. New `useTeamHeadCoach` hook, `isSparseRsvp` shared helper
  (deletes the duplicated detector across PlayerRow + MyChildSpotlight
  + hero). Both new invariant tests pass: `TeamDetailHeroPerRoleInvariant`
  (6 cases across parent/coach/admin/view-as variants) and
  `RsvpProgressBarCrossSurface` (4 cases). Retired components stay in
  tree but unreferenced 1 session per L99 #393 playbook before deletion
  in PR C follow-up.
- **PR C** SHIPPED (PR #423 `feat(teams): Teams PR C — polish + cleanup
  + dead-feature retirement`). Overflow menu + `usePlayerSortOrder`
  hook + retired-file deletion (TeamHeaderCard, CoachQuickActions,
  MessageTeamFAB, MyChildSpotlight) + microcopy parent-variant pass +
  TeamPlayerStats mount REMOVED (anti-pattern #51 second instance).
  `PlayerRowAcademyAvatar.test.jsx` invariant added. Closes V3, V4,
  V6, V7, V8, B6, Q13, Q14(c).

**§4.U arc CLOSED 2026-05-21.** 21 of 27 catalogued findings closed
across all 4 PRs (A/B/C/D). 6 deferred to other arcs per Appendix B
routing (B5 multi-tenant weather, V5 pulse grid scroll indicator, C2
+ C7 perf-pass arc, A2 + A3 a11y full pass arc).

---

### §4.V — Bug-sweep follow-ups (2026-05-20 PM)

From the auto-execute bug-sweep agent run companion to §4.T close.
Agent flagged 7 items; CC verified 3 real + 4 false positives.

**False positives** (no action, agent over-rotated on AP #37 without
applying the FK-scoped exception):
- `RecordPaymentForm.jsx:39` `financial_transactions.insert` — payload
  includes `org_id: orgId`; AP #37 governs read filters, not insert
  payloads.
- `GamesTab.jsx:18-40` `events` queries — events has NO `org_id`
  column (FK-scoped via `team_id → teams.org_id`). AP #37 documented
  exception.
- `ScopeChoiceDialog.jsx:38-40` three `events` queries — same
  FK-scoped exception.

**Real findings shipped in companion PR:**
- `MessagesTab.jsx:12` — added `.eq('org_id', orgId)` before
  `tournament_id` filter (AP #37 discipline, defense in depth over
  RLS). Required `useAuth` import.
- `GamesTab.jsx:18` — added `error` destructure + console.error on
  events query (AP #36).
- `GamesTab.jsx:27` — same on `game_results` query (AP #36).

Three small fixes; no behavior change in the happy path. Bug
diagnostics now surface when PostgREST returns an error.

---

### §4.W — Home-page preemptive split arc (CLOSED 2026-05-21)

Per claude.ai's PQ3 routing (locked in L99 platform audit PART 5
Phase 4): three home pages at/near the 150-line cap split into
header + signal-zone + alert-zone sub-components before feature-
shipping pressure forces a hurried split.

**Status:** CLOSED. Single PR (refactor branch
`refactor/home-pages-preemptive-split`).

**Scope:**
- `CoachHomePage.jsx` (149 → 78) — `src/components/coach-home/`
  - `CoachHomeHeader.jsx` (15)
  - `CoachHomeAlertZone.jsx` (23)
  - `CoachHomeSignalZone.jsx` (94)
- `ParentHomePage.jsx` (149 → 79) — `src/components/parent-home/`
  - `ParentHomeHeader.jsx` (18)
  - `ParentHomeAlertZone.jsx` (25)
  - `ParentHomeSignalZone.jsx` (89)
- `AdminSeasonsPage.jsx` (145 → 71) — `src/components/admin-seasons/`
  - `AdminSeasonsHeader.jsx` (21)
  - `AdminSeasonsActions.jsx` (15)
  - `AdminSeasonsList.jsx` (80)

**Deferred (per PQ3):** `AdminHomePage.jsx` (142) — more headroom.

**Test impact:** `myTeamsCrossSurfaceInvariant.test.jsx` updated to
read the post-split locations — MY TEAMS render moved into the
SignalZone sub-components. Audit `homePageLoadingGateAudit.test.js`
unaffected (`const isLoading = ...` stays in the parent page).
Reinforces anti-pattern #43 (cross-surface invariant test).

**§12 watch reconciliation:** all four candidates that §12 named
(CoachHomePage, AdminHomePage, ParentHomePage, formatters.js,
useAttendanceData.js) now reconciled — three split, one deferred
with headroom note. §12 itself can be re-scoped to a running watch
list rather than the specific four-line bullet.

**PR reference:** SHIPPED via PR #424
`refactor(home-pages): preemptive split per PQ3 (3 pages, 9
sub-components)`.

---

### §4.X — L99 platform-wide audit arc (CLOSED 2026-05-21)

Sustained PM session shipped 14 PRs closing Phase 1 + Phase 2 +
Phase 3 + Phase 4 partial from `docs/L99_PLATFORM_WIDE_AUDIT_2026-05-21.txt`
(v3) and `docs/L99_TEAMS_DETAILED_AUDIT_2026-05-21.txt`. See those
docs' closure addendums (Part 11 platform / Part 14 Teams) for the
full per-PR breakdown.

**Phase 1 (8 PRs):**
- **PR α** SHIPPED (PR #412) — 6 hook anti-pattern #36 batch
  (useCoachHomeSignals, useGameResultsMap, useKindUsage,
  usePrefetchChildRsvps, useUnreadCounts, useBriefingFilters).
- **PR β** SHIPPED (PR #411) — 3 page tap-target fixes (Messages,
  FinancialDashboard, ImportSchedule).
- **PR γ** SHIPPED (PR #410) — 2 hook anti-pattern #48 cleanups
  (useOrgTeamRecords, useTeamGamesByTournament).
- **PR δ** SHIPPED (PR #416) — BriefingsInbox loading gate (P0 closed).
- Companion: audit doc v3 (PR #413), CLAUDE.md amendments per
  amended AP #49 + AP #50/#51 candidates + §16.15 L99 template
  (PR #414), `.gitignore .claude/` chore (PR #415), Teams PR A
  (PR #417, see §4.U).

**Phase 2 (2 PRs, all in §4.U):** Teams PR B (#419) + Teams PR D
(#418).

**Phase 3 (3 PRs):**
- **PR ζ** SHIPPED (PR #420) — edge function mirror byte-compare
  audit shipped with 4-baseline allow-list (102 lines of drift
  recorded). CI-enforces anti-pattern #30.
- **PR ε** SHIPPED (PR #421) — E1 synthetic flag + E2
  `EMAIL_WRAPPER_OPEN` extraction across 4 send helpers.
- Teams PR C (#423, see §4.U).

**Phase 4 partial (2 PRs + 1 research):**
- **Mirror drift cleanup** SHIPPED (PR #422) — 4 pairs closed
  (102 → 17 irreducible TS-only residuals).
- **Home-page preemptive split** SHIPPED (PR #424, see §4.W).
- **Dead-feature audit** (research-only): no third NEW surface
  found for anti-pattern #51 promotion (LiveScorePage,
  suggest-briefing-closer, broadcast components all confirmed
  ACTIVE). #51 stays at candidate.

**Anti-pattern net additions/closures this arc:**
- #30 (mirror discipline): CI-enforced via PR #420 + drift closed
  via PR #422.
- #36 (destructured-default error swallow): 7 callsites closed
  across PRs #410 + #412 + #418.
- #37 (org_id scoping): 100% compliant verified by PR #418's audit
  test (`teamsPageOrgScopeAudit.test.js`).
- #43 (cross-surface invariant tests): 5 new invariant tests
  shipped (TeamPulseHeader, TeamDetailHeroPerRole,
  RsvpProgressBarCrossSurface, PlayerRowAcademyAvatar,
  edgeFunctionMirrorAudit).
- #48 (foreignTable .order): 3 callsites closed (PR γ + Teams PR D).
- #49 (full-paste discipline): amended via PR #414.
- #50 (audit-cascade): CANDIDATE — promotion pending second-pass
  results.
- #51 (dead-feature retirement): CANDIDATE — 2 instances
  (Engine Preview + TeamPlayerStats); no third NEW surface found
  tonight.
- §16.15 (L99 template): registered via PR #414.

---

### §4.Y — Deferred / future arc backlog (post-L99 close)

Per claude.ai PQ5/PQ7 routing — these arcs were intentionally
scoped OUT of the L99 closure session. They live here as the
canonical "next arc to pick up" surface.

**Multi-tenant readiness arc (PQ5)**
Scoped to St. Patrick's 2027 onboarding kickoff. Target window:
Q1 2027 unless St. Patrick's accelerates. Touches B5 (per-org
weather coords), per-org branding edge cases, RLS hardening for
multi-org seasonality, org_id surface audit for any new tables
landed in 2026-Q4. See L99 platform audit PART 5 Phase 4 for the
full scope frame.

**Component cleanup arc (PQ7)**
Defer until "first available week with no urgent shipping work."
Scope: TeamPlayerStats / TeamHeaderCard / CoachQuickActions /
MessageTeamFAB / MyChildSpotlight already deleted via Teams PR C;
remaining file-cleanup candidates live in §14 helper-extraction
backlog and §12 line-cap watch.

**Perf-pass arc**
Deferred. Holding C2 + C7 from Teams audit (useNow tick
re-renders TeamDetailPage subtree every 60s; React.memo on stable
children would resolve), V5 (Pulse grid scroll indicator), §4.M.1
P1-4 (`financial_transactions` over-fetch). Triggered when row
counts grow or FPS drops on iPhone 11 baseline.

**A11y full pass arc**
Deferred. Holding Teams audit A2 (tertiary text contrast against
page bg) + A3 (Pulse grid cells aria-labels) + focus ring
consistency + dynamic type support. Triggered before any parent
beta-test cohort that includes accessibility-need users.

**Second-pass platform audit (anti-pattern #50 test)**
Running in parallel research agent during the L99 close session.
Results pending. If yields ≥3 findings on a new surface for
anti-pattern #51, register #51's third instance (could be the
suggest-briefing-closer if active-but-half-built emerges). If
cascade prediction (13-15 findings per platform audit Part 3.1)
holds, anti-pattern #50 promotes from CANDIDATE to registered.

---

### §4.Z — L99 platform audit close + 49-PR session synthesis (2026-05-21)

Sustained session 2026-05-21 dispatched the L99 platform-wide audit
across 14 batches, executed in parallel by sub-agents per anti-pattern
#50's breadth-via-parallel-agents methodology. Cascade-near-zero
characteristic held (matches #50 origin case prediction). 49 PRs
merged session-end. This entry captures the audit-findings synthesis +
arc closures + new gaps that surfaced.

**Audit findings summary (full L99 platform-wide audit):**

- Batches dispatched: 14 (parallel sub-agent execution)
- Total findings: ~204 (7 P0, 45 P1, 86 P2, 66 P3)
- 2 P0s closed at session-end via PR #456 + #457 (messaging DM picker
  + useDmThreads otherName)
- 5 P0s remaining for routing: P0-C academy callup, P0-D doctrine,
  P0-E / P0-F / P0-G season rollover multi-tenant blockers
- 4 routing clusters deferred: Cluster 3 (#36 hooks layer ~34 sites),
  Cluster 4 (#51 retirement bundle), Clusters 5-8 (broader cleanup)

**Arc-level outcomes:**

- §4.X L99 platform-wide audit arc — CLOSED (see §4.X full breakdown
  for Phase 1-4 PRs; +1 closure addendum PR #425)
- §4.U Teams page redesign — CLOSED (PR A #417 + PR D #418 + PR B
  #419 + PR C #423 + Phase 5 #428 + V5 scroll #430 + tap-target
  regressions #439 closure)
- §4.W home-page preemptive split — CLOSED (PR #424; 3 pages split
  into 9 sub-components)
- New: foundation #36 sweep (PR #448) — 5 callsites closed
- New: edge function #36 sweep (PR #452) — bundle closure
- New: #36 audit test (PR #454) — static-grep gate locked
- New: SECDEF helper library (PR #455) — assert_org_owns_* helpers
  for cross-org validation; defense-in-depth over RLS
- New: Header bell removal + RequireAuth role-resolution contract
  (PR #449) — closes duplicate bell across role variants
- New: relkind='r' audit migrations (PRs #450, #451) — closes
  anti-pattern #24 corollary on player_game_stats + team_types
- New: team-feed RFC 5545 ICS compliance + bounded events query
  (PR #453) — completes V-23 SHIPPED-end-to-end work with strict
  RFC conformance
- New: foundation aria-live sweep (PR #446) — toast, offline
  banner, unread badge; pattern locked, propagation queued

**P0s remaining (routing forward):**

| Tag | Item | Scope | Routing |
|-----|------|-------|---------|
| P0-C | Academy callup token-handler P0 | Edge function path latent regression | TBD |
| P0-D | Doctrine P0 (CLAUDE.md mechanical edit) | Catalog amendment | Separate CLAUDE.md PR (parallel) |
| P0-E | Season rollover multi-tenant blocker #1 | RLS / org-scope gap | §4.Z routing forward |
| P0-F | Season rollover multi-tenant blocker #2 | Similar shape | §4.Z routing forward |
| P0-G | Season rollover multi-tenant blocker #3 | Similar shape | §4.Z routing forward |

**Multi-tenant readiness gaps (NEW — surfaced from Batch 11 P0s):**

3 P0 blockers in season rollover surface (`SeasonRolloverPage.jsx` +
`useSeasonRollover.js`) that prevent St. Patrick's onboarding from
proceeding cleanly. Joins the §4.Y multi-tenant readiness arc as
P0-blocking items (PQ5 scope expansion).

**Anti-pattern catalog amendments (deferred to separate PR):**

Per the scope constraint (this PR touches `docs/EMBER_PENDING_LEDGER.md`
ONLY per anti-pattern #9), CLAUDE.md amendments ship in a parallel PR:
- Anti-pattern #55 candidate registration
- Anti-pattern #56 candidate registration
- Anti-pattern #57 candidate registration
- Anti-pattern #58 candidate registration
- Anti-pattern #59 candidate registration
- auth.uid() wrapper pattern lock
- Anti-pattern #51 promotion (overwhelmingly met by Teams PR C
  TeamPlayerStats removal + Engine Preview retirement + audit-pass
  candidate findings) — promotion is queued for the catalog PR

**Methodology validation (anti-pattern #50 candidate):**

L99 platform-wide audit cascade dynamics:
- Methodology: breadth-via-parallel-agents (14 batch boundaries)
- First-pass yield: ~204 findings
- Second-pass cascade prediction (per #50 origin case): near-zero
- Actual second-pass: pending second-pass agent results (per §4.Y
  "Second-pass platform audit" entry); if cascade stays low, #50
  promotes from CANDIDATE to registered.

**Discipline locks promoted this session (per PR #443):**

7 discipline amendments bundled into CLAUDE.md PR #443:
- Anti-pattern #52 candidate (worktree-path pwd-first) via PR #431
- Section 9.1 pre-flight three-item opener (registered)
- Anti-pattern #54 candidate (same-MCP-burst ready-flip + auto-merge)
- ErrorBoundary §16.10 exemption (PR #444)
- Additional discipline locks: see PR #443 body

**Session-close pre-flight catch (this PR):**

Per Section 9.1 pre-flight discipline registered via PR #443, the
session-open audit on 2026-05-22 caught EMBER_PENDING_LEDGER §4
staleness — last entry was 2026-05-20. This PR closes the gap at
exactly one session boundary. Anti-pattern #45's drift-hedge
discipline holds: planning-doc changes accumulated across PRs
without ledger reconciliation cause silent drift; sub-2-min Section
9.1 pre-flight check (`git fetch && git log` + ledger §4 read) is
sufficient to catch the staleness deterministically.

**Anti-pattern #45 acid-test cycle 14:** session-close reconciliation
PR shipped within one session boundary of the originating work.
Cycle holds.

**Closure conditions:**

- ✅ Anti-pattern #9 compliance — ONLY `docs/EMBER_PENDING_LEDGER.md`
  touched in this PR; CLAUDE.md amendments ship in parallel PR
- ✅ Anti-pattern #45 compliance — ledger reconciled within one
  session of the 49-PR work
- ✅ Anti-pattern #54 compliance — PR created, flipped ready, auto-
  merge enabled in same MCP burst
- ✅ §1 SHIPPED entries added (49 PRs in 14 sub-tables)
- ✅ §4 closures for §4.X / §4.U / §4.W documented above; §4.Z
  captures new pending items (P0-C through P0-G + multi-tenant
  readiness expansion)
- ✅ §5 propagation patterns added (Pattern ALPHA #36 cascade,
  Pattern BETA aria-live, Pattern DELTA reconciliation, latent
  timezone bug, multi-tenant readiness gaps)
- ✅ §14 helper-extraction candidates added (8 ORG_NAME_DEFAULT
  copies, 2 formatDayLabel/formatTime copies, 9 inline formatter
  dupes, 4 CIRCUIT_LABELS files)

---

### §4.AA — Discipline-validating wave close + Cluster 1 + Cluster 3 closures (2026-05-22)

Session 2026-05-22 ran 7 PRs at the top of the 6-8 PR budget. The
shape was discipline-validating rather than discipline-generating —
no new audit dispatches, no new design calls routed, no new clusters
opened. The session contract (max 7-8 PRs, hard stop, no audit
cycle self-generation) held cleanly. Section 9.1 pre-flight ran at
session-open AND session-restart.

**Cluster closures this session:**

- **Cluster 1 (active production bugs)** — FULLY CLOSED.
  - PR #456 (yesterday) — messaging DM picker P0
  - PR #457 (yesterday) — useDmThreads otherName P0
  - PR #462 (today) — academy-callup picker flow bypasses registry,
    ships without tokens (P0-C from §4.Z routing forward)

- **Cluster 3 (anti-pattern #36 hooks cascade)** — FULLY CLOSED across
  PR-A/B/C bundle. Audit baseline reduced 50 → 32 (~17 hooks sites
  closed). Remaining 32 sites are in surfaces not yet audited
  (`lib` utilities have 3 sites flagged in Batch 2b, deferred).
  - PR #461 — PR-A, 6 P1 sites (high-priority hooks)
  - PR #463 — PR-B, 5 P2 sites (realtime + ride hooks)
  - PR #464 — PR-C, ~6 sites (legacy hooks sweep)

**Pattern propagation outcomes (see §5 for full Pattern ALPHA entry):**

Pattern ALPHA (#36 destructure cascade) status moved from
"foundation + edge function CLOSED, hooks queued" → **"foundation +
edge function + hooks ALL CLOSED."** Audit-test static-grep gate
locked via PR #454 (yesterday) catches regressions on land. With
the shipped-code surface area effectively complete, residual sweep
in `lib` utilities is bounded and can be deferred to a future
batched audit.

**P0s remaining from §4.Z routing forward:**

| Tag | Item | Routing | Status |
|-----|------|---------|--------|
| P0-C | Academy callup token-handler P0 | Cluster 1 | ✅ CLOSED via PR #462 |
| P0-D | Doctrine P0 (CLAUDE.md mechanical edit) | Catalog amendment PR | ✅ CLOSED via PR #458 (parallel) |
| P0-E | Season rollover multi-tenant blocker #1 | §4.Y multi-tenant arc | OPEN — deferred to PQ5 arc |
| P0-F | Season rollover multi-tenant blocker #2 | §4.Y multi-tenant arc | OPEN — deferred to PQ5 arc |
| P0-G | Season rollover multi-tenant blocker #3 | §4.Y multi-tenant arc | OPEN — deferred to PQ5 arc |

5 of 5 P0s from §4.Z addressed: 2 closed this session (P0-C + P0-D),
3 deferred per multi-tenant readiness arc routing (P0-E/F/G). The
deferred 3 join §4.Y as PQ5-scope blockers — not regressions, but
blockers for St. Patrick's onboarding when that arc engages (target
Q1 2027 unless St. Patrick's accelerates).

**Anti-pattern #52 refinement (surfaced this session):**

Anti-pattern #52 (worktree-path pwd-first) needed refinement. `pwd`
confirmation alone is insufficient when the Edit tool's path
resolution defaults to parent checkout even when `pwd` reports the
worktree directory. Discipline: agents working in worktree-isolated
context must use **explicit absolute worktree paths**
(`/home/user/skyfire-app/.claude/worktrees/agent-XXX/...`) in every
Edit tool call, not just pwd-relative paths. Held cleanly across
7/7 agents today. Refinement queued for the next CLAUDE.md
amendments PR (parallel to this ledger PR). See §14 discipline-notes
sub-section for the captured observation.

**Discipline locks held this session (7/7 agents):**

- Section 9.1 three-item opener pre-flight (branch + advisors +
  ledger): ran cleanly at session-open AND session-restart
- Anti-pattern #54 (same-MCP-burst ready-flip + auto-merge): 7/7 PRs
- Anti-pattern #55 (use actual PR# from create_pull_request response): 7/7 agents
- Anti-pattern #52 (worktree path discipline): 7/7 agents + refinement surfaced
- Session contract: 7 PRs at top of 6-8 budget, hard stop honored,
  no design calls routed, no new audit dispatches

**Methodology validation (anti-pattern #50, #53, #56, #59 candidates):**

- Anti-pattern #59 (close session when audits run ahead of routing
  capacity): origin case at yesterday's 11pm stop-hold. Today's
  shape validates the discipline — fresh-eyes routing executed
  cleanly without fatigue-driven escalation.
- Anti-pattern #56 (audit cycles need external stop conditions):
  session contract was pre-locked before opener move; held cleanly.
  Discipline cycle continued to work as a check, not as an
  accelerator. Today is the second occurrence of pre-locked
  session-contract discipline holding — promotion to registered
  is one more clean session away.

**Anti-pattern #45 acid-test cycle 15:** session-close reconciliation
PR shipped within same session as the originating work. Cycle holds.
This is the second reconciliation in two consecutive days — Section
9.1 three-item pre-flight at session-restart caught the gap that
yesterday's PR #460 missed (it covered yesterday's 49 PRs but not
today's later #461-#464).

**Closure conditions:**

- ✅ Anti-pattern #9 compliance — ONLY `docs/EMBER_PENDING_LEDGER.md`
  touched in this PR; CLAUDE.md amendments ship in parallel PR
- ✅ Anti-pattern #45 compliance — ledger reconciled within same
  session as the 7-PR work
- ✅ Anti-pattern #52 compliance — explicit worktree path used in
  every Edit tool call
- ✅ Anti-pattern #54 compliance — PR created, flipped ready, auto-
  merge enabled in same MCP burst
- ✅ Anti-pattern #55 compliance — actual PR# from
  `create_pull_request` response used, not guessed
- ✅ §1 SHIPPED entries added (7 PRs in 2 sub-tables)
- ✅ §4.AA captures arc-level closures (Cluster 1 fully closed,
  Cluster 3 fully closed via PR-A/B/C)
- ✅ §5 Pattern ALPHA updated (foundation + edge + hooks ALL CLOSED;
  audit baseline 50 → 32)
- ✅ §14 discipline-notes adjacent to helper-extraction added
  (anti-pattern #52 refinement)

**Session summary:**

2026-05-22 discipline-validating session, 7 PRs, contract held, audit
cycle did not self-generate. Yesterday's 11pm stop-hold validated
today: fresh-eyes routing of the §4.Z catalog produced clean Cluster
1 + Cluster 3 closures + catalog amendments + advisor hygiene
+ ledger reconciliation, with no escalation into new audit
dispatches. Closes Phase 1.1 from next-phases ready-state doc.
Catalog amendments (#52 refinement + #51 + #54 promotions) ship in
parallel CLAUDE.md PR.

---

### §4.AB — Extended Phase 2 + Phase 3 close (2026-05-22 PM, followup)

Session extended past the original 7-PR discipline window into a
19-PR wave engaging Phase 2 (dead-feature retirement) + Phase 3
(design-call closures). Anti-pattern #51 promotion via PR #465
unlocked the dead-feature retirement sweep; Phase 3 design calls
(Q1/Q4/Q5/Q6/Q7) routed under Pattern B / Option A locked routing.

**Phase 2 (Cluster 4 dead-feature retirement) — FULLY CLOSED.**

Anti-pattern #51 promoted from candidate to registered in PR #465
(third-instance criterion overwhelmingly met: 17+ NEW dead-feature
surfaces accumulated post-candidate-registration). 5 retirement
PRs shipped this session under Phase 2.2 sub-arc:

| PR    | Sub-arc | Scope                                                  | Lines retired |
|-------|---------|--------------------------------------------------------|----------------|
| #467  | 2.2b    | TeamPlayerStats + PlayerStatsTable orphan files        | -119          |
| #468  | 2.2c    | InstallPrompt + WelcomeOverlay dead stubs              | -18           |
| #469  | 2.2a    | 5 event/ orphans (RsvpSummaryBlock, EventDetailTab, etc.) | -285        |
| #470  | 2.2d    | useSortedPlayers dead export                           | -7            |
| #471  | 2.2e    | renderers/scheduleChange.js legacy composer            | -219          |

Combined with Phase 3 Q4 (PR #472, -651 lines): total ~1300 lines
deleted across orphan components, renderers, hooks, and section
types. Anti-pattern #42 zero-consumer detection signal worked twice
(useSortedPlayers caught from PR #441, useComposeBriefing closed in
PR #462). The name-collision trap eliminated in PR #471 (legacy
renderer at renderers/scheduleChange.js vs. active composer at
resolvers/scheduleChange.js) — previously a future-Frank confusion
hazard.

**Phase 3 (design-call closures) — PARTIALLY CLOSED.**

| Q | Item | Status | Disposition |
|---|------|--------|-------------|
| Q1 | SECDEF adoption | ✅ SHIPPED | Closed earlier — see §4.AA reconciliation by PR #466 |
| Q2 | Per-player game stats lift | ⏸ DEFERRED | §16.12 doctrine — needs Kenny conversation |
| Q3 | Balance carry-forward | ⏸ DEFERRED | Phase 4 MT readiness arc |
| Q4 | 8 SECTION_RENDERERS orphans | ✅ SHIPPED via PR #472 | Wave 3 build-ahead never adopted; Option A locked routing |
| Q5 | Dual-compose for schedule_change | ✅ SHIPPED via PR #473 | Pattern B locked routing — deferral comments inline |
| Q6 | (verified no-op) | ✅ VERIFIED | No PR needed |
| Q7 | schedule_change fan-out | ✅ SHIPPED via PR #473 | Pattern B locked routing — deferral comments inline |
| Q8 | AdminHomePage growth | ⏸ DEFERRED | Irony test fired — needs decompose first or alt routing |

5 of 8 design calls closed (Q1/Q4/Q5/Q6/Q7). 3 deferred (Q2/Q3/Q8)
with documented routing rationale: Q2 + Q3 are doctrinal /
multi-tenant blockers awaiting external conversations; Q8 hit the
irony test (proposed fix would grow AdminHomePage further, violating
the very growth-ceiling it's meant to address).

**P0 summary across both phases:**

| Tag | Item | Routing | Status |
|-----|------|---------|--------|
| P0-C | Academy callup token-handler | Cluster 1 | ✅ CLOSED via PR #462 (yesterday's §4.AA) |
| P0-D | Doctrine P0 (CLAUDE.md edit) | Catalog amendment | ✅ CLOSED via PR #458 (yesterday's §4.AA) |
| P0-E | Season rollover MT blocker #1 | §4.Y multi-tenant arc | OPEN — deferred to PQ5 arc |
| P0-F | Season rollover MT blocker #2 | §4.Y multi-tenant arc | OPEN — deferred to PQ5 arc |
| P0-G | Season rollover MT blocker #3 | §4.Y multi-tenant arc | OPEN — deferred to PQ5 arc |

No new P0s introduced this session.

**Discipline status this session (19 PRs):**

- Anti-pattern #54 (same-MCP-burst ready-flip + auto-merge):
  **18/19 holds** — broke once on PR #468 (manually flipped ready
  post-creation, no auto-merge fired). First break in 22+
  consecutive holds. Watch list: second break triggers pause +
  document.
- Anti-pattern #52 refinement (explicit worktree path):
  **broke twice today** on its registration day — PR #460
  (recovered mid-flight by agent) + PR #473 (parent-checkout
  leakage detected post-merge). Watch list: third break promotes
  to deeper investigation (Section A.4 in remaining-phases audit
  doc).
- Anti-pattern #55 (use actual PR# from create_pull_request
  response): held cleanly across all 19 PRs.
- Anti-pattern #9 (touch only what the prompt asks): held cleanly
  across all 19 PRs — file-deletion sweeps were surgical.

**Session Contract v3 adopted end-of-day.**

Mid-session contract refresh adopted Contract v3 with new rules
binding the deploy chain to ledger discipline:

- **Rule S2:** doc writes are free actions, no GO needed for the
  agent dispatch.
- **Rule S6:** one fix per prompt — prevents agent scope creep.
- **Rule S9:** build queue + ledger update bound to deploy chain
  commit. Today's PRs #467-#473 violated this (anti-pattern #9
  violation pattern from yesterday's session); this followup PR
  closes the gap.

This followup reconciliation PR is the first ledger update written
under Contract v3's same-commit discipline framing. The Rule S9
violation that produced this PR is the discipline signal that
binds the new contract: planning-doc / ledger updates ship in the
same commit as the deploy work, not as a session-close batch.

**Anti-pattern #45 acid-test cycle 16:** session-close
reconciliation PR shipped within same session as the originating
work, scoped narrowly to the 7 missed PRs from this session's
extension. Cycle holds — Section 9.1 three-item pre-flight at
session-open caught the gap that PR #466 missed (it covered up
through #466 but not the later #467-#473 wave).

**Closure conditions:**

- ✅ Anti-pattern #9 compliance — ONLY `docs/EMBER_PENDING_LEDGER.md`
  touched in this PR
- ✅ Anti-pattern #45 compliance — ledger reconciled within same
  session as the #467-#473 work
- ✅ Anti-pattern #52 refinement compliance — explicit worktree
  path used in every Edit tool call
- ✅ Anti-pattern #54 compliance — PR created, flipped ready, auto-
  merge enabled in same MCP burst
- ✅ Anti-pattern #55 compliance — actual PR# from
  `create_pull_request` response used, not guessed
- ✅ §1 SHIPPED entries added (7 PRs across 3 sub-tables)
- ✅ §4.AB captures Phase 2 (FULLY CLOSED) + Phase 3
  (Q1/Q4/Q5/Q6/Q7 closed; Q2/Q3/Q8 deferred) closure synthesis
- ✅ §5 propagation patterns updated (Pattern ALPHA status,
  anti-pattern #52 + #54 watch lists)

**Session summary:**

2026-05-22 19-PR wave across original discipline window + extended
Phase 2 + Phase 3 close. Cluster 1 (production bugs) FULLY CLOSED.
Cluster 3 (#36 hooks cascade) FULLY CLOSED. Cluster 4 (dead-feature
retirement) FULLY CLOSED via #51 promotion + 5 retirement PRs.
Phase 3 5/8 design calls shipped. Contract v3 adopted end-of-day
captures the same-commit ledger discipline that this followup PR
embodies. Anti-pattern #51 promoted (third-instance criterion).
Anti-pattern #52 watch list: broke twice today on registration day.
Anti-pattern #54 watch list: broke once today in 22+ holds.

### §4.AC — Q8 AdminHomePage decomposition (deferred 2026-05-22)

**Status: DEFERRED. Trigger: cap pressure (next material change requires >150 lines).**

AdminHomePage.jsx is at 142/150 lines (anti-pattern #6 cap). Yesterday's
Phase 3 Q8 routing attempted to ship an inline deferral comment; the
irony test fired (13-line comment block would push the file to 155
lines). Routing pivoted to Option B: documentation lives in CLAUDE.md
§6 (zone decomposition pattern) + this ledger entry tracking the
deferred work.

**When triggered, execute:**
1. Decompose AdminHomePage.jsx into `src/components/admin-home/`:
   - AdminHomeAlertZone.jsx
   - AdminHomeSignalZone.jsx
   - AdminHomeHeader.jsx
2. AdminHomePage.jsx becomes a thin wrapper (~50 lines)
3. Cross-surface invariant test per anti-pattern #43 locks per-role
   behavior

**Reference implementations:** parent-home (PR #424) + coach-home (PR
#424 same session) zone components shipped 2026-05-21.

**Trigger condition:** the next admin-home feature requiring material
change to AdminHomePage.jsx. Do not decompose preemptively per §16.13
"ship not gate by config."

**Why this lives here and not as inline comment:** the 13-line guidance
comment would itself breach the 150-line cap the guidance warns about
(Q8 irony test, 2026-05-22 Phase 3 routing).

Decision routing: 2026-05-22 (Phase 3 Q8, claude.ai Option B locked).
