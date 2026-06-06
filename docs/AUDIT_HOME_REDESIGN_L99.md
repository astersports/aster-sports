# AUDIT — HOME PAGES L99 REDESIGN

> Canonical artifact for the three role-home redesign (Parent / Coach / Admin + view-as).
> Produced per **CLAUDE.md §16.15** (all five elements) before any PR-A code lands.
> Seeded by `docs/HOME_REDESIGN_KICKOFF.md` (2026-06-05). Read CLAUDE.md first, then the kickoff, then this.
> Status: **AUDIT COMPLETE — scope-lock pending operator review.** No PR-A code until scope locks.
> Methodology: line-by-line per category (§17.3), 2-pass deep-read addendum (§16.15b), cross-batch
> pattern check (AP#58). Date: 2026-06-05. Branch: `claude/home-redesign-kickoff-vE7Hf`.

---

## 0. SCOPE + PRE-FLIGHT

**Pre-flight (§9.1):** branch `claude/home-redesign-kickoff-vE7Hf`, zero divergence from `origin/main`,
no worktree leakage, no stashes. Prior phase (briefing redesign) shipped no home-schema migrations →
`get_advisors` open-check skipped per §9.1 item 2. Ledger §4 reflects briefing-phase close.

**Surfaces in scope:** `src/pages/{Parent,Coach,Admin}HomePage.jsx` + their full mount trees
(`src/components/{parent-home,coach-home,admin-home,home,alerts,schedule}/...`), the routing layer
(`useHomeRole` + `HomePage.jsx`), the alert layer (`useAlertEvaluator` + `AlertZone`), the signal
hooks (`use{Parent,Coach,Admin}HomeSignals` + the per-event count hooks), and the view-as path
(`RoleSwitcherSheet` + Header banner).

**Read coverage:** 3 page roots + 6 zone components + 18 admin-leaf components + 16 parent/coach-leaf
components + 15 signal/data hooks + alert layer + routing layer + view-as layer + existing test
suite + perf/ledger docs. File-by-file (§16.15a) with a second deep-read pass (§16.15b).

---

## 1. CROSS-BATCH SYNTHESIS (AP#58) — DOMINANT PATTERNS

Six recurring patterns surfaced across the four audit batches. Ranked by leverage. **Pattern α is the
dominant one** and matches CLAUDE.md AP#63's prediction ("the dominant platform bug pattern").

### PATTERN α — AP#63 same-concept / divergent-source-or-scope (9 instances)
The same real-world concept is computed from different sources or scopes across the three homes.
The good news first: **records, rides-today, and alerts already flow through single shared hooks**
(`useOrgTeamRecords`, `useRidesTodaySummary`, `useAlertEvaluator` + scope filters) — exemplary, no
action. The divergences:

| # | Concept | Parent | Coach | Admin | Sev |
|---|---------|--------|-------|-------|-----|
| α1 | **"next event"** | `useParentHomeSignals.nextEventId` off `filteredNext7` | `thisWeek[0]` (sorted week slice) — `CoachHomePage.jsx:51` | `activities.find(a=>new Date(a.start_at)>=new Date() && status!=='cancelled')` — `AdminHomePage.jsx:49` | **P1** |
| α2 | **"next 7 days" window** | `start >= now && start < now+7d` (strict `<`) — `useParentHomeSignals.js:~49` | `t >= now && t <= weekEnd` — `CoachHomePage.jsx:42` | `t >= now && t <= weekEnd` — `AdminScheduleSection.jsx:36` | P3 |
| α3 | **weather location** | `useWeather(41.03,-73.76)` — `ParentHomePage.jsx:50` | same — `CoachHomePage.jsx:35` | same — `AdminHomePage.jsx:45` + `AdminScheduleSection.jsx:16` | **P1** (AP#7) |
| α4 | **season progress** | n/a | n/a | `seasonProgress()` impl A `ActiveSeasonCard.jsx:8` (round, `Date.now()`) vs impl B `ProgramHealthCard.jsx:19` (ceil, injected `nowMs`) | **P2** |
| α5 | **past-event scores** | real `gameResults` | real `gameResults` | `gameResults={{}}` hardcoded empty — `AdminHomePage.jsx:125` | **P2** |
| α6 | **relative time label** | `RecognitionCard.jsx:13` UPPERCASE | `CoachMessageBlock.jsx:14` lowercase | — | **P2** (AP#7) |
| α7 | **duty/volunteer line** | passes `dutyCounts` — `ParentHomeSignalZone.jsx:81` | omits `dutyCounts` — `CoachHomeSignalZone.jsx:59` | — | **P1** |
| α8 | **next-event location** | `location_name` (fallback-resolved) via DateGroupedList | same | `NextEventCard.jsx:52` reads raw `event.location` (no `locations.name` fallback) → blank on tournament events | **P2** |
| α9 | **"going" denominator** | `going/teamSize` coverage bar | same | same | P3 note — diverges from Stream-B nudge's `going<5` absolute floor (cross-system) |

**Verified (AP#60 fact-grounding):** α8 was initially flagged as a possible `[object Object]` crash;
confirmed against `useActivities.js:50` (`location_name: e.location || e.locations?.name`) — `event.location`
is the raw text column (string|null), so no crash, but `NextEventCard` skips the tournament fallback
that every other surface uses.

### PATTERN β — AP#36 dropped/swallowed errors (4 instances)
The **data-hook layer is clean** (zero AP#36 violations across all 15 hooks — the AP#36 sweep already
landed there). The violations live in **self-fetching card components** that bypassed that sweep:

- `AutoNotificationSettingsSheet.jsx:20-29` — `.then(({ data }) => ...)` drops `error` → a failed load
  silently renders defaults as if they were saved settings. **P2**.
- `GettingStarted.jsx:20-30` — two `catch {}` empty-body swallows → an RLS/transient error silently
  shows the "getting started" checklist to a fully-set-up org. **P2**.
- `useEventRsvpCounts.js:50-52` — partial-failure swallow: only early-returns when **both** queries
  fail; a roster-only error proceeds with empty sizes → `noResponse` collapses to 0, `total`
  undercounts on every event. **P2**.
- `useGameResultsMap.js:21` + `usePrefetchChildRsvps.js:13` — `throw` inside `.then(async …)` with no
  `.catch` → unhandled promise rejection, silent empty map. **P2 / P3**.

### PATTERN γ — a11y (§16.4) systemic gaps
- **Soft-token-on-soft-bg contrast** (strongest systemic finding): `--as-success` on `--as-success-soft`
  and `--as-warning` on `--as-warning-soft` for eyebrow/status text measure ~3.6–3.9:1, under the
  4.5:1 AA floor. Sites: `LiveNowCard.jsx:75`, `AllClearPill.jsx:25-31`, `ConflictCallout.jsx:27`,
  `TournamentWeekendBanner.jsx:62` (accent-on-accent-soft). **P2.** Fix path = a darker on-soft text
  token per the §0 accessibility-corollary precedent (`--as-text-meta` model) — **see Decision D1**.
- **Progress bars missing semantics**: `aria-label` on a plain `<div>`/`<svg>` with no
  `role="progressbar"` + `aria-valuenow` — `ProgramHealthCard.jsx:88`, `RidesTodayCard.jsx:17`,
  `ActiveSeasonCard.jsx:67`. **P2.**
- Vibration not gated on `prefers-reduced-motion` — `QuickActions.jsx:90`, `AdminManageLinks.jsx:52`. P3.
- `DateGroupedList.jsx:8` date-group headers are styled `<div>`s, not headings (no SR heading nav). P3.
- `ParentHomeTeamCard.jsx:13` / `TeamPerformanceStrip.jsx:8` buttons have no composed `aria-label`. P3.

### PATTERN δ — design-system (§7) drift
- `AlertCard.jsx:29` — hardcoded `rgba(0,0,0,0.06)` border (only hardcoded-color violation in the set).
  **P1** (AP#2/AP#8); should be `var(--as-border-subtle)`.
- Raw emoji as iconography (§7 = Lucide only): `TournamentWeekendBanner.jsx:61` 🏆,
  `RecognitionCard.jsx:69` 🏆, `ParentHomeSignalZone.jsx:57` 🏀. P2/P3.
- Raw glyph chevrons `›` instead of Lucide `ChevronRight`: `ActionZone.jsx:134`,
  `PendingQueuesLanes.jsx:103`. P3.
- Off-scale `fontSize: 16` (scale is 24/20/17/15/13/11): `LiveNowCard.jsx:79`,
  `TournamentWeekendBanner.jsx:66`, `RecognitionCard.jsx:76`. P3.
- `NotificationHistory.jsx:98` badge radius 4 (spec 6). `ParentHomeTeamCard.jsx:20` stripe 3px (others
  4px). `SectionShell.jsx:53` Tailwind `animate-pulse` not `as-pulse`. `CoachHomeQuickActions.jsx:54`
  `vibrate(10)` not `(50)`, radius `999` not `9999`. All P3.

### PATTERN ε — perf (§16.10) — the LCP anchor
§17.1 budget is **LCP < 1.5s p75 on Parent Home**; §17.8 records the anchor regression: **home LCP
~5s, 3.3× over budget** (diagnosed PR #569). Contributors found:
- **6 self-fetching cards defeat the page loading gate** (`ProgramHealthCard`, `RidesTodayCard`,
  `RecentActivityFeed`, `NotificationHistory`, `GettingStarted`, `AdminScheduleSection`) — each fetches
  independently of `AdminHomePage`'s `isLoading`, populating in a cascade waterfall after the gate
  releases. **Primary LCP/CLS contributor.**
- Duplicate weather fetch: `AdminHomePage.jsx:45` + `AdminScheduleSection.jsx:16` issue two identical
  Open-Meteo requests.
- `DateGroupedList.jsx:6` — `groupByDate` + `getWeatherForTime` recompute every render (re-fires on each
  `useNow` tick); non-virtualized when it backs the full Schedule page (>30 events, §16.10).
- `CoachRosterSnapshot.jsx:18` — N attendance queries for N teams (documented v2, acceptable at scale).
- `useActivities.js` single-slot module cache — shared across pages (good), but last-writer-wins can
  serve a stale scope briefly under view-as role/season interleave.

### PATTERN ζ — structure / decomposition
- **`AdminHomePage.jsx` is a flat ~12-section scroll** (`:83-144`), no hero, no collapsibles —
  violates §16.14. At 146/150 LOC, the §6 zone-decomposition trigger is primed. **This redesign is the
  trigger.** THE redesign driver.
- **`DensityToggle.jsx` 3-state/2-state dead code**: `useDensity.VALID` is `['minimal','maximum']` only,
  but `DensityToggle.jsx:17-21,48-49` still references a `medium` state (`LABELS.medium` resolves
  `undefined` → empty label on unexpected input) and the header comment (`:2-3`) + `useDensity.js:4-11`
  docstring still claim "minimal → medium → maximum." Contradicts §16.2's "default MED / MIN/MED/MAX."
  **P2 dead-code + doc-drift.** **See Decision D2** (is density 2-state final, or restore MED?).

### PATTERN η — test debt (AP#43 gaps)
Strong existing guardrails: `homePageLoadingGateAudit`, `homePageInvariantAudit`, `timezoneAuditPin`
(static/structural, 3-surface), plus `useAlertEvaluator.loadingGate` + `AlertZone` + the existing
`myTeamsCrossSurfaceInvariant` (parent+coach) and `playerGoingLabelInvariant`. Gaps are concentrated in
**rendered cross-surface values** — exactly the α-pattern surface:
1. Next-event hero parity across all 3 roles (currently single-component `NextEventCard.test.jsx`).
2. "Families owing / payment_overdue" single source+scope render (only the *math* is tested via
   `useSeasonFinancials.computation.test.js`).
3. MY TEAMS records — extend the existing invariant to include Admin `TeamPerformanceStrip`.
4. Weather render/format + shared coords.
5. Density variant render (§16.2 untested at home layer).
6. RSVP-going count — extend to admin surfaces.
7. **Zero home-router E2E** — no `e2e/` test renders each role's home through `useHomeRole` + view-as.

---

## 2. FINDINGS LEDGER (severity-ranked, §16.15a + b)

No **P0** found. No file over the 150-LOC cap (closest: `ActionZone` 147, `AdminHomePage` 146). No
`bg-black/50`, no `max-height` collapse, no invented `--as-*` tokens, no changed token values, no
"CYO"/"Boys 10U" string violations.

### P1 (fix this redesign)
| ID | file:line | Finding | AP / rule |
|----|-----------|---------|-----------|
| P1-1 | `AdminHomePage.jsx:83-144` | Flat 12-section scroll, no hero/collapsible; §6 decomposition primed (146 LOC) | §16.14 / §6 / AP#11 |
| P1-2 | `ParentHomePage:50`,`CoachHomePage:35`,`AdminHomePage:45`,`AdminScheduleSection:16` + `useWeather.js:67` | Weather coords `41.03,-73.76` hardcoded ×7; `America/New_York` TZ hardcoded — every org gets Westchester | AP#7, §4 |
| P1-3 | `AdminHomePage:49` / `CoachHomePage:51` / `useParentHomeSignals.js:35` | "next event" computed 3 different ways | AP#63 |
| P1-4 | `DateGroupedList.jsx:5` (parent vs coach call) | `dutyCounts` passed on parent, omitted on coach → volunteer line on parent home only for same event | AP#43, AP#63 |
| P1-5 | `AlertCard.jsx:29` | Hardcoded `rgba(0,0,0,0.06)` border | AP#2 / AP#8 |

### P2 (fix this redesign)
| ID | file:line | Finding | AP / rule |
|----|-----------|---------|-----------|
| P2-1 | `AdminHomePage.jsx:125` | `gameResults={{}}` → admin past events render scoreless | AP#63 |
| P2-2 | `ActiveSeasonCard.jsx:8` vs `ProgramHealthCard.jsx:19` | Two `seasonProgress()` impls, different math | AP#63 / AP#7 |
| P2-3 | `NextEventCard.jsx:52` | Reads raw `event.location` not `location_name` fallback → blank location on tournament events | AP#63 |
| P2-4 | `useEventRsvpCounts.js:50-52` | Partial-failure swallow → wrong noResponse/total | AP#36 |
| P2-5 | `AutoNotificationSettingsSheet.jsx:20` | `.then(({data}))` drops error → silent defaults | AP#36 |
| P2-6 | `GettingStarted.jsx:20-30` | Empty `catch {}` ×2 → silent checklist state | AP#36 |
| P2-7 | `useGameResultsMap.js:21`,`usePrefetchChildRsvps.js:13` | `throw` in `.then(async)` no `.catch` → unhandled rejection | AP#36-adjacent |
| P2-8 | `RecognitionCard.jsx:13` vs `CoachMessageBlock.jsx:14` | `relativeTime` duplicated, casing diverges | AP#7 / AP#63 |
| P2-9 | `LiveNowCard:75`,`AllClearPill:25`,`ConflictCallout:27`,`TournamentWeekendBanner:62` | Soft-on-soft text contrast 3.6–3.9:1 < 4.5:1 | §16.4 |
| P2-10 | `ProgramHealthCard:88`,`RidesTodayCard:17`,`ActiveSeasonCard:67` | Progress bars missing `role="progressbar"`/`aria-valuenow` | §16.4 |
| P2-11 | `DensityToggle.jsx:17-21,48-49` | Dead `medium` 3-state refs + stale comment + `LABELS.medium` undefined | doc-drift / §16.2 |
| P2-12 | admin home (6 cards) | Self-fetching cards defeat page loading gate → LCP cascade | §16.10 / §17.1 |
| P2-13 | `RecognitionCard.jsx:45` | `badge_color` read as raw CSS color (2nd color source beyond sanctioned `team_color`) — verify validated-hex column | AP#8 |

### P3 (batch into the a11y/design-system sweep)
Raw emoji→Lucide (`TournamentWeekendBanner:61`, `RecognitionCard:69`, `ParentHomeSignalZone:57`); raw
glyph chevrons (`ActionZone:134`, `PendingQueuesLanes:103`); off-scale `fontSize:16` (×3); badge radius
4→6 (`NotificationHistory:98`); stripe 3→4px (`ParentHomeTeamCard:20`); `animate-pulse`→`as-pulse`
(`SectionShell:53`); `vibrate(10)`→`(50)` + radius `999`→`9999` (`CoachHomeQuickActions:54,25`);
vibration reduced-motion gate (`QuickActions:90`,`AdminManageLinks:52`); date-group headings
(`DateGroupedList:8`); window boundary `<` vs `<=` (α2); `useWeather.js:57` `!lat||!lon` treats `0` as
missing; `useActivities` view-as cache staleness; `GettingStarted:38` "Add players"→`/teams` vs
QuickActions→`/admin/members`; `ChildFilterChips` renders a `FilterSelect` (naming drift); Header
"Viewing as parent" omits guardian name (`Header.jsx:63`); `RidesTodayCard:79` unguarded team-color
contrast on white.

### Closed/verified-clean (no action)
Records, rides, alerts use single shared hooks with correct scope (exemplary). `useOrgTeamRecords`
handles AP#48 correctly (JS-side sort). `NotificationHistory` is the reference AP#36/#37 implementation.
`RegistrationReminderCard` currency unified on `formatCurrency` (HOME-6 closed). `AllClearPill` vs
ActionZone "1 thing to handle" disambiguation intact. Tokens clean (47 `--as-*`, none invented).
Animations gated behind `prefers-reduced-motion`. Stale: `CutoverGateChip` ledger entry (§4 PR 7b-3
"above AlertZone") — not mounted; out-of-scope (briefing pilot). `HOME_DESIGN_SPEC.md` archived
(historical reference only).

---

## 3. ANTI-PATTERN CATALOG CROSS-REFERENCE (§16.15c)

| AP # | Title | Hits in home tree | Status |
|------|-------|-------------------|--------|
| AP#2 | bg-black/50 → rgba | `AlertCard:29` hardcoded border alpha | **open (P1-5)** |
| AP#7 | constants duplicated → lib | weather coords ×7 (P1-2); `relativeTime` ×2 (P2-8); `seasonProgress` ×2 (P2-2) | **open** |
| AP#8 | hardcode hex → tokens | `AlertCard:29` (P1-5); `RecognitionCard:45` badge_color (P2-13) | **open** |
| AP#36 | destructured-default error swallow | data hooks CLEAN; 4 self-fetching components open (P2-4/5/6/7) | **open** |
| AP#37 | org_id-first on org tables | verified clean (FK-scoped tables correctly exempt; `players`/`event_notifications` correctly scoped) | clean |
| AP#43 | cross-surface invariant test | next-event, owing, MY-TEAMS-admin, weather, density, dutyCounts — all missing | **open (η)** |
| AP#44 | trace state pipeline / loading gate | `useAlertEvaluator` null-sentinel intact + tested | clean |
| AP#46 | *Card visual rhythm | stripe 3 vs 4px, off-scale fonts, emoji rhythm | **open (P3)** |
| AP#48 | foreignTable parent-sort | `useOrgTeamRecords` handles correctly | clean |
| AP#63 | same-concept divergence | the dominant pattern (α1–α9) | **open** |
| AP#15 | FullScreenForm for 3+ fields | `AutoNotificationSettingsSheet` correctly uses FullScreenForm | clean |
| AP#3/#18 | ref-based collapse | `GettingStarted`/`PastEventsSection` use `as-collapsible` (CSS) ✓ | clean |
| AP#42 | parallel systems | `useActivities`/`useOrgTeamRecords`/`useRidesTodaySummary` correctly reused; `useActiveRole` not reintroduced | clean |

New patterns (no existing AP): self-fetching-cards-defeat-loading-gate (ε); soft-on-soft contrast (γ);
density 3-state/2-state dead code (ζ). Candidate for an AP entry: **"self-fetching presentational cards
must surface into the page loading gate or document the cascade"** — recommend registering if the perf
fix confirms it as the LCP driver.

---

## 4. PER-ROLE WIREFRAMES (§16.15d) — REDESIGN TARGET

Target structure applies §16.14 (single hero card + collapsible sections, closed-by-default with summary
headers) and §6 zone decomposition. `[▸]` = collapsed w/ summary header; `[▾]` = open by default.

### 4.1 PARENT HOME
```
┌─────────────────────────────────────────────┐
│ HERO  Good evening, {Name}                    │  ParentHomeHeader (greeting + org · N teams)
│       {OrgName} · 2 teams                     │
│  ┌─────────────────────────────────────────┐ │
│  │ NEXT EVENT · 10U Blue        ☀ 54°  2h12m│ │  shared NextEventCard (one nextEvent() source)
│  │ vs 6th Boro · Sat 9:00 AM · WCC          │ │  ← α1/α8 consolidation; location_name fallback
│  │ [RSVP ✓ Going]   [Get directions]        │ │  per-role action stack (§16.14 contract 3)
│  └─────────────────────────────────────────┘ │
├─ ALERTS (collapsible pill when clear) ────────┤  ParentHomeAlertZone: AlertZone(collapsible) +
│  ▸ All clear   /   ▾ 2 alerts                 │  ConflictCallout + ActionZone(parent-action-zone)
├─ ACTION ITEMS · 1 to handle ──────────────────┤
├─[▾] REGISTRATION · Spring 2026 · paid ✓ ──────┤  RegistrationReminderCard (formatCurrency, HOME-6 ok)
├─[▾] UP NEXT PREP · parking + arrival ─────────┤  UpcomingPrepCard
├─[▸] LIVE NOW (only when a game is live) ──────┤  LiveNowCard
├─[▸] TOURNAMENT THIS WEEKEND ──────────────────┤  TournamentWeekendBanner
├─[▸] RECOGNITION · 1 new ──────────────────────┤  RecognitionCard
├─[▸] FROM YOUR COACH · 2 messages ─────────────┤  CoachMessageBlock (shared relativeTime, P2-8)
├─[▾] MY TEAMS · records ───────────────────────┤  MyTeamsStrip → ParentHomeTeamCard (records ok)
├─[▾] NEXT 7 DAYS  [kid filter] [density] ──────┤  ChildFilterChips + DateGroupedList(dutyCounts) +
│        Sat · vs 6th Boro · 11/13 going · 2 vol│  PastEventsSection(real gameResults)
└─[▸] PAST EVENTS ──────────────────────────────┘
```

### 4.2 COACH HOME
```
┌─────────────────────────────────────────────┐
│ HERO  Good evening, Coach {Name}              │  CoachHomeHeader (→ AdminGreeting today)
│  ┌── pulse-glow accent border ──────────────┐ │
│  │ NEXT EVENT · 10U Black       ☀ 54°  2h12m│ │  shared NextEventCard (same source as parent)
│  │ vs Gauchos · Sat 11:00 · WCC             │ │
│  │ [Open check-in]  [Message team]          │ │  coach action stack
│  └──────────────────────────────────────────┘ │
├─ ALERTS  ▸ All clear / ▾ N ───────────────────┤  CoachHomeAlertZone: AlertZone(collapsible) +
├─ ACTION QUEUE · N to handle ──────────────────┤  ActionZone(coach-action-zone)
├─[▾] RIDES TODAY · 4/6 covered ────────────────┤  RidesTodayCard (shared hook, role-scoped)
├─[▾] THIS WEEK PREP ───────────────────────────┤  UpcomingPrepCard
├─[▾] QUICK ACTIONS ────────────────────────────┤  CoachHomeQuickActions (2×2 at 375px, P3)
├─[▸] TEAM MESSAGES · 2 ────────────────────────┤  CoachMessageBlock (shared casing w/ parent)
├─[▾] NEXT 7 DAYS  [density] ───────────────────┤  DateGroupedList(dutyCounts ← α7 fix) +
├─[▸] PAST EVENTS ──────────────────────────────┤  PastEventsSection
├─[▸] ROSTER SNAPSHOT ──────────────────────────┤  CoachRosterSnapshot (attendance per own team)
└─[▾] MY TEAMS · records ───────────────────────┘  ParentHomeTeamCard (no nextEvent prop — AP#43)
```

### 4.3 ADMIN HOME  (decompose → `src/components/admin-home/`)
`AdminHomePage.jsx` becomes a ~50-line wrapper; zones extracted to
`admin-home/AdminHome{Header,AlertZone,SignalZone}.jsx` mirroring parent/coach.
```
┌─────────────────────────────────────────────┐
│ HERO  AdminGreeting (NY-pinned ✓)             │  AdminHomeHeader
│  ┌─────────────────────────────────────────┐ │
│  │ NEXT EVENT (shared card, real location)  │ │  NextEventCard (same source as parent/coach)
│  └──────────────────────────────────────────┘ │
│  KPI ROW: collection% · net-to-bank · owing  │  ← one season-scoped + one all-seasons, LABELED
├─ ALERTS (always_visible) ─────────────────────┤  AdminHomeAlertZone: AlertZone(always_visible) +
├─ ATTENTION REQUIRED · N ──────────────────────┤  ActionZone(admin-action-zone)
├─ PENDING QUEUES (lanes) ──────────────────────┤  PendingQueuesLanes
├─[▾] PROGRAM HEALTH · Week 7 of 12 · 86% paid ─┤  ProgramHealthCard (shared seasonProgress ← P2-2)
├─[▾] RIDES TODAY ──────────────────────────────┤  RidesTodayCard (shared hook)
├─[▸] RECENT ACTIVITY · last 24h ───────────────┤  RecentActivityFeed
├─[▾] TEAMS · records ──────────────────────────┤  TeamPerformanceStrip (extend MY-TEAMS invariant)
├─[▸] SEASON · Spring 2026 ─────────────────────┤  ActiveSeasonCard (shared seasonProgress)
├─[▾] NEXT 7 DAYS  [density] ───────────────────┤  AdminScheduleSection + PastEventsSection
│                                               │      ← P2-1: pass REAL gameResults
├─[▸] RECENT NOTIFICATIONS  [⚙ settings] ───────┤  NotificationHistory + AutoNotificationSettingsSheet
└─[▸] GETTING STARTED (only when incomplete) ───┘  GettingStarted (error-surface ← P2-6)
```

### 4.4 VIEW-AS VARIANTS (admin-only QA preview)
- **Mechanism (verified):** `useHomeRole.activeRole` drives `HomePage.jsx`; admin sets it via
  `RoleSwitcherSheet` (Header, BottomSheet). 24h auto-expiry. `Header.jsx:28-74` renders a 6px
  `--as-warning` stripe + "Viewing as {role}" + warning-colored chrome while `isViewingAs`.
- **View-as Coach** → renders Coach Home exactly as a real coach, PLUS the Header warning stripe.
  Coach empty-states show the "Coach view sample" copy (`CoachHomeSignalZone.jsx:76`) so an unassigned
  admin understands the empty MY TEAMS. No separate wireframe — it IS 4.2 + the stripe.
- **View-as Parent** → renders Parent Home scoped to the selected `view_as_guardian_id`'s children.
  **Gap (P3):** Header shows only "Viewing as parent" — not *which* guardian. Redesign fix: thread the
  guardian display name into the banner (`Viewing as {guardianName}`).
- **Wireframe invariant:** the view-as home must be byte-identical to the real role's home except the
  Header banner — anything else (e.g. an admin-only section leaking into parent view) is a bug. Lock
  with the home-router E2E (η7).

---

## 5. OUT OF SCOPE (§16.15e)
Explicitly NOT touched by this redesign (deferred surface area made visible):
1. **Briefing system internals** — just shipped, pilot-gated. Touch only where a home zone reads
   briefing/Radar data (ActionZone/alerts). No briefing composer/resolver/renderer changes.
2. **Non-home surfaces** — Schedule, Records, Teams detail, Event detail — except the shared leaf
   components they co-own with home (`DateGroupedList`, `PastEventsSection`, `NextEventCard`,
   `MatchupCard`). Fixing those leaves benefits both; the non-home *pages* are not restructured here.
3. **Full multi-tenant weather** (org-level coordinates + per-event location-driven weather + dynamic
   TZ) — the **constant dedup IS in scope** (P1-2: hoist `41.03,-73.76` to `lib/constants.js`); the
   full org-coordinate/event-coordinate build is a separate multi-tenant item (§17.2).
4. **Schedule-page virtualization** — `DateGroupedList` backs both home (small slice, fine) and the
   full Schedule page (>30, §16.10 violation). Memoizing the grouping is in scope; the Schedule-page
   virtualization lands with a Schedule redesign, not here.
5. **Per-player game stats** — §16.12 forbids in 2026. Engagement stats (attendance/streaks) only.
6. **New design tokens** beyond the single accessibility-corollary token in Decision D1 (which needs
   sign-off). No other token additions/renames/value changes (§0).
7. **CutoverGateChip / briefing-feedback surfacing** — stale ledger entry; not reinstated.

---

## 6. PROPOSED PR SEQUENCE (implements locked decisions — code-exact prompts per PR, §0 rule #8)
The audit doc is canonical; each PR ships with manual-verify steps (§12.10), Elite-Stack gate (§16.13),
and the relevant AP#43 invariant test (§16.15 / AP#43). Ordered to land structure → correctness →
visual → polish, so each PR is reviewable in isolation.

- **PR-A (structural, no behavior change):** decompose `AdminHomePage.jsx` → `src/components/admin-home/`
  (AlertZone/SignalZone/Header + ~50-line wrapper), mirroring parent/coach. Locks the `homePageInvariantAudit`
  3-surface symmetry. No visual change.
- **PR-B (AP#63 consolidation + AP#43 tests):** shared `nextEvent(activities, now)` helper (α1, all 3
  homes) → `lib/`; shared `seasonProgress(season, nowMs)` helper (α4); weather coords → `lib/constants.js`
  (α3 / P1-2); `NextEventCard` → `location_name` (α8); admin `PastEventsSection` real `gameResults` (α5 /
  P2-1); shared `relativeTime` formatter (α6 / P2-8); thread `dutyCounts` to coach `DateGroupedList` (α7 /
  P1-4). Each with a cross-surface invariant test.
- **PR-C (§16.14 hero+collapsible restructure):** the visual redesign per the §4 wireframes, per role.
- **PR-D (a11y sweep):** Decision-D1 token (if approved) + soft-on-soft sweep (γ); `role="progressbar"`
  ×3; emoji→Lucide; off-scale fonts; vibration reduced-motion gate; date-group headings; view-as banner
  guardian name. VoiceOver pass before merge (§16.4).
- **PR-E (error-handling sweep):** AP#36 self-fetching cards (P2-4/5/6/7); `AlertCard` border token (P1-5).
- **PR-F (perf, the LCP-5s anchor):** lift self-fetching admin cards into the page gate / consolidate
  weather fetch; memoize `DateGroupedList` grouping; density 2-state cleanup (Decision D2). Re-measure
  LCP against §17.1.
- **PR-G (test debt):** the remaining AP#43 invariants (owing source+scope, MY-TEAMS-admin, weather,
  density) + the first home-router **E2E** in `e2e/` covering all 3 roles + view-as.

---

## 7. DECISIONS REQUIRED BEFORE PR-A (scope-lock)
These are genuine operator calls (§0 rule #7) — recommendations given, but not unilaterally locked:

- **D1 — a11y contrast token (γ).** The soft-on-soft text contrast fix wants a darker on-soft text token
  (e.g. `--as-success-text` / `--as-warning-text`), permitted by the §0 accessibility-corollary *with an
  explicit gap-naming comment* (the `--as-text-meta` precedent). **Recommend: add the corollary tokens.**
  Alternative: restyle the eyebrows (larger/bolder/solid-bg) without new tokens. Token area is locked, so
  this needs explicit sign-off.
- **D2 — density model.** `useDensity` is 2-state (`minimal`/`maximum`) but §16.2, the `DensityToggle`
  comment, and the `useDensity` docstring all still say 3-state MIN/MED/MAX. **Recommend: ratify 2-state
  as final** (delete the dead `medium` refs + update §16.2 + docstrings). Alternative: restore MED.
- **D3 — hero KPI row on Admin.** §4.3 adds a 3-metric KPI row (collection% season-scoped · net-to-bank ·
  owing all-seasons). Per AP#63, season-vs-all-seasons scopes must be **labeled** on each metric.
  **Recommend: include, with scope labels.** Alternative: keep KPIs inside ProgramHealth only.
- **D4 — PR granularity.** 7 PRs as sequenced above, or fold B+C and E+F. **Recommend: keep 7** (each
  isolated-reviewable; structure-before-visual prevents the α-divergences from re-entering during the
  restructure).

---

## 8. AP#58 CROSS-BATCH PATTERN-CONTINUATION (for downstream sessions)
Pattern names registered for any follow-on audit batch to reference: **α** AP#63 same-concept-divergence
(9 instances — dominant, matches the platform prediction); **β** AP#36 self-fetching-card error-swallow
(4 — data hooks already clean, cards not); **γ** soft-on-soft a11y contrast (4 — strongest systemic a11y);
**δ** design-system drift (emoji/chevron/font/radius); **ε** self-fetching-cards-defeat-loading-gate (the
LCP-5s driver); **ζ** admin-flat-scroll + density-dead-code (structural); **η** cross-surface test debt.
Cross-cutting signal: α is the through-line — the redesign's highest-leverage work is consolidating the 9
same-concept divergences behind shared helpers + AP#43 invariant tests, which simultaneously closes the
test debt (η) and de-risks the §16.14 restructure (ζ/PR-C).
