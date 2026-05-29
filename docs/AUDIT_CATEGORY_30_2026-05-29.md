# Category #30 — Runtime / Live-Data / Visual Audit (2026-05-29)

**Trigger:** Frank's challenge that the 29-category code audit missed live bugs (payment
contradiction, RSVP dead card, "Finaliststh PLACE"). This pass runs the missing lens:
cross-check what each render surface *assumes* about its data against what the production
DB *actually contains*, plus cross-surface scope consistency + dead-affordance checks.

**Method:** 4 parallel agents (engine renderers, home+alerts, schedule/scoring,
teams/roster/financials). Every claim DB-verified via Supabase MCP (read-only, project
`vrwwpsbfbnveawqwbdmj`). PII suppressed (counts/types only). This is the empirical
validation of the Category #30 recommendation in `AUDIT_GAP_AND_FIX_SCOREBOARD_2026-05-29.md`.

**Outcome: 18 findings the code audit did not surface** — 1 critical, 3 P1, 4 P2, 10
latent/info. The dominant pattern is the same one behind the original 3 bugs. **Verdict:
Category #30 earns permanent status as a pre-build-gate lens.**

---

## Cross-cutting patterns (AP #58 synthesis)

- **PATTERN A — same concept, divergent source/scope across surfaces (DOMINANT, 7 instances).**
  The BUG-1 family at scale. ROSTER-1, ROSTER-2, HOME-2, HOME-4, ROSTER-3, SCORE-1, HOME-6.
  A metric/label/indicator is computed from different sources or scopes on different
  surfaces, so two truths coexist. **Promotion-ready anti-pattern candidate.**
- **PATTERN B — resolver↔renderer field-contract mismatch (2 instances).** The Finaliststh
  family. ENGINE-1 (hotel_block `text` vs `hotel_info`); placementBlock was the first.
- **PATTERN C — enum/value drift, code expects a value the DB never stores.** HOME-1
  (`'yes'` vs `'going'`); Finaliststh (int vs text) was the same class.
- **PATTERN D — structurally-static / always-empty render.** HOME-3 (reg pipeline always 0),
  HOME-5 (never-paid invisible), SCORE-5 (blank score slot), ENGINE-2 (null-null).
- **PATTERN E — unguarded null/format composition.** ENGINE-2, ENGINE-3, SCORE-5, HOME-6.

---

## CRITICAL

**HOME-1 · `src/lib/alerts/rsvpShortfallQueries.js:50`** — counts confirmed players as
`response === 'yes'`, but `event_rsvps.response` only stores `going`/`not_going`/`maybe`
(DB: 54/7/4, **zero `'yes'`**). `yes_count` is permanently 0 → the enabled game-day
"Roster shortfall today" CRITICAL alert fires a **false red panic ("0 confirmed")** even
when a team is fully RSVP'd. **Fix: `'yes'` → `'going'` (one line).** `useProgramHealthMetrics`
already uses `'going'` correctly; this query drifted.

## P1

**ROSTER-1 · `src/components/roster/PlayerRow.jsx:59-62` (src/hooks/useRoster.js:26,39)** —
payment-status dot reads the **legacy `roster_members.payment_status`** (DB: **63/63 = `paid`**,
plus a `|| 'paid'` default), not the §11.5 canonical `financial_accounts`/`family_balances`.
The dot is structurally green for everyone, including the 1 family that owes $1,275. **Fix:
source the dot from `family_balances.balance_cents`.**

