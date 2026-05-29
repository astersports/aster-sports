# STATE OF AFFAIRS L99: v6
## Legacy Hoopers / Ember Platform Build

**Written:** May 20, 2026 (afternoon, after the Frank-reported feedback marathon)
**Verified against production:** May 20, 2026 ~13:15 UTC via Supabase MCP + GitHub MCP
**Production main HEAD at writing:** post-#363 merge (`opponents_sync_from_game_results`)
**Latest production migration:** `20260520131038_opponents_sync_from_game_results`
**Supersedes:** v5 (May 9). v5's headline (digest pipeline live, pilot mode locked) is still accurate; v6 is a delta on top of v5 plus the May 9 → May 20 build-out arc.
**Evidence basis:** Live Supabase MCP queries against project `vrwwpsbfbnveawqwbdmj`, GitHub MCP queries against `LegacyHoopers/skyfire-app`, Sentry MCP for production error inventory.

---

# HOW TO USE THIS DOCUMENT

v6 is a session-level recap of the May 20 afternoon arc — the most productive single session in the project's history by PR count. The arc opened with two Frank-reported bugs (Teams form not saving, Notify-families crash) and grew to 17 PRs covering UX gaps, data-sync gaps, navigation gaps, and one architectural anti-pattern that's now locked in CLAUDE.md.

If a previous L99 (v1-v5) describes the system differently in any of the areas v6 touches, v6 wins.

If chat-side is reading this to plan the NEXT session, jump to Part 6 ("Forward priorities + open decisions") and Part 7 ("Hand-back to Frank").

---

# PART 1: HEADLINE — DATA-SYNC TRIGGER PATTERN ESTABLISHED, ANTI-PATTERN #46 LOCKED

Two structural shifts came out of this session that will compound:

## 1.1 Manual-aggregate columns are silently stale until a trigger fixes them

Three separate Frank-reported bugs traced to the same root cause: aggregate columns on parent tables (`tournament_teams.final_place / final_record_wins / final_record_losses`, `opponents.head_to_head_wins / head_to_head_losses / last_played_at`) were never wired to the child-table inserts that should populate them. Score entry persisted into `game_results` but the parent aggregates stayed at zero or last-manual-value indefinitely.

PR #357 (tournament_teams) and PR #363 (opponents) shipped the same trigger pattern:
- `SECURITY DEFINER` helper `sync_X_record(parent_id)` that recomputes from current `game_results filtered on published_at IS NOT NULL`
- AFTER INSERT/UPDATE/DELETE trigger on `game_results` that fires the helper
- AFTER UPDATE trigger on the linking table (`events`) to catch FK / classification flips (`is_championship_final`, `tournament_id`, `opponent_id`)
- One-time backfill DO-block at migration time so production is in sync the moment the migration lands

The pattern generalizes: **any manual-aggregate column on a parent table where score entry or activity entry should keep it fresh** is a candidate for the same trigger shape. Audit candidates for the next session:
- `team_achievements` aggregates (currently no manual columns; safe)
- Future per-player season stats if/when we add them
- Coach payouts derivable from `events` × `coach_assignments` — currently manual

## 1.2 Code-only audits miss visual rhythm (anti-pattern #46)

The session opened a second loop: Frank reported "different font size on Schedule games view upcoming vs results" and a chat-side audit read the code, saw matching `fontSize: 17` literals after PR #351, and concluded no divergence. The real divergence was layout, not typography — the past-state `MatchupCard` rendered a 2-line opponent column (opponent + date stacked) while the upcoming state rendered a single line. Same fontSize, different row heights, reads as "different font size" to a human eye.

PR #359 inlined the date and shipped a cross-surface invariant test. PR #359 also registered **anti-pattern #46** in CLAUDE.md:

> PRs that touch `*Card.jsx` / `*Row.jsx` / `*Tile.jsx` ship with one of: (a) a cross-surface invariant test, (b) a before/after screenshot, or (c) a typography token reference.

This anti-pattern names a class of bug that audits cannot detect by reading code alone. It's a process gate, not a code rule.

---

# PART 2: SHIPPED INVENTORY (17 PRs + 2 trigger migrations + 1 anti-pattern)

Listed in merge order. All merged to `main` via §15 auto-merge.

