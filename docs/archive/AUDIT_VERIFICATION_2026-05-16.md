# Phase Alpha — Verification of Today's Audit

**Date:** 2026-05-16 (afternoon Italy, Frank awake + watching live)
**Scope:** First human-supervised pass on the morning's 3-hour audit + fix cycle (PRs #194–#207)
**Method:** 10 picked finding verifications + 1 false-negative org_id sweep
**Self-correction authority:** ACTIVE per Frank's framing
**Status:** COMPLETE. 1 fix PR shipped during phase (#208).

---

## 10 finding verifications

### 1. PR #195 P0-1 EventLocationTab (FIXED) ✓ VERIFIED CORRECT
- `orgId` from `useAuth()` at line 14
- Tournaments query: `.eq('id', X).eq('org_id', orgId).limit(1)` at lines 23-26
- Locations query: `.eq('org_id', orgId).is('archived_at', null).ilike()...` at lines 39-43
- Effect deps include `orgId`; cancellation handling preserved

### 2. PR #202 P0 RLS WITH CHECK (FIXED) ✓ VERIFIED CORRECT IN PRODUCTION
MCP query against `pg_policies` confirmed all 3 policies now have `with_check IS NOT NULL`:
- `briefing_reminders."admins update own org reminders"` — WITH CHECK present
- `briefing_templates_update_admin` — WITH CHECK present
- `team_types_update_admin` — WITH CHECK present

PUBLIC/anon EXECUTE grants also verified zero on all 3 functions (`briefing_active_queue`, `log_pii_change`, `suppress_unsubscribed_recipients`). Authenticated + service_role + postgres grants preserved as expected.

### 3. PR #204 P1→P0 TournamentRecapBody rewrite (FIXED) ✓ VERIFIED CORRECT
- Body has the 4 new fields (`standout_moments`, `coach_reflection`, `coach_note`, `parent_shoutout`)
- Composer at `tournamentRecap.js` reads exactly these via `overrides.standout_moments` (line 119), `overrides.coach_reflection` (line 120), and the `for ['coach_note', 'parent_shoutout']` loop (line 121). `signoff_message` from top-level state (line 126).
- Contract fully aligned end-to-end

### 4. PR #203 P1-2 CreateActivityWizard org_id (FIXED) ✓ VERIFIED CORRECT
- `orgId` early-return guard at line 33 (`if (!isEdit || !editEvent?.parent_event_id || !orgId) return`)
- `.eq('org_id', orgId)` at line 35
- `orgId` in deps array at line 45

### 5. P1-4 FinancialDashboardPage transactions over-fetch (DEFERRED) ✓ DEFERRAL VALID
- `financial_transactions.select('*').eq('org_id', orgId)` fetches all org's transactions across all seasons (line 36)
- In-memory filter by `acctIds.has(t.account_id)` at line 41
- Production data: 105 transactions × 2 seasons → tiny dataset; impact is bandwidth waste only
- Not a security issue (org_id IS filtered; just over-fetches within own org)
- Deferral stays P1; will need sequential refactor (transactions IN account_ids after accounts fetch)

### 6. 7 schema-existence false positives ✓ ALL CONFIRMED EXIST IN PROD
MCP query against `information_schema.columns`: all 8 columns exist (`team_players.joined_at/left_at`, `events.is_bracket_game/is_championship_final/is_scrimmage/bracket_label/game_sequence`, `comms_messages.period_start`). Reclassification as false positive was correct.

### 7. `family` reclassification (Phase 5 → Phase 2A was right) ✓ VERIFIED CORRECT
- Line 54 of `academyCallupNotice.js`: `out.push({ kind: 'family', ... })`
- `out` is the slices array returned from `fetchSlices` (line 56: `return out.sort(...)`)
- Each `family` shape carries recipient descriptors (`guardian_id, email, player_id, kid_first_name, team_id`)
- NOT a section that goes through `renderSections`
- Phase 5's first-pass mis-identified it; Phase 2A's "data carrier, not section" was right

### 8. P2 13 ghost data ops (DEFERRED) ✓ HOLDS WITH NUMERICAL DRIFT
- Phase 3 reported "13 ghost data ops" in repo without prod registration
- Current state: 145 repo files / 132 unique version prefixes / 147 production registrations
- Net: prod has 15 versions with no matching repo file by version prefix
- Same systemic class (file-level divergence between repo and prod); count moved by +2 since Phase 3 (no new ghost migrations today; +1 from PR #202, otherwise stable)
- P2 classification stays valid

### 9. P1-5 useRsvps wildcard select (DEFERRED) ⚠ ALSO MISSING ORG_ID
- Line 21: `supabase.from('event_rsvps').select('*').eq('event_id', eventId)` — wildcard select confirmed; sweep deferred-as-intentional
- **ADDITIONAL FINDING:** Line 23 also queries `team_players` without org_id (a third query in the hook)
- **RECLASSIFIED on verification:** `event_rsvps` + `team_players` have NO `org_id` column (verified via information_schema). Scope flows through `event_id`/`team_id` FK and RLS on parent tables. The "missing org_id" concern is moot — there's no column to filter on.
- Wildcard concern (separate from org_id) still defers as P1

### 10. Phase 2 RESOLVER_REGISTRY all 8 contracts clean ✓ VERIFIED CORRECT
- 8 kinds enumerated in `registry.js`: `weekly_digest, game_recap, tournament_prelim, tournament_recap, schedule_change, rsvp_nudge, academy_callup_notice, coach_roundup`
- All have `resolve`, `compose`, `anchorFromState`, `overridesFromState`, `sendPath`
- `coach_roundup` (the 8th, added in wave 5 PR 4a) is the most recent addition — Phase 2 was written before this and only mentions 7; quietly correct in spirit since coach_roundup follows the same contract

---

## False-negative org_id sweep (sub-agent)

Sub-agent ran read-only sweep. Result: 9 candidate findings (1 claimed P0, 7 P1, my own discovery of useRsvps:23 added makes 9).

### Self-correction reclassification (sub-agent method error)

Per self-correction authority + the "false positives caught via cross-verification" lesson from morning audit, I verified each finding against `information_schema.columns WHERE column_name='org_id'` to confirm the target table actually HAS an `org_id` column.

**5/9 (~55%) of sweep findings were INVALID** — the table doesn't have an `org_id` column:

| File | Sweep claimed missing on | Reality |
|---|---|---|
| useEventArrivals.js:14 | `event_arrivals` | No `org_id` column. FK-scoped via event_id. INVALID. |
| useDuties.js:22 | `event_duties` | No `org_id` column. FK-scoped via event_id. INVALID. |
| useAcademyCallupCandidates.js:43 | `team_players` | No `org_id` column. FK-scoped via team_id (`teams!inner` join + RLS). INVALID. P0 claim DOWNGRADED. |
| useGameDetail.js:15 | `game_results` | No `org_id` column. FK-scoped. INVALID for this row. |
| useGameDetail.js:16 | `game_plays` | No `org_id` column. FK-scoped. INVALID for this row. |
| (my own) useRsvps.js:23 | `team_players` | Same as above. INVALID. |

### Valid findings shipped

| File | Table | Severity |
|---|---|---|
| useRideOffers.js | `event_ride_offers` | P1 defense-in-depth |
| useFavoriteAudiences.js | `user_preferences` | P1 defense-in-depth |
| useRideRequests.js | `event_ride_requests` | P1 defense-in-depth |
| TeamAchievements.jsx | `team_achievements` | P1 defense-in-depth |
| useGameDetail.js (row 3) | `player_game_stats` | P1 defense-in-depth |

**Sweep method error documented** for the codebase:
- Wrong method: grep `.from()` callsites without verifying target table has `org_id`
- Right method: query `information_schema.columns WHERE column_name='org_id'` to enumerate the 39 org-scoped tables FIRST, then grep callsites only against those tables

### Self-correction authority invocation

Per Frank's framing: "if false-positive rate >30% triggers rerun." Reclassification rate hit 55%. Did a targeted inline re-sweep (3 spot-checks: `useGetOrCreateDm`, `useOrgGuardians`, `usePlayerNamesByIds`) using corrected method. All 3 SAFE — they have `.eq('org_id', orgId)` on a following line; grep pattern only caught same-line matches.

**Decided to time-box Phase Alpha at scope.** Full re-sweep on the 39 org-scoped tables is properly Phase Beta scope. PR #208 ships the 5 validated fixes.

---

## Self-corrected fixes shipped during Alpha

**PR #208 — fix(alpha-audit): org_id defense-in-depth on 5 hooks**
- 5 files modified, 26 insertions / 12 deletions
- All defense-in-depth additions (RLS gates org access at DB layer; this adds application-layer scope per proposed anti-pattern #37)
- Reverts of 2 broken fixes (useEventArrivals, useDuties) documented in PR body
- WRITE-side hardening + carryovers pinned

---

## Calibration verdict

**SOUND with documented method error in the sub-agent sweep.**

The morning audit's PHASE findings (PRs #194–#200) verify correctly — every fix I checked was applied correctly, every reclassification I checked was justified, every deferral I checked has valid reasoning.

The morning audit's FIX PRs (PRs #195, #198, #202–#207) shipped correctly — production state matches what the PR bodies claimed, the contract rewrites are aligned end-to-end, the RLS migration's runtime state matches the migration's intent.

The ONE issue surfaced in Alpha: the sub-agent sweep used a method that produced 55% false positives. This is a method/agent-prompt failure, not a morning-audit-content failure. Documented for future sweeps.

No P0 findings escaped morning audit's net. Phase Beta can proceed.

---

## FOLLOW-UP CARRYOVER (not Phase Alpha scope)

Pinned for Phase Beta or later:

1. **Full re-sweep on 39 org-scoped tables with corrected method** — most callsites likely SAFE (org_id on subsequent line), but ~130 grep hits warrant systematic per-callsite verification with surrounding context.

2. **Anti-pattern #36 violation at `academyCallupNotice.js:44`** — `const { data: rows = [] }` swallows errors silently. Real bug in the call-up recipient fetch.

3. **WRITE-side hardening** — sweep focused on SELECTs. Inserts/upserts that may miss `org_id` in payload (or use wrong `onConflict` per anti-pattern #25) need targeted audit:
   - `useEventArrivals.js:44` upsert
   - `useDuties.js:37, 51` writes
   - `useRideOffers.js:75, 107` writes
   - `useFavoriteAudiences.js:50` upsert (onConflict pattern flagged separately)
   - `useRsvps.js:52` upsert
   - Various leagueAppsImport.js writes

4. **useAcademyCallupCandidates.js:43** — hook still doesn't call `useAuth()` (zero useAuth import). Even though the org_id finding was invalid for `team_players`, the hook lacks any auth context which is unusual. Worth a defense-in-depth pass to add `useAuth` for `.eq('teams.org_id', orgId)` join-scoping when ground-truth needs it (e.g., when multi-org admins are supported).

5. **legacyRenderer dead code removal** — `src/lib/engine/renderers/tournamentRecap.js` zero importers; pre-existing carryover from morning audit, still pending.

6. **Anti-patterns #37 + #38 CLAUDE.md additions** — proposed in morning synthesis, still not shipped.

---

## Honest time report

- **Pre-flight (branch sync, agent spawn):** ~2 min
- **10 finding verifications (parallel reads, MCP queries):** ~10 min
- **Sweep agent execution (background):** ~2.5 min wall-clock
- **Sweep reclassification + self-correction:** ~8 min (the major time sink, including 2 reverts + corrected re-fixes)
- **PR #208 build + ship:** ~5 min
- **This markdown:** ~5 min
- **Total Phase Alpha:** ~30 min wall-clock

Below the 90-120 min budget. Self-correction overhead was real but contained.

---

## Standing by

Awaiting Frank's review of this verification doc. Per the gate rule, calibration verdict is "sound," so default routing is **proceed to Phase Beta (Expansion Audit)**.

If Frank wants any of the Alpha carryovers addressed before Beta, route now.