**ROSTER-2 · `alertCardHelpers.js:93` + `FinancialDashboardPage.jsx:35` + `FamilyBalanceList.jsx`**
(confirms PR #577 obs #1) — the `payment_overdue` alert (org-wide, all-seasons) deep-links to
`/admin/financials`, which defaults to the **active season** (Spring 2026 = $0 owing). The
owing family is in **archived Fall 2025**, and FamilyBalanceList has **no "owing" filter** —
only name search. The family that triggered the alert is effectively unfindable. **Fix: pass
season/guardian through the deep-link + auto-select; add an "Owing only" filter.**

**ENGINE-1 · `src/lib/engine/renderers/hotelBlock.js:18-31` (resolvers/tournamentPrelim.js:124)**
— resolver emits `{ text }`, renderer reads `{ hotel_info, deadline, days_remaining }`.
Reachable **now** via an admin-typed hotel-block override: hotel text is silently dropped
and the renderer shows red **"HOTEL BLOCK CLOSES TODAY"** with a blank body (`days_remaining`
undefined → 0). **Fix: resolver emits the shape the renderer reads (or renderer reads `text`
and only shows the countdown when a real deadline is present).**

## P2

- **HOME-2 (high)** · PendingQueues "families owing" lane (active-season → 0) vs `payment_overdue`
  alert (all-seasons → 1) — contradictory counts on one screen. My "· all seasons" label fixed
  the %-vs-alert read, not the lane-vs-alert count. Fix: one scope/source, or relabel lane "this season."
- **HOME-3** · ProgramHealth "Registration pipeline · N new this week" — all 60 accounts share
  one import-day `created_at`; permanently "0 new this week." Same class as the prior Attendance→Active-teams swap. Fix: drop for import-driven orgs or base on a real registration event.
- **ENGINE-2 (latent)** · game-recap composes `${our_score}-${opponent_score}` unguarded; scores
  nullable, no CHECK vs `published_at` → a published score-less game renders "null-null." Fix: guard, or add DB CHECK.
- **ENGINE-3 (latent)** · tournament-prelim header interpolates raw ISO dates when no sub-context
  override; `formatDateRange` exists but isn't called. Fix: call it.
- **ROSTER-3 (latent)** · Academy badge: roster list reads `players.member_type`, profile reads
  team-scoped `team_players.roster_type` (canonical per AP #14). 0 divergence today; contradicts once a kid is rostered on one team and futures-called-up on another. Fix: PlayerRow reads `roster_type`.

## Latent / info (P3)

- **HOME-5** · overdue alert `.lt('last_payment_at', …)` excludes NULL → a **never-paid family is
  invisible** in the alert + total (worst-case debtor). Fix: include `last_payment_at IS NULL`.
- **HOME-4** · `useSeasonFinancials` nets only payment/refund; `family_balances` view also nets
  adjustment/fee → diverges once those tx types exist. Fix: align the netting.
- **HOME-6** · parent card rounds dollars; admin alert shows cents → "$128" vs "$127.50" for the same balance. Fix: one currency formatter.
- **SCORE-1** · RecordsPage hardcodes the literal "Spring 2026"; `useOrgTeamRecords` + totalGames
  are season-unscoped → at rollover the header lies and records merge seasons. Fix: thread `activeSeason`.
- **SCORE-2** · StandingsTable tiebreak `parseInt("9-4")` = 9 → tiebreaks by raw wins, ignoring losses. Fix: real tiebreak key.
- **SCORE-3** · win% denominator includes ties (0 ties today). Fix: pick a convention.
- **SCORE-4** · `usePublicTournaments` derives completion from `end_date`, ignoring `tournaments.status`
  → an in-progress league renders "Up Next." Fix: factor in `status`.
- **SCORE-5** · 3 past games have no `game_results` row → blank center column (half-rendered card). Fix: "—"/"Score pending" placeholder.
- **SCORE-6** · `home_away` treated binary; `neutral`/`tbd` render "vs" (home). Fix: distinguish.
- **DATA note** · `roster_members.shorts_size` is NULL for all 63 rows; no consumer renders it today, but any future display shows blank org-wide.

---

## Verified clean (high-signal: the audited surfaces that are correct)

placementBlock (Finaliststh fix holds vs live data), gameLog, eventCard, weeklySchedule,
scheduleChangeDiff, callup/signoff/stats renderers, all 11 alert affordances (no dead cards),
ProgramHealth payment %/RSVP rate scoping, JS parent-row sorts (AP #48), all `toLocale*`
NY-pinned (no timezone drift), live-scoring W/L derivation, AlertZone loading gate. The
engine + scoring surfaces are largely solid; the rot concentrates in **cross-surface
financial/scope consistency** (PATTERN A).

---

## Recommended fix-routing

**Batch 1 — ship now (small, high-confidence, no design call):**
HOME-1 (critical one-liner), ENGINE-1 (P1, field contract), HOME-5 (never-paid invisible),
SCORE-5 (blank score placeholder), ENGINE-3 (call formatDateRange), SCORE-2 (tiebreak),
ROSTER-3 (read canonical column). Each is a contained, tested fix.

**Batch 2 — needs a small design decision:**
ROSTER-1 + ROSTER-2 + HOME-2 (the financial source-of-truth + deep-link + "owing filter"
cluster — best done together: make every "owing" surface read `family_balances` at one
agreed scope, add the filter, fix the deep-link). HOME-3 (drop vs re-source the pipeline metric).

**Batch 3 — latent, fold into the relevant arc:** HOME-4, HOME-6, SCORE-1 (rollover —
do with the season-rollover work), SCORE-3, SCORE-4, SCORE-6, ENGINE-2 (+ DB CHECK),
shorts_size.

**Promote PATTERN A** to a registered anti-pattern (same-concept-divergent-source/scope;
7 instances, ≥3 threshold met).
