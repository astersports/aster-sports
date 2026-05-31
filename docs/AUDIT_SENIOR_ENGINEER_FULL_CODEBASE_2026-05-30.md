# AUDIT — Senior-Engineer Full-Codebase Review (2026-05-30)

> Read-only architectural audit of the Ember platform (src/ + supabase/), run as a
> 3-pass parallel review (architecture/data-flow, duplicate-logic/maintainability,
> performance/scalability) plus direct first-hand inspection. Scope: 742 src files,
> 179 migrations, 13 edge functions. No code changed — every finding is a candidate
> gated PR per §15 + §16.15. Triggered by Frank's "audit like a senior engineer" prompt.
>
> Methodology note: the architecture agent hit a stream timeout and returned no usable
> report; that ground was covered first-hand instead (see §A, data-flow, multi-org P0).
> The duplicate-logic and performance agents completed in full.

---

## 0. Verdict

This is a **well-architected, disciplined codebase — not a refactor candidate.** The
hard anti-patterns are verified clean (AP #36/#37/#48/#51 = zero production violations;
the enforcement audit-tests work). Realtime channels have cleanup + row-scoped filters,
contexts are memoized, N+1 reads are already collapsed into `.in()`/`Promise.all`,
route-level code-splitting is thorough, SDK init is deferred to idle. Credit is due.

The real debt is narrow and clusters into **4 themes**: (1) single-org assumptions the
schema is now outgrowing, (2) zero list virtualization, (3) bundle budget breach, (4)
formatter duplication. The dominant root cause across most findings is **single-tenant
assumptions baked in when there was one org** — and the §4.5 schema build (programs →
divisions → registrations, in flight) is what surfaces them.

---

## 1. Punch-list (prioritized)