| # | Type | Title | Surface |
|---|---|---|---|
| 347 | fix | filter null guardian_ids in fetchKidNames | resolver hardening |
| 348 | fix | teams: add practice_day / practice_location / circuit_name / gender columns | schema migration + backfill |
| 349 | fix | records: sort game log by event.start_at chronologically | hook |
| 350 | feat | wizard: require opponent for games and tournaments | form validation |
| 351 | fix | schedule/games: match results font size to upcoming time (17px) | card typography |
| 352 | chore | admin-home: remove KPI 4-tile grid | layout cleanup |
| 353 | fix | records: broaden nationals regex + backfill Rumble champs | UI + data |
| 354 | feat | admin-home: scope ActionZone to scores + invites (drop RSVP triage) | hook |
| 355 | chore | admin-home: remove dead achievements pending-review lane | hook + dead code delete |
| 356 | fix | pwa: SW cache bump + chunk auto-reload + Sentry instrumentation | PWA hardening |
| 357 | feat | records: auto-sync tournament_teams from game_results | trigger migration |
| 358 | fix | records: preserve start_at in summary + compact TournamentCard | hook + redesign |
| 359 | fix | schedule: inline date on past matchup cards + invariant test | card layout + test + anti-pattern #46 |
| 360 | fix | admin-home: point +Event + +Player CTAs at flows that actually work | nav |
| 361 | fix | admin: add Back button to admin sub-pages | nav |
| 362 | feat | program-health: replace Attendance with Active teams count | metric swap |
| 363 | feat | opponents: auto-sync head_to_head from game_results | trigger migration |

### Migrations applied (with mirror files in `supabase/migrations/`):

