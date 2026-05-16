# Phase 1 Wiring + Schema Drift Audit

**Date:** 2026-05-16 (Italy morning)
**Method:** 4 parallel Explore agents, one per table cluster
**Coverage:** 32 tables across event/scheduling, teams/roster/people, briefings/comms/tournaments, financial/auxiliary clusters
**Status:** Read-only inventory. Zero code changes. Fix PRs to follow per-finding routing.

---

## Methodology note (audit's own process bug)

The 4 sub-agents were given canonical column lists per table to verify against. **My canonical lists were incomplete** — built from memory + earlier audit context rather than from a fresh `information_schema` query. This produced ~7 false-positive "column doesn't exist" flags that I cross-verified and discarded before assembling this report.

**Confirmed false positives (NOT real drift):**
- `team_players.joined_at` and `team_players.left_at` — exist
- `events.is_bracket_game` — exists
- `events.is_championship_final` — exists
- `events.is_scrimmage` — exists
- `events.bracket_label` — exists
- `events.game_sequence` — exists
- `comms_messages.period_start` — exists

**Process correction for Phase 2+:** Query `information_schema.columns` first per phase, then build the canonical reference. Agent prompts cite that verified reference, not memory-based lists.

---

## Severity tags

- **P0** — ship today (org-leak, security, data integrity)
- **P1** — ship Sunday/Monday (visible drift, undefended trust, inconsistent scope)
- **P2** — batched cleanup next week (cosmetic, efficiency, ordering)

---

## P0 findings (3)

### P0-1: `EventLocationTab.jsx:31` — locations query missing org_id AND archived_at

```js
.from('locations').ilike('name', `%${searchName}%`).limit(1)
```

Same class as the AnchorPicker bug (fixed in PR #193). No org filter → cross-org location names addressable. No archived filter → resurrects archived rows.

**Canonical pattern (use this):** `.eq('org_id', orgId).is('archived_at', null)` before `.ilike()` and `.limit()`.

**Fix scope:** 1 file, ~3 lines.

---

### P0-2: `supabase/functions/send-tournament-message/index.ts:128` — guardians query missing org_id

```ts
.from('guardians').in('id', guardianIds)
```

Edge function trusts upstream `guardianIds` array. Per anti-pattern #36 lessons: defense-in-depth means the function should re-validate, not assume caller already filtered. If a malformed or crafted `guardianIds` slips through, this leaks cross-org guardian email + `is_pilot_family` flag.

**Canonical pattern:** `.eq('org_id', body.org_id).in('id', guardianIds)`.

**Fix scope:** 1 file, ~1 line. Edge function — needs MCP redeploy after merge.

---

### P0-3: `useGameDetail.js:15` — game_results query missing published_at filter

```js
.from('game_results').eq('event_id', eventId).maybeSingle()
```

Three sibling callsites filter `.not('published_at', 'is', null)` to exclude unpublished scores. This one doesn't. Draft scores visible to anyone fetching event detail (RLS may gate by role, but the application-layer filter is the canonical pattern — RLS shouldn't be the only line of defense).

**Canonical pattern:** `.not('published_at', 'is', null)` per the 3 peer callsites (useGameResultsMap, useGameResultsStats, GameResultCard).

**Fix scope:** 1 file, ~1 line.

---

## P1 findings (7)

### P1-1: `EventLocationTab.jsx:18` — tournaments query missing org_id

```js
.from('tournaments').eq('id', event.tournament_id)
```

Single-row by ID; practically safe but inconsistent with the canonical pattern (`useTournaments.js:40` properly scopes). Defense-in-depth gap.

### P1-2: `CreateActivityWizard.jsx:31` — events series-recurrence missing org_id

```js
.from('events').eq('parent_event_id', parentId).order('start_at', { ascending: true })
```

Relies on parent_event_id isolation. Practically safe under normal UI flow, but no application-layer org defense.

### P1-3: `notificationBadgeQueries.js:40` — events conditional org filter (role-dependent)

Staff badge count conditionally applies `.eq('teams.org_id', orgId)` based on role. Parent badge always applies it. Logic worth examining — if intentional, doc the reason; if accidental, normalize.

### P1-4: `FinancialDashboardPage.jsx:36` — financial_transactions missing season_id

```js
.from('financial_transactions').eq('org_id', orgId).order('occurred_at')
```

Sibling `.from('financial_accounts')` on the same page IS season-scoped. Transactions fetch is org-wide then filtered in-memory by account_id. Functional but over-fetches; misaligned scope between two queries on the same page.

### P1-5: `useRsvps.js:21` — event_rsvps wildcard select

```js
.from('event_rsvps').eq('event_id', eventId)  // SELECT *
```

