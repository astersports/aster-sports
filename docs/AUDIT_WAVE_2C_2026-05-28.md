# AUDIT — Wave 2.C (Realtime / hooks / UX / cross-role / observability) — 2026-05-28

**Contract:** PLATFORM_PRIORITIES.md §17.6 Wave 2.C set per §4.AN routing — categories #4 realtime channel hygiene, #5 React hook hygiene, #16 UX surface audit (consolidated), #17 cross-role coverage matrix, #24 observability coverage. Five parallel line-by-line audits per CLAUDE.md §17.8 standing rule (AP #50 retired). Each agent ran first-pass line-by-line + §16.15 2-pass deep-read addendum.

**Status:** findings only. Routing → fix PRs is the next workstream (no Batch 1 quick-wins in this session — session-close discipline per AP #59).

---

## Headline

- **5 consolidated P0s** across 2 surfaces (#24 + #16)
- **~39 P1s** across all 5 categories
- **~21 P2s** deferred
- **7+ new AP candidates** surfaced across the batch
- §17.5 calibration: 5/5 categories surfaced real findings. **No demotions.**

---

## Cross-cutting patterns (AP #58 synthesis)

### CROSS-PATTERN 1 — Instrumentation without consumption (the foundational gap)

**#24 PATTERN OMEGA** locks this. Three independent observability stacks installed; all 3 ship signal nobody consumes:

| Source | Finding |
|---|---|
| #24 P1 (Wave 2.B cross-confirmed) | Vercel Speed Insights mounted PR #554 — 5s LCP regressed for weeks because no one queried it |
| #24 P1 | 5 audit-log tables (`pii_audit_log`, `event_change_audit`, `event_reminder_log`, `comms_message_recipients` delivery state) — all writers, zero admin readers. §16.8 "audit log visibility" violated by every one. |
| #24 P1 | Resend bounce/complaint webhook stores delivery state on comms_message_recipients — no admin bounce surface |
| #24 P1 | Cron health (`briefing-cron-dispatch`, `briefing-auto-draft-tick`) only surfaces via Supabase `get_logs` — no in-app last-ran-at / last-success-at |

**New AP candidate B — "Instrumentation without consumption is theater"** — every observability investment lands with a documented review cadence; otherwise it's instrumentation that exists to be unread.

### CROSS-PATTERN 2 — Console.error ↔ Sentry silent gap (123 sites)

| Source | Finding |
|---|---|
| #24 P0-1 + PATTERN PSI | 108 `console.error` + 13 `console.warn` + 2 `console.log` — only ONE `Sentry.captureException` call site in the entire app (ErrorBoundary) |
| #24 P0-3 | Production builds ship all 108 console.error to mobile DevTools (no `esbuild.drop` in vite.config) |
| #24 P1 | Zero `Sentry.addBreadcrumb` — when ErrorBoundary fires, the trail is empty (no route, no last action, no auth event) |
| #16 P1 | 4 raw `error.message` user-visible UI leaks (TournamentsPage:63, AdminLocationsPage:76, ImportSchedulePage:51, TournamentPlaceholderEventsModal:92) compound the gap — even when caught, wrong observation surface |

**New AP candidate A — "Console-logged errors are not observable errors"** — every catch path that owns a user-facing failure routes through a `reportError(err, ctx)` helper that calls both Sentry and console. Pure console-only is reserved for dev-only diagnostics.

### CROSS-PATTERN 3 — `isStaff` vs `isAdmin` discipline drift

**#17 PATTERN ALPHA** — 7 instances where coach sees an `isStaff`-gated affordance whose `onClick`/`Link to` targets an admin-only route → `/unauthorized`:

| Component:Line | Affordance |
|---|---|
| `EventHeroActions.jsx:71` | "Compose briefing" → `/admin/briefings/compose` (tournament draft) |
| `EventDetailPage.jsx:103` | `onNotify` → `/admin/briefings/compose` (event-scoped) |
| `TeamDetailHero.jsx:103-106` | "Briefing" Link → `/admin/briefings/compose` (team-scoped) |
| `TournamentHeader.jsx:95` | Tournament-scoped briefing CTA |
| `ComposeAnchorCta.jsx:52` | Shared dispatcher CTA |
| `EventBriefingHistory.jsx:72` | "View briefing detail" → `/admin/briefings/history/:id` |
| `TournamentBriefingHistory.jsx:70` | Same pattern, tournament-scoped |

The drift happened because no AP #43 cross-role invariant test pins per-role action stacks on `EventDetailPage` — the §16.14 reference instance for per-role action stacks has zero test coverage of its own contract.

**Fix routing decision needed:** either tighten visibility to `isAdmin(role)` and hide for coach, OR open `/admin/briefings/*` to coach role. CLAUDE.md §13 mentions "active coach for compose" — suggests the design intent was open-to-coach, then drifted.

### CROSS-PATTERN 4 — Hook fan-out + sequential loading-state inflate cold load

The PR #571 Program Health fix surfaced this class at one component; Wave 2.C confirms it at fleet scale.

| Layer | Manifestation | Source |
|---|---|---|
| Hook fleet (23 hooks) | `useState(true) + useState([])` initial-state-lie pattern; consumers gate on `loading \|\| items.length === 0` and see "no data" momentarily | #5 P1-4 (PATTERN STALE-INITIAL) |
| Per-page hook fan-out | `useNow` 21 callsites = 21 setInterval per mount; `useEventRsvpCounts` 5 sites; `useWeather` 10 sites | #5 P1-1 (PATTERN HOOK-FANOUT) |
| Component placeholders | `RecentActivityFeed:22` + `RidesTodayCard:32` return `null` while loading → staggered pop-in on admin home | #16 P1 (AP candidate #64) |
| Cold load anchor | 5s LCP regression diagnosed Wave 2.B | Wave 2.B #1 P0-1 |
| Component fix (already shipped) | PR #571 — Program Health zeros → skeletons | Wave 2.B post-#570 |

**These are the same bug class at different layers.** PR #241 documented + fixed `useAlertEvaluator` (2026-05-18). Never swept the fleet. The Program Health fix in PR #571 hit one component instance. The fleet sweep is the structural close-out — pair with Batch 3 cache layer (Wave 2.B deferred) OR ship as a dedicated hook-fleet hygiene PR.

### CROSS-PATTERN 5 — Realtime channel dedup gap (production-confirmed game-day fan-out)

**#4 PATTERN EPSILON + ZETA** extend Wave 2.B's PATTERN DELTA. DELTA was the upstream amplifier (PR #570 closed App.jsx route remount). EPSILON + ZETA are the per-hook gaps that remain:

| Finding | Detail | Source |
|---|---|---|
| `useEventArrivals` game-day triple-mount | `ParentArrivalActions` + `ArrivalBoard` + `GameDayMode` all subscribe with same `event.id` but each opens its own channel via `Math.random()` suffix. Up to 39 concurrent subs per event per device on game day. | #4 P1-1 |
| 7/7 hooks no status callback | `.subscribe()` called with no callback — silent failure on websocket drop | #4 P1-3 |
| 7/7 hooks no reconnect refetch | Transport reconnects auto; local cache silently lags reality | #4 P1-4 |
| `useHasUnread` Realtime-fired N+1 | 2 queries per `messages` INSERT × org-wide subscriber count × msg rate | #4 P1-2 |

**Proposed `RealtimeContext` design** (proposed by #4, out-of-scope for audit, handed to implementation phase): keyed by stable topic name (no random suffix), refcounted, status-callback-bearing, fires onChange on reconnect. Single implementation closes P1-1, P1-3, P1-4 simultaneously across all 7 callsites. P1-2 needs orthogonal payload-or-trigger change.

---

## Wave 2.C P0 consolidated (5)

| # | Source | Surface | Finding |
|---|---|---|---|
| 1 | #24 P0-1 | Sentry | 1 capture site in entire app; 108 console.error sites invisible |
| 2 | #24 P0-2 | PostHog | Zero `posthog.capture()` events; no taxonomy ever locked |
| 3 | #24 P0-3 | Vite build | 108 console.error ship to production browsers (no `esbuild.drop`) |
| 4 | #16 P0 | UX | `AutoNotificationSettingsSheet:35` exposes DB schema to user ("auto_notifications column may need to be added to the organizations table") |
| 5 | #16 P0 | a11y | `RoleSwitcherViews:39` unlabeled search input — no `<label>` + no `aria-label` |

---

## Wave 2.C P1 surface (39 total)

**#4 Realtime (4 P1):** game-day triple-mount fan-out, `useHasUnread` N+1, no channel error handling on 7/7, no reconnect refetch on 7/7

**#5 Hook hygiene (6 P1):** `useNow` 21-callsite fan-out, array-identity dep churn in 2 hooks, `useWeather` lat/lon race (no AbortController), 23-hook `useState(true) + useState([])` stale-initial pattern, 4 hooks return non-`useCallback` mutators (RSVP grid renders 14×), ToastProvider fragile-dep coupling

**#16 UX surface (15 P1):** 4 raw `error.message` UI leaks, 6 input-label association gaps, 5 tap targets <44px (clustered on schedule-import + tournament-preview), 14 §16.3 kindness-microcopy violations (overlap with raw-error leaks), 4 records-namespace components inline `#fff`/`rgba(255,255,255,0.5)` instead of `var(--em-bc-text)`, 2 home widgets stagger-load via `if (loading) return null`, hardcoded fallback hex in CSS vars (`var(--em-X, #HEX)` pattern), TournamentsPage generic "Loading…"

**#17 Cross-role (8 P1):** 7 PATTERN ALPHA `isStaff` → admin-only path instances + 1 view-as partial coverage (`activeRole` honored on only 2 of ~9 surfaces; documented "home-only" but Frank's QA workflow only partially achievable)

**#24 Observability (6 P1):** Sentry release/sourcemap absent (errors symbolicate to minified chunk names), Speed Insights data unconsumed, audit logs without admin UI readers (5 tables), Resend webhook delivery state stored with no admin bounce surface, cron health invisible (no in-app last-ran-at), zero Sentry breadcrumbs on auth/nav/write paths

---

## Wave 2.C scoreboard

All 5 categories retained per §17.5 calibration. No demotions.

| Category | P0 | P1 | P2 | New AP candidates | Status |
|---|---|---|---|---|---|
| #4 Realtime | 0 | 4 | 4 | EPSILON, ZETA, pre-cand random-suffix-smell | Retain |
| #5 Hooks | 0 | 6 | 4 | HOOK-FANOUT, STALE-INITIAL | Retain (cleanest layer; fleet sweep owed) |
| #16 UX | 2 | 15 | 6 | #63 (CSS var fallback hex), #64 (loading null on widgets), #65 (raw error.message UI leak) | Retain (biggest finding count) |
| #17 Cross-role | 0 | 8 | 4 | `isStaff`/admin-path routing | Retain |
| #24 Observability | 3 | 6 | 3 | OMEGA, PSI (candidate A console-errors-not-observable + candidate B instrumentation-without-consumption) | Retain (highest stakes) |

---

## §17.4 backlog corrections (cumulative across waves)

| Item | Original estimate | Confirmed reality |
|---|---|---|
| "16+ home-feeder hooks on mount" | 16+ | **~30-35 per Parent home mount** (Wave 2.B + #5 cross-confirmed; AuthContext alone fires 19 hooks) |
| "7 Math.random() realtime channels" | 7 | **Confirmed exactly 7** (#4) |
| "Realtime channel dedupe context" | Hypothesis | Confirmed P1 with concrete design proposed (`RealtimeContext` shape) |
| "SWR/TanStack Query layer" | Hypothesis | Confirmed P1 — Wave 2.B Batch 3 deferred for design call |

---

## New AP candidates surfaced this batch (7)

Numbering not yet locked — will register on third-instance promotion per the catalog discipline:

1. **PATTERN HOOK-FANOUT (candidate)** — hooks that look "isolated" at file-read review create systemic load at scale. `useNow` 21× intervals. Promote on second N×Single-Interval-Per-Mount discovery.
2. **PATTERN STALE-INITIAL (candidate, likely-lock)** — `useState(true) + useState([])` at fleet scale (23 hooks). PR #241 documented; never swept.
3. **PATTERN EPSILON — Realtime channel hygiene gap** — no status callback + no reconnect refetch across 7/7 channel hooks.
4. **PATTERN ZETA — Silent server-side fan-out on Realtime INSERT** — `useHasUnread` N+1 specific case.
5. **#63 — CSS variable fallback hex literals forbidden** — `var(--em-X, #HEX)` patterns create undocumented hardcoded color.
6. **#64 — `if (loading) return null` on home widgets** — staggered pop-in instead of shape-matched skeleton.
7. **#65 — Raw `error.message` may never appear in user-facing UI** — log + render kind copy.

Plus PATTERN OMEGA (instrumentation without consumption) and PATTERN PSI (console.error boilerplate at 123 sites) from #24 — registered as candidate A + B per the audit.

Plus `isStaff` → admin-only path routing from #17.

---

## Per-agent findings (preserved for fix-PR routing)

### #4 Realtime channel hygiene

- 7 channel hooks, all using `Math.random()` suffix (matches §17.4 backlog exactly)
- 7 published tables (`pg_publication_tables`); 1 extraneous (`dm_threads` published, no subscriber)
- Cleanup discipline uniformly correct across all 7 hooks (no leaks, no race-on-rebroadcast)
- 0 P0 / 4 P1 / 4 P2
- §16.15 cascade: Pass 2 surfaced 3 of 4 P1s (game-day triple-mount cross-grep, status-callback platform gap, publication gap)

### #5 React hook hygiene

- 126 custom hooks total
- 35 line-by-line + 91 heuristic-sampled
- Fleet is cleanest layer for AP #36 / #3 / #4 / #37 compliance
- 0 P0 / 6 P1 / 4 P2
- ParentHomePage mount: ~30-35 hooks confirmed (matches §17.4 backlog corrected estimate)

### #16 UX surface audit (consolidated)

- 322 files audited
- Sub-audit A (tokens): 8 hex literal violations + 0 Tailwind color-class + 0 `bg-black/X` + 0 invented tokens (broadcast namespace `--em-bc-*` is intentional separate palette)
- Sub-audit B (a11y): 277 buttons / 201 aria-labels / 63 inputs / 22 htmlFor on 50 labels; 1 P0 + 7 label-association P1 + 5 tap-target P1
- Sub-audit C (microcopy): 14 §16.3 violations + 4 raw `error.message` UI leaks
- Sub-audit D (empty-state): 2 home widgets stagger-load via `null` return; TournamentsPage generic "Loading…"
- 2 P0 / 15 P1 / 6 P2

### #17 Cross-role coverage matrix

- 13 surfaces × 3 roles + view-as column documented
- 5 surfaces have AP #43 cross-role invariant tests; 9 don't (highest-load-bearing: EventDetailPage / EventHeroActions — the §16.14 reference instance for per-role action stacks)
- View-as honored on 2 of ~9 surfaces (HomePage, TeamDetailPage); documented "home-only" per useHomeRole comment
- 0 P0 / 8 P1 / 4 P2
- AP #42 discipline holding (useHomeRole load-bearing, no useActiveRole revival)

### #24 Observability coverage

- 1 Sentry capture site in entire app
- 0 `posthog.capture()` events; no taxonomy locked
- 5 audit-log tables (writers without readers)
- 0 of 12 edge functions have Sentry/PostHog wiring
- 108 console.error + 13 console.warn + 2 console.log = 123 sites ship to production browsers
- 3 P0 / 6 P1 / 3 P2

---

## §17.5 calibration outcome

**All 5 categories surfaced real findings. No demotions.** All retained for Wave 3 if re-audit needed.

---

## Routing — 5 cross-pattern arcs queued for the next batch

Wave 2.C produced 39 P1s + 5 cross-patterns + 7 AP candidates. The 5 cross-patterns map cleanly to 5 fix-PR arcs. Each is shippable independently; some have ordering preference (CROSS-PATTERN 2's `reportError` helper benefits the rest by giving them a centralized observability surface to migrate into).

**Suggested arc order:**

1. **CROSS-PATTERN 1 (instrumentation without consumption):** Build the consumer surfaces — admin audit-log views, Sentry/PostHog/Speed Insights review cadence in CLAUDE.md §11.7, cron health card. Single doc-and-build arc.
2. **CROSS-PATTERN 2 (console.error ↔ Sentry):** Build `reportError(err, ctx)` helper in `src/lib/sentry.js`. Migrate critical paths first (auth → write paths → RPCs). Sweep can be incremental. Configure `esbuild.drop` in vite for prod.
3. **CROSS-PATTERN 3 (isStaff/admin drift):** Decision call: tighten coach visibility OR open `/admin/briefings/*` to coach. Then sweep + ship AP #43 invariant test on EventDetailPage per-role action stack (highest-load-bearing surface with zero test coverage).
4. **CROSS-PATTERN 4 (hook fleet stale-initial):** Bundle with Batch 3 cache layer OR ship as standalone hook-fleet hygiene PR. PATTERN HOOK-FANOUT (`useNow` context lift) is separable + small.
5. **CROSS-PATTERN 5 (realtime dedup):** Build `RealtimeContext` per the design proposed in #4 — single implementation closes 3 P1s across 7 callsites.

---

## AP compliance

- **AP #45** — §4.AQ ledger entry in same commit as `docs/AUDIT_*.md` ✓
- **AP #50** — RETIRED; line-by-line methodology held throughout 5-agent dispatch ✓
- **AP #56 + #59** — RETIRED in this same PR alongside the Wave 2.C close. Capacity-discipline framing dropped; session continuation is the operator's call.
- **AP #58** — cross-batch pattern check applied; 5 CROSS-PATTERNs ✓
- **AP #61** — pre-phase audit gate; required outputs delivered (bug + enhancement + redesign surfaces + routing recommendations) ✓
- **§17.8** — every agent reported §16.15 2-pass cascade-catch findings ✓

---

**Next session opens with:** §9.1 pre-flight + verification PR #571 (skeleton consistency) merged + Wave 2.C routing decisions per the 5 cross-patterns above. After Wave 2.C routing closes → Wave 3.A dispatch per §4.AN (#18 onboarding + #19 notifications + #20 briefing engine + #21 edge function deploy parity + #22 pg_cron job health).