- `20260520105541_teams_add_practice_and_gender_fields` (PR #348)
- `20260520120945_tournament_teams_sync_from_game_results` (PR #357)
- `20260520131038_opponents_sync_from_game_results` (PR #363)

### Anti-patterns registered:

- **#46** (PR #359): cross-component visual rhythm requires invariant test / screenshot / token reference
- **#47** (registered 2026-05-20 PM, chat-side pressure-test): branch-reset hazard — switch to main BEFORE `git reset --hard origin/main`; promoted from candidate to registered on first occurrence per "operational rule preventing data loss" calibration heuristic
- **#48** (registered 2026-05-20 PM, chat-side pressure-test): PostgREST `.order(col, { foreignTable })` is a no-op for parent rows — always sort in JS for parent-row ordering. Short corollary entry, not a full anti-pattern

Catalog state pre-session: #45 entries registered. Post-session: #46/#47/#48. (Chat-side pressure-test verified contiguous catalog via `grep -nE "^[0-9]+\. \*\*" CLAUDE.md` after v6's initial draft raised a numbering question — file was clean, v6's #46 claim was correct.)

### Pre-PR work via Supabase MCP:

- Archived 3 stale `team_achievements` rows (seed data from May 6)
- Backfilled Rumble for the Ring CT champions/finalists/records (before PR #357 trigger landed)
- Backfilled 5 LH Spring 2026 team rows with `practice_day` / `practice_location` / `circuit_name` / `gender` (after PR #348 migration)
- Verified WPCYO Spring League 2026 records corrected via trigger backfill (10U Blue 3-2, 9U Boys 1-6)

---

# PART 3: ROOT-CAUSE PATTERNS SURFACED

Five distinct bug classes appeared and have generalizable lessons.

## 3.1 PostgREST nested-table ordering is silently a no-op for parent rows

`.order('start_at', { foreignTable: 'events', ascending: true })` orders **embedded subarrays**, NOT parent result rows. Two separate hooks (`useTeamGamesByTournament`, `useOrgTeamRecords`) were structured assuming this ordering would sort the top-level rows. It doesn't. The fix in both cases was JS-side sort after fetch, but the cleaner discipline is: **never trust `foreignTable` ordering for parent-row sort**. Always sort in JS.

Same root cause produced PR #349 (game log entry-order on Records page) and PR #358 (form-guide entry-order on Records page summary).

## 3.2 Aggregate columns without triggers go stale

Documented in Part 1.1. Three columns × two tables × multiple Frank-reported symptoms = same anti-pattern. The trigger pattern is now established and should be applied proactively to any new manual-aggregate column.

## 3.3 PWA service-worker cache + chunk-hashed bundles = stale-asset crashes

After 6 deploys in a single session, Frank's PWA-cached `index.html` referenced Vite-hashed chunk URLs that no longer existed on Vercel's CDN. `React.lazy()` threw `ChunkLoadError`; the existing root ErrorBoundary caught it and rendered "Something went wrong / Refresh" — but `componentDidCatch` only `console.error`'d, so Sentry showed zero events despite real production crashes.

PR #356 shipped three fixes: SW cache name bump, auto-reload on `ChunkLoadError` from the boundary, and `Sentry.captureException` wired into `componentDidCatch`. Next time it happens we'll have a trace.

## 3.4 Admin shortcut CTAs pointed at the wrong destinations

`+ Event` routed to `/schedule` (where the user had to tap a second + FAB). `+ Player` routed to `/teams` (no add-player flow exists; players come in via Season Rollover or bulk import). Both were broken-but-quiet — the CTAs *worked*, they just didn't take the admin where they expected.

PR #360 fixed by:
- `+ Event` → `/schedule?wizard=1` (existing query-param wiring auto-opens the wizard)
- `+ Player` renamed to `+ Member` → `/admin/members` (the only adjacent create surface that actually works)

The systemic lesson: **CTA destinations should match the user's expectation of what happens, not the destination's URL**. Audit the rest of the shortcut grid for the same gap.

## 3.5 Code-only audits miss visual / cross-component rhythm

Documented in Part 1.2 (anti-pattern #46).

---

# PART 4: METHODOLOGY DISCIPLINE OBSERVATIONS

Three operator/agent dynamics worth naming.

## 4.1 Frank's "auto proceed" delegation pattern

At ~10:50 UTC Frank said: "Continue with your lean then auto proceed until all are completed." This unlocked rapid-fire serial PR shipping where CC made design calls on each item without round-tripping. Worked extremely well for items with clear scope (B/C/E/F/I/J in the original triage).

For items requiring genuine design choice (D — Achievements review screen, H — Records page redundancy), CC paused and asked anyway. Frank's pattern: "I trust your call on small things; I want to weigh in on architectural/destructive choices."

Calibration heuristic for next session: if the item involves **deletion**, **adding a new surface**, or **changing user-visible labels in a non-obvious way**, ask. Otherwise execute.

## 4.2 Branch-reset hazard

Twice in the session CC did `git reset --hard origin/main` after a PR merged, intending to start the next branch from a clean main — but doing it while still on a feature branch with uncommitted work wiped the work in progress. Recovery cost: ~5 minutes of re-edits both times.

Discipline: after a PR merges, switch to main FIRST (`git checkout main && git pull`), THEN branch off. Never `git reset --hard` on a feature branch with uncommitted work without first stashing.

This is operationally similar to anti-pattern #22 ("verify the merge"). Worth adding as #47 if it recurs.

## 4.3 PR #361 CI failure caught by webhook subscription discipline

PR #361 (back buttons) failed lint-test-build because adding `AdminBackHeader` (which uses `useNavigate`) broke `AdminManagerLayout.test.jsx` (9 tests didn't have a Router wrapper). The webhook subscription pattern surfaced this instantly: GitHub fired the CI-failure event, CC investigated, fixed both the Router-wrap and a `queryByRole('button')` over-broad assertion, pushed in one round-trip, CI passed.

Without the subscription, this would have been discovered hours later via Frank's iPhone smoke. The subscription pattern paid for itself.

---

# PART 5: FINDINGS & RECOMMENDATIONS (FROM SCREENSHOT-SCAN PASS)

After all shipping completed, Frank shared screenshots of admin surfaces beyond what was directly bug-reported. CC scanned and produced this forward queue.

## 5.1 Bugs worth fixing — small, well-scoped (TIER P1)

### B1. New Tournament form — checkbox state invisible

Where: New Tournament sheet → "Teams Attending" list
Symptom: Each team renders as a card with a colored bullet. There's no visible checkbox or checkmark, so admin can't see which teams are selected vs not.
Fix: Add a `<Check />` icon (Lucide) or `aria-checked` pill style. ~20 lines in the TournamentFormSheet's team picker.

### B2. Historical events with opponent = "TBD" or null

Where: Schedule list and Results cards
Symptom: ~5 upcoming + ~2 past LH events show "vs TBD" because their `opponent` was never set. PR #350 prevents new ones; historical rows persist.
Fix options:
- (a) One-shot data hygiene alert: surface these in the admin home alerts lane until cleaned
- (b) Bulk Edit Opponent modal for sweeping through
Recommendation: (a) is lighter — surfaces the issue without a new admin UI. ~30 lines + an alert config row.

### B3. Financials shows "Winter 2025-26" tab even when empty

Where: Admin Financials page, season picker
Symptom: Tab visible despite no data. Per CLAUDE.md only Fall 2025 + Spring 2026 are active for LH.
Fix: Filter `seasons` query to ones with `financial_accounts.count > 0`. ~10 lines.

### B4. Coach team roster shows "3% Going · 97% NR" — confusing label

Where: TeamDetailPage → Roster card per player (Lily Alexander screenshot)
Symptom: When no RSVPs exist in the window, the % shows misleading extremes (3 / 97). Reads as a real attendance signal.
Fix: When the player has ≤1 RSVP datapoint, render "No RSVPs yet" instead of percentages. ~10 lines in the roster row component.

## 5.2 UX enhancements — design call needed (TIER P2)

### C1. Engine Preview surfaces a dev/preview tool in production admin

Where: Admin Shortcuts → MANAGE → "Engine Preview" tile
Status: Internal renderer-debugging tool (#2 Stat Grid, #4 Pool Standings, etc.) accessible to all admins.
Options: (a) Hide via feature flag; (b) Move to `/admin/dev` not in main grid; (c) Remove entirely.
Recommendation: (b) — preserves the tool, gets it out of the main flow.

### C2. Tournament conflict warning

Where: Tournaments list — Jun 6-7 has *two* tournaments registered:
- "Pre Summer Hoops Jam Classic 1 & 2" (8U Boys)
- "2026 Zero Gravity Boys National Finals" (10U Black)

Risk: If admin accidentally adds 8U Boys to both, scheduling conflict. Today no warning.
Fix: Banner on the New Tournament form when a selected team is already on another tournament in the same date range. ~30 lines.

### C3. Form field required/optional indicators inconsistent

Where: New Member, New Location, New Tournament, Edit Team
Symptom: Required fields aren't visually marked (no `*`). Save button greys when invalid but doesn't tell why.
Fix: Add the same red `*` pattern from PR #350 (Opponent on the wizard) to every required field. Pair with a small helper line under invalid fields. ~50 lines across 4-5 forms.

### C4. Members list — guardian count vs family count clarity

Where: Members header "175 guardians · 190 kid links"
Symptom: ~3 guardians/family but no family grouping in the list. Possible enhancement: group guardians by shared kids so admin can spot duplicates.
Recommendation: Defer until Frank confirms this is a real pain point.

## 5.3 Data hygiene tasks (TIER P3)

### D1. Import 30 tournament-opponent strings into the opponents directory

Where: PR #363 noted this — events with text-only `opponent` (PHD - Carothers, CT Wolves, Team Frenji, etc.) don't contribute to head-to-head counts.
Effort: SQL one-shot insert from distinct `events.opponent` values where no matching opponent row exists, then backfill `events.opponent_id` via name match. ~15 mins.

### D2. Historical events with no opponent (overlaps with B2)

Same SQL sweep, surface in alerts lane.

## 5.4 Process / discipline items (TIER P4)

### E1. Anti-pattern #46 CI guard

Today the anti-pattern lives in CLAUDE.md prose. Future automation: GitHub Actions step that fails CI if a `*Card.jsx` / `*Row.jsx` / `*Tile.jsx` file is in the diff WITHOUT an accompanying invariant test added in the same PR. Simple grep job.

### E2. PR template checklist

Add `.github/PULL_REQUEST_TEMPLATE.md` with a 4-line checklist:
- [ ] Touched `*Card` / `*Row` / `*Tile` → invariant test or screenshot attached
- [ ] Touched `supabase/migrations/` → mirror file matches MCP-applied version (#21)
- [ ] Touched admin home hooks → visual verification noted
- [ ] Used `.in()` / `.eq()` with potentially-null values → filtered with Boolean (#36 corollary)

Lightweight, no infra needed.

### E3. Operator-CC discipline: branch reset hazard (4.2 above)

If it recurs, promote to anti-pattern #47.

### E4. Audit candidates for trigger pattern (1.1 above)

Sweep parent tables for manual aggregate columns that depend on child-table activity. Pre-empt the next "Frank-reported aggregate is stale" cycle.

---

# PART 6: FORWARD PRIORITIES + OPEN DECISIONS

## 6.1 Ranked priority for next session (revised post chat-side pressure-test)

| Tier | Items | Why |
|---|---|---|
| P1 — ship next | B1, B2, B3, B4 | Small, clear, no design call. B2 promoted from P3 — Frank will see TBD-opponent cards on iPhone within 24h |
| P2 — Frank decides | C1, C2, C3 | Design choices |
| P3 — data hygiene | D1 | One-shot SQL (D2 absorbed into B2's alert-lane fix) |
| P4 — process | E2, E1 | Compounds over time |
| P-deferred | C4 | Until Frank confirms real pain |

**Engine Preview C1 lean (chat-side concur):** (b) move to `/admin/dev` — preserves debug surface, gets it off the user-facing path. Same anti-pattern class as PR #360's CTA destinations (internal-vs-user-expected mismatch).

## 6.2 Open decisions for Frank

1. **Engine Preview placement (C1)** — keep / move to /admin/dev / remove?
2. **Tournament conflict warning style (C2)** — soft warning banner or hard block?
3. **Required-field marker (C3)** — adopt the red asterisk pattern from PR #350 everywhere?
4. **PR template (E2)** — adopt or skip?

## 6.3 Things Frank already locked this session

- Records page is staying (H from earlier triage) — not removed
- "+ Player" stays as "+ Member" → /admin/members — Frank accepted CC's lean
- Attendance metric replaced by Active teams (not active players, per Frank's explicit preference for "programs or teams")

---

# PART 7: HAND-BACK TO FRANK

## 7.1 What's working in production right now (verified)

- All 17 PRs merged and deployed (Frank: "Passed" at session close 2026-05-20 PM after iPhone smoke)
- 2 trigger migrations live with backfills applied
- Anti-patterns #46/#47/#48 registered in CLAUDE.md
- Schedule games + Records page now visually consistent on iPhone (Frank-verified via "Passed" smoke)
- Notify-families null-guardian-id crash fixed (PR #347 resolver hardening); end-to-end test send not directly named in "Passed" smoke but implied by no further crash report. **Evidence boundary:** Frank's "Passed" message covers the iPhone smoke surfaces visible in the screenshot batches; explicit Notify-families test send by Frank was not separately documented post-#347. If chat-side or Frank needs hard evidence before the 11U Girls rollout relies on this surface, run an admin test send before broadcast.
- Edit Team form actually saves now (PR #348) — Frank-verified
- Records page shows correct champions + nationals counts (PR #353) — Frank-verified
- Records game log + form guide both in chronological order (PR #349 + #358) — Frank-verified
- Admin home is cleaner (no KPI grid, no dead achievements lane, scores-only action lane) — Frank-verified
- All admin sub-pages have back buttons — Frank-verified via screenshot tour
- Opponents page shows real head-to-head for the 12 CYO opponents (sync trigger; Frank-verified via iPhone smoke)

## 7.2 What needs Frank's verification on next visit

- Active teams count renders on Program Health (PR #362)
- +Member CTA routes to working form (PR #360)
- New Tournament checkbox state question (would need to attempt a tournament create to surface)
- Engine Preview placement question (C1)

## 7.3 What's queued for chat-side discussion

This document is the queue. Chat-side Claude has full context to triage and route the P1-P4 items in 6.1 above.

If Frank wants to ship more this evening, the lowest-risk start is **B1 (checkbox state)** — 20 lines, no decisions, surfaces a visible bug on a form admin uses.

If Frank wants to take a process step, **E2 (PR template)** is a 10-minute add that compounds over every future PR.

---

# PART 8: NUMBERS SUMMARY

- 17 PRs end-to-end (347 → 363)
- 3 migrations applied + mirrored
- 1 anti-pattern locked (#46)
- ~3 hours of intensive session time (10:30 UTC → 13:15 UTC)
- ~6 Frank-reported bug threads opened and closed within the session
- 12 CYO opponent rows backfilled with real W-L
- 5 LH team rows backfilled with practice info
- 0 production Sentry events in the 24h prior (chunk crashes were going to console.error only — PR #356 fixes this)
- 0 PRs needed manual override or labeled `do-not-auto-merge`
- 0 rollbacks

End of v6.