vs `useEventRsvpCounts.js:32` which selects only `event_id,response`. Probably intentional (full vs aggregate) but worth confirming the wildcard scope is needed.

### P1-6: `useEventArrivals.js` (3 callsites) — event_arrivals wildcard select

All three use `select('*')`. Overly broad. No drift between them, just inefficient.

### P1-7: tournaments archived_at inconsistency across surfaces

Now-fixed AnchorPicker omitted archived_at. `StepDetails.jsx:14` filters by status but not archived_at. `EventLocationTab.jsx:18` (P1-1 above) omits both. `useTournaments.js:40` is the canonical pattern. Worth a unified sweep — but no remaining org-leak risk after AnchorPicker fix.

---

## P2 findings (3)

### P2-1: Status filter variance across events queries (mostly intentional)

- `notificationBadgeQueries.js`: `.eq('status', 'scheduled')` + future-time-only (badges for upcoming)
- `useDigestEvents.js`: `.neq('status', 'cancelled')` (digests include all non-cancelled)
- `useImportSchedule.js`: no status filter (import preview shows everything)

These differ because their intents differ. No drift, but worth a comment block on each citing the canonical intent.

### P2-2: Column select breadth variance

`locations` queries fetch 4-10 columns depending on use. `events` queries fetch 4-30 columns. No functional drift; standardization would be cosmetic.

### P2-3: roster_members §11.5 exception compliance (audit pass)

All 4 callsites that read `roster_members` directly are documented §11.5 exceptions:
- `useRoster.js:25` — sizes (jersey + shorts) which only live on roster_members
- `useAttendanceData.js:45` — historical attendance view (per the 5 attendance views exception)
- `useEventRsvpCounts.js:33` — date-windowed eligibility (canonical pattern)
- `SeasonRolloverPage.jsx:36` — historical roster wizard

§11.5 audit grep produces zero new violations.

---

## Cross-table systemic findings

### Pattern A: `org_id` filter inconsistency

8 callsites identified with org_id filter missing where the canonical pattern applies it:
- AnchorPicker.jsx (3 query branches) — FIXED in PR #193
- EventLocationTab.jsx (2 — locations + tournaments)
- send-tournament-message edge function (guardians)
- CreateActivityWizard.jsx (events via parent_event_id)
- notificationBadgeQueries.js (events, conditional)

**Root pattern:** queries written before multi-tenant awareness was canonical never got back-filled. The pattern is "if you're querying a tenant-scoped table, your filter chain MUST start with `.eq('org_id', orgId)`" — and this isn't enforced anywhere structurally (no lint rule, no helper, no PR template check).

### Pattern B: archived/published gating drift

3 different gating styles across tables:
- `archived_at IS NULL` — locations, tournaments (when implemented)
- `published_at IS NOT NULL` — game_results
- `status` enum check — events, comms_messages

Different gates for different semantics, but each gate has at least 1 callsite that omits it (P0-1, P0-3, P1-7 above).

### Pattern C: Defense-in-depth weakness in edge functions

`send-tournament-message` (P0-2) trusts caller-provided `guardianIds`. Multi-tenant edge functions should re-validate org scope on every external-input array. Worth a CLAUDE.md anti-pattern entry on edge-function input re-validation.

### Pattern D: Per-page query alignment

Where one page issues multiple queries against related tables, the scope filters should agree (P1-4 FinancialDashboardPage queries `financial_accounts` season-scoped but `financial_transactions` org-wide). Misalignment forces in-memory filtering and wastes round-trips.

---

## P0 fix-PR sequencing (proposed; awaiting Frank routing)

Three P0 findings → either 1 batched PR or 3 small PRs:

**Recommended: batched PR (single review surface, low risk, all 5-line fixes):**
- Title: `fix(audit-phase1): three org/status filter gaps from wiring audit`
- Files: `EventLocationTab.jsx` (P0-1) + `send-tournament-message/index.ts` (P0-2) + `useGameDetail.js` (P0-3)
- Total diff: ~10 lines
- Risk: low (pure additive filters, same pattern as AnchorPicker fix)
- Edge function needs MCP redeploy after merge

**Alternative: 3 separate PRs** if upstream review prefers narrower surfaces per concern.

---

## Phase 1 status: COMPLETE

- **Findings:** 3 P0, 7 P1, 3 P2
- **False positives discarded:** 7 (all schema-existence flags from my incomplete canonical lists)
- **Fix PRs:** deferred until Phase 5 + synthesis complete, per Frank's discipline
- **Process correction noted:** schema verification before agent prompts in Phase 2+

Standing by for Frank's routing to Phase 2 (Registry + State-machine sweep).