| # | Finding | Sev | Anchor file:line | Theme |
|---|---|---|---|---|
| **A** | **Multi-org context lag** — `AuthContext.jsx:68` hard-picks `roleRows[0]`; whole app reads singular `current_user_org_id()`. Schema is racing ahead of the app's ability to route multiple orgs. `AuthContext` carries an explicit `TODO(multi-org-routing)`. | **P0** | `src/context/AuthContext.jsx:68` | Architecture |
| **B** | **No list virtualization anywhere** (0 windowing libs). MessageThread renders up to 200 bubbles + scrollIntoView per change; FamilyBalanceList unbounded; PlayByPlayFeed re-sorts every realtime tick. | **P1** | `MessageThread.jsx:62`, `FamilyBalanceList.jsx:70`, `PlayByPlayFeed.jsx:18` | Perf @ scale |
| **C** | **Bundle 398KB gz > 350KB §16.10 budget.** PostHog = 61KB gz of it (lazy-loaded via `main.jsx:24`, so FCP is safe; the *total* shipped JS breaches the stated budget). | **P1** | `src/main.jsx:24`, `dist/assets/` | Perf |
| **D** | **`useSeasonFinancials` pulls ALL org transactions** (`select('*')`, no account/season scope) then filters in JS. 244 rows today; grows with org lifetime, re-pulled per season switch. | **P1** | `src/hooks/useSeasonFinancials.js:77-82` | Query @ scale |
| **E** | **Formatter duplication cluster** — ~40 files inline `toLocaleDate/Time` instead of `formatters.js`; tournament date-range triplicated (one copy at `broadcast/TournamentCard.jsx:11` uses a divergent `T00:00:00` anchor = **latent DST/midnight off-by-one bug**); currency formatted 4 ways (the already-registered AP #63 / HOME-6 divergence). | **P2** | ~45 callsites (see §3) | Duplication / AP #43 |
| **F** | **Inverted test pyramid** — 160 Vitest unit tests vs **1** Playwright e2e spec, on a payments + multi-tenant + RLS app. The integration/cross-role-leakage surface is the real risk and is nearly untested. | **P2** | `e2e/` | Test |
| **G** | Query-shape debt: `useRoster` pays a `family_balances` round-trip on game-day surfaces (ArrivalBoard) that only want jerseys; `useRecentActivity` prefetches whole `players` table to label ≤8 items; `NewDmPicker` 1+N name queries; `useSeasonRollover` non-atomic per-row inserts in nested loops. | **P2** | `useRoster.js:51`, `useRecentActivity.js:65`, `NewDmPicker.jsx:27`, `useSeasonRollover.js:41-63` | Query @ scale |
| **H** | **5 prod files over the repo's own 150-line P0 cap**: AuthContext (172), `briefings/kindMetadata.js` (169), `BriefingComposer.jsx` (164), `engine/resolvers/registry.js` (159), `familyGuideHelpers.js` (155). | **P2** | (listed) | Maintainability |
| **I** | UTC-vs-NY weekday anchor inconsistency in engine helpers (`coachRoundupHelpers.js:28`, `familyGuideHelpers.js:39`, `scheduleGaps.js:57`); `useWeather(41.03,-73.76)` hardcodes Westchester coords (breaks for any other org's geography). | **P3** | `SchedulePage.jsx:38` + engine helpers | Consistency @ scale |

---

## 2. Clean architecture breakdown (reverse-engineered)

```
main.jsx → ErrorBoundary > BrowserRouter > [SpeedInsights]
             > AuthProvider > PreferencesProvider > SeasonProvider > ToastProvider > App
App.jsx  → RRD v6 Routes; Protected = RequireAuth + AppShell; 14 eager + 19 lazy pages
Contexts → Auth (user/role/org/children/teamIds), Preferences, Season, Toast (7 files)
Data     → 139 hooks, each ≈ one Supabase query + own loading/error/cleanup (224 .from() calls)
Engine   → src/lib/engine/{resolvers(25), composer, registry} — briefing dispatch; pure resolvers + injected IO
Backend  → Supabase Postgres + RLS (179 migrations) + 13 edge functions (tokens, cron, push, webhooks)
```

**Representative write path (RSVP):** pill tap → optimistic state + `rsvpCache` → `event_rsvps`
upsert (RLS scoped via `event → team → org`) → realtime channel refreshes counts → notification
dispatch (pilot). One-way, layered, no layer violations (0 components query Supabase directly).

---

## 3. Finding E detail (the cheap high-ROI fix)

`src/lib/formatters.js` is the documented single source of truth (`formatTime`,
`formatDateFull`, `formatCurrency`, `formatRelativeTime`, `formatCountdown`,
`formatDayTime`) but is imported by only ~13 files while ~40 reimplement the same
`toLocale*` calls inline. All individually correct and NY-pinned, but it is the exact
soil AP #43 cross-surface divergence grows in.

**Date weekday/month/day inline (`{weekday:'short',month:'short',day:'numeric',timeZone:'America/New_York'}`):**
`event/EventDetailHero.jsx:33`, `roster/TeamDetailHero.jsx:16`, `home/ActionZone.jsx:35`,
`schedule/GamesView.jsx:82`, `scoring/ScoreEntrySheet.jsx:12`, `livescore/FinalizedGameView.jsx:27`,
`alerts/alertCardHelpers.js:66`, `tournament/tabs/GamesTab.jsx:65`, `admin/NextEventCard.jsx:28`.

**Time inline (`{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}` = `formatTime`):**
`event/EventDetailHero.jsx:34`, `gameday/ArrivalBoard.jsx:45`, `gameday/ParentArrivalActions.jsx:24`,
`home/LiveNowCard.jsx:19`, `briefings/SaveStatusPill.jsx:22`, `home/ParentHomeTeamCard.jsx:26`.

**Month-short+day:** `records/TeamGameLog.jsx:6`, `event/EventBriefingHistory.jsx:37`,
`tournament/TournamentBriefingHistory.jsx:35`, `briefings/inbox/HistoryView.jsx:28`,
`admin/NotificationHistory.jsx:90`, `tournament/tabs/MessagesTab.jsx:66`, `schedule/MatchupCard.jsx:108`.

**Full weekday+date+time (5 copies):** `event/ScheduleChangeComposer.jsx:21`,
`briefings/briefingComposerHelpers.js:71`, `briefings/bodies/ScheduleChangeBody.jsx:17`,
`pages/admin/BriefingHistoryDetail.jsx:69` and `:91`, `briefings/ScheduleForLaterPicker.jsx:57`.

**Tournament range ×3:** `tournament/TournamentHeader.jsx:11` (`T12:00:00`, +year),
`tournament/TournamentListItem.jsx:11` (`T12:00:00`, no year), `broadcast/TournamentCard.jsx:11`
(**`T00:00:00` — divergent anchor, latent DST bug**).

**Currency ×4:** `FinancialDashboardPage.jsx:52`, `FinancialImportPage.jsx:39` (cents, 2dp),
`alerts/alertCardHelpers.js:51` (style:currency), `home/RegistrationReminderCard.jsx:20`
(**whole dollars — the AP #63 parent/admin divergence**).

**Fix:** extend `formatters.js` with `formatDateShort`, `formatDateTimeLong`,
`formatTournamentRange(start,end,{withYear})` (standardize on the noon `T12:00:00` anchor),
optional `formatCurrencyWhole`; route the ~45 callsites through them; lock with the existing
`timezoneAuditPin.test.js` static-grep pattern. Closes the duplication, the DST bug, and the
AP #63/#43 divergence class in one PR.

---

## 4. Verified-clean (no action — the discipline machinery works)

- **AP #36** (error-swallowing destructured defaults): grep returns only the audit test. Zero prod.
- **AP #37** (org_id-first on org-scoped tables): all 88 chains lead with `.eq('org_id',...)`; FK-scoped tables correctly exempt.
- **AP #48** (`foreignTable` parent-sort): all 3 hits are fixed-bug-documenting comments; sorts done in JS.
- **AP #51** (dead-feature retirement): full zero-importer sweep — no orphan hooks/lib helpers.
- **Realtime:** all 7 `.channel()` sites have `removeChannel` cleanup, per-instance topic suffixes, row-level `filter:` scoping. No leaks, no over-broad subs.
- **Context perf:** Auth/Season/Preferences/Toast all `useMemo` value objects with correct deps.
- **N+1 collapses already shipped:** useDmThreads (1+3N→5), useChannelPreviews (1+N→2), useOrgTeamRecords, useEventRsvpCounts, useRecentActivity.
- **Code-splitting:** 19 lazy routes; Sentry/PostHog deferred to `requestIdleCallback`; Sentry tree-shaken to 174B gz via the §16.10.1 ErrorBoundary static import.
- **Pagination** exists where it matters (useTournaments, useInboxHistory `.range`; AnchorPicker `.limit`).

---

## 5. Cross-cutting insight + recommended sequence

**Root cause:** Findings A, D, E, G, I are all single-org / single-tenant assumptions from
the one-org era. The §4.5 schema chain is laying the multi-org foundation; **the app-layer
multi-org refactor (Finding A) is the actual critical path** — the DB will support N orgs
before AuthContext can route them.

**Sequence (each a gated PR on Frank's GO):**
1. Finish §4.5 schema chain — PR 6 (registrations) next. Don't interrupt.
2. Finding A — `current_user_org_ids()` (spec migration #12) + active-org selector in AuthContext. Natural follow-on to the schema work.
3. Finding E — formatters consolidation. Cheap, isolated, fixes a real latent DST bug + AP #63. (Scheduled next, ahead of #6, per Frank 2026-05-30.)
4. Before onboarding org #2: B, C, D, F.
5. Opportunistic: G, H, I.

---

## 6. Out of scope (explicit, per §16.15)

Not touched this pass: edge-function internals (dispatch loops are intentionally per-batch),
RLS policy correctness (covered by the Wave audit arc), the briefing engine's resolver
semantics, UI/UX/visual rhythm (AP #46 surface), and the migration sequence itself.
