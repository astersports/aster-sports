# AUDIT — Wave 2.B (Perf + bundle) — 2026-05-28

**Contract:** PLATFORM_PRIORITIES.md §17.6 Wave 2.B set per §4.AN routing — categories #1 perf cold load (anchored on the 5s LCP regression), #2 warm-cycle navigation, #3 bundle / code split. Three parallel line-by-line audits per CLAUDE.md §17.8 standing rule (AP #50 retired). Each agent ran first-pass line-by-line + §16.15 2-pass deep-read addendum.

**Status:** findings only. Routing → fix PRs is the next workstream (Batch 1 quick-wins agent dispatched in same turn; Batches 2-4 deferred for architecture decisions).

---

## Headline

- **11 consolidated P0s** across 3 surfaces — the largest Wave so far
- **19 P1s** across all 3 categories
- **10 P2s** deferred to later batches
- **4 new AP candidates** (render-gate-defaults-to-slowest-signal + sequential-await-in-evaluator + route-level-remount-key + CI-budget-gate-must-match-doc)
- §17.5 calibration: 3/3 categories surfaced real findings. **No demotions.**

### The 5s LCP regression — diagnosed with HIGH confidence

The Wave 2.B #1 anchor finding identifies the cause: **cascade of loading-gate waterfalls compounded by alert evaluator serial-await loop**.

1. **`src/lib/alerts/evaluator.js:124-133`** — `for…of await` loop runs 9 evaluator configs sequentially (~720ms–1.35s of pure DB latency)
2. **All 3 home pages gate render on `alertsLoading`** (parent + coach + admin) — slowest signal blocks entire shell paint
3. **`useSeasonFinancials:78`** fetches all 244 financial_transactions for the org with no season filter — re-runs on every cold load
4. **`qrcode.react` static-imported via 3 eager pages** — ~45KB raw in entry chunk
5. **Auth → seasons → activities → alerts waterfall** — 4 sequential RTTs before render unblocks

**Estimated fix impact (Batch 1):** P0 #1 (Promise.all) -600ms-1.2s + P0 #2 (drop alertsLoading gates) -400-600ms + P0 #3 (season filter) -80% payload = **~1.5-2s LCP improvement** from a single small PR.

---

## Cross-cutting patterns (AP #58 synthesis)

### CROSS-PATTERN 1 — Render-gate aggregation + remount key compound the warm-cycle perf

| Source | Finding |
|---|---|
| #1 anchor + AP #63 candidate | Render gate widens to slowest signal — 3 home pages each gate on 3-4 signals; new signals add slowest-of-N latency to LCP |
| #2 P0-1 + PATTERN BETA | `<div key={location.pathname}>` in `src/App.jsx:50` forces full subtree remount on every tab tap — AppShell + Header + BottomNav + `useHasUnread` realtime channel teardown/re-open + ALL page hooks |

**Compounds:** every tab tap unmounts AppShell, re-mounts everything, gates on the slowest of ~25-35 hooks. Even existing module-level caches (`useActivities`) don't help because hook useState/useEffect setup runs every remount.

### CROSS-PATTERN 2 — Sequential await + no shared cache amplify each other

| Source | Finding |
|---|---|
| #1 P0-1 + AP #64 candidate | Alert evaluator `for…of await` — 9 sequential RTTs |
| #2 P0-4 | 42 of 46 data-fetching hooks have NO cache. Frequent revisits refetch identical data within seconds |
| #2 PATTERN GAMMA | Same hook called 5-10× on a single page render (`useEventRsvpCounts` 6× sites, `useWeather` 10× sites). No shared in-flight dedup |

### CROSS-PATTERN 3 — §16.10 / §17.1 budget enforcement broken

| Source | Finding |
|---|---|
| #1 + #3 cross-confirmed | Entry chunk 114.57 KB gz vs §16.10 budget 85 KB (+35%) |
| #3 P0-1 | Total bundle 387.90 KB gz vs §16.10 hard limit 350 KB (+11%) |
| #3 P0-2 | CI `ENTRY_BUDGET_KB=350` conflates entry budget (85) with total budget (350) — silently passes both violations |

**PATTERN BUDGET-DRIFT:** doctrine and CI gate drifted 30-40% apart since PR #150 (2026-05-13). +29.57 KB on entry chunk in 15 days, 59 commits, 285 new files in `src/hooks` + `src/lib`. Zero CI signal flagged the drift.

### CROSS-PATTERN 4 — Static-import bloat in entry chunk

| Source | Finding |
|---|---|
| #1 + #3 cross-confirmed | `qrcode.react` static-imported via eager TeamDetailHero (~45KB raw lands in entry) |
| #1 + #3 cross-confirmed | `@vercel/speed-insights/react` static in main.jsx |
| #3 P0-3 | 1.77 MB orphan logo PNGs in `public/` never referenced anywhere (AP #51 dead-feature candidate) |
| #3 P1-5 | 5 eager pages with weak justification: LoginPage, ForgotPasswordPage, UnauthorizedPage, PublicSchedulePage, AccountPage |

### CROSS-PATTERN 5 — Long-list virtualization unfunded

§16.10 explicit rule: "long lists (>30 items) must virtualize."

| Source | Surface |
|---|---|
| #2 P0-2 | MessageThread renders 200 messages unvirtualized; `useAuth()` + `new Date().toLocaleString()` per row per re-render |
| #2 P0-3 | FamilyBalanceList renders 164 family rows unvirtualized; every search keystroke filters + re-renders all |
| #2 P1 | TeamHeatmap (per-player × per-event grid), TournamentMessagesTab (unlimited messages.map), AdminScheduleSection (date-bounded but can hit 30+) |
| Status | 0 lists virtualized. No `react-window` / `react-virtual` in package.json |

---

## §17.4 backlog confirmation + correction

§17.4 estimates corrected by the audit:

- **"16+ home-feeder hooks fire fresh on every mount"** → actual **~25-35 hooks per Parent home mount** (15 page-level + 9 from `useParentHomeSignals` + 5-11 in zone sub-components). 2× worse than backlog estimate.
- **"Realtime channel dedupe (replaces `Math.random()` suffix workaround across 7 hooks)"** → confirmed exactly 7 hooks: `useMessages`, `useEventArrivals`, `useRideRequests`, `useRideOffers`, `useRideClaims`, `useLiveGame`, `useHasUnread`.

---

## Wave 2.B P0 consolidated (11)

Ordered by fix-PR batch.

### Batch 1 — Home-render quick wins (4 P0s shipping THIS session)

1. **#1 P0-1 — Parallelize alert evaluator.** `src/lib/alerts/evaluator.js:124-133` switch `for…of await` to `Promise.all(enabled.map(async ...))`. -600ms-1.2s LCP.

2. **#1 P0-2 — Drop `alertsLoading` from home-page render gates.** Three pages: `src/pages/ParentHomePage.jsx:56`, `src/pages/AdminHomePage.jsx:71`, `src/pages/CoachHomePage.jsx:55`. Let alert pill render skeleton-in-place; paint everything else immediately. -400-600ms LCP.

3. **#1 P0-3 — Scope `useSeasonFinancials` by `seasonId`.** `src/hooks/useSeasonFinancials.js:78-81` — add `.eq('season_id', seasonId)` to the `financial_transactions` query. ~85% payload reduction.

4. **#2 P0-1 — Move/remove `<div key={location.pathname}>` in App.jsx.** `src/App.jsx:50` forces full subtree remount on every tab change. Move key inside `<Routes>` to scope to route-content only, OR remove if no animation intent. Single largest INP regression. Read git blame first to verify intent.

### Batch 2 — Bundle reduction (deferred — needs design)

5. **#1 P0-4 — Lazy-load `qrcode.react`.** `src/components/shared/ShareScheduleButton.jsx` + sibling. Wrap in `lazy(() => import('qrcode.react'))` with Suspense.

6. **#1 P0-5 (umbrella) — Entry chunk back under §16.10 85 KB gz budget.** Currently 114.57 KB gz. Lazy 5 weak-eager pages + qrcode.react fix + manualChunks for Supabase. Estimated -25-35 KB gz.

7. **#3 P0-1 — Total bundle back under §16.10 350 KB hard limit.** Currently 387.90 KB gz. Bundle of #5 + #6 + Vite `manualChunks` config + delete 1.77 MB orphan logo PNGs.

### Batch 3 — Cache layer (deferred — architecture call needed)

8. **#2 P0-4 — SWR/TanStack Query layer for 42 of 46 data-fetching hooks.** §17.4 backlog item. Needs design call on library choice + migration scope.

### Batch 4 — Virtualization (deferred — library install + multi-component refactor)

9. **#2 P0-2 — Virtualize MessageThread (200 msgs).** Plus memo MessageBubble + cache `Intl` format result. Needs `react-window` install.

10. **#2 P0-3 — Virtualize FamilyBalanceList (164 rows).** Plus debounce/throttle search input.

### CI gate (deferred — sequencing matters)

11. **#3 P0-2 — Split CI `ENTRY_BUDGET_KB=350` into ENTRY=85, TOTAL=350.** Cannot ship before Batch 2 lands or CI immediately goes red. Bundle with Batch 2 close-out.

---

## P1 surface (19 total)

**Perf cold load (5 P1):**
- Collapse auth → seasons waterfall (parallel + localStorage cache like `orgBrandingCache`)
- Cache `seasons` in localStorage (mirror brand-flash fix pattern)
- Lazy-load `@vercel/speed-insights/react` (defer to requestIdleCallback like Sentry/PostHog)
- Audit 35 home-feeder hook fan-out (consolidate to single view or batch hook)
- Drop `actionItemsLoading` + `financialsLoading` from render gate

**Warm-cycle nav (8 P1):**
- `useEventRsvpCounts` shared cache (6 callsites)
- `useOrgTeamRecords` no cache (5 pages refetch on tab change)
- `usePrograms` no cache (5 pages)
- `useWeather` 10-callsite fanout (lift to context)
- 59 direct `supabase.from(...)` callsites in `src/components/` (sub-component data-fetching, no centralization)
- Realtime channel suffix workaround → `RealtimeChannelProvider` keyed by topic
- `useHasUnread` over-fetches: every message INSERT in org triggers 2 queries per connected client
- `useRouteMemory` listener closure recreate on every route change

**Bundle (6 P1):**
- CI bundle guard threshold mismatch (P0 #11 — sequencing)
- CI guard expects nonexistent `supabase-*.js` chunk
- No `manualChunks` in vite.config.js
- 5 eager pages with weak justification
- `EventDetailPage` 26.36 KB gz chunk could sub-split tabs
- `useNeedsBriefing.js` orphan file (knip-flagged)

---

## §17.5 calibration

All 3 Wave 2.B categories surfaced real findings:

- **#1 Perf cold load:** 5 P0 / 5 P1 / 3 P2 — retain (highest-stakes category)
- **#2 Warm-cycle nav:** 4 P0 / 8 P1 / 4 P2 — retain
- **#3 Bundle / code split:** 3 P0 / 6 P1 / 3 P2 — retain

**No demotions.** All 3 retain for future addendum re-reads.

---

## Routing — Batch 1 quick-wins shipping THIS session

Single agent shipping 1 PR closing 4 P0s (#1, #2, #3, #6):

- `src/lib/alerts/evaluator.js:124-133` — `for…of await` → `Promise.all`
- `src/pages/ParentHomePage.jsx:56` + `src/pages/AdminHomePage.jsx:71` + `src/pages/CoachHomePage.jsx:55` — drop `alertsLoading` from render gate
- `src/hooks/useSeasonFinancials.js:78-81` — `.eq('season_id', seasonId)` filter
- `src/App.jsx:50` — move/remove route remount key (with git blame inspection for intent)

**Estimated LCP improvement: 1-2 seconds** from a small surgical PR.

---

## New AP candidates (4 from this batch)

- **Render gate aggregation defaults to slowest signal** — every new signal added to a home page increases LCP by slowest-of-N latency. Suggest §17.5 "render-gate signal budget" sub-rule: max 1 signal gates structural render; all others gate only their own region.
- **Sequential await in evaluator/orchestrator loops** — `for…of await` in dispatchers / orchestrators that could parallelize via `Promise.all`. 1 instance today (alert evaluator); promote on second.
- **Route-level remount key** — `<div key={location.pathname}>` around `<Routes>` defeats both component-instance state preservation AND any cache that lives inside the route subtree. Rule: keys that force remount go INSIDE the route component or are scoped to fade-in animations only, never above Routes.
- **CI budget gate must match documented budget** — when a CI guard exists to enforce a documented platform budget, the guard's threshold must equal the documented number. A guard that passes against a weaker threshold creates a false sense of security.

---

## Per-agent findings (preserved for fix-PR routing)

### #1 Perf cold load

- Files read: 24+ across page-load path
- Anchor confidence: HIGH — multi-cause waterfall with single biggest lever being alert evaluator parallelize
- Bundle: entry 114.57 KB gz (+35% over budget), all-chunks 387.90 KB gz (+11% over hard limit)
- Static SDK imports: Sentry (exempt per §16.10.1) + `@vercel/speed-insights/react` + `qrcode.react` (both should be lazy)
- Hook fleet on parent home: ~35 total firing on cold mount
- 5 P0: evaluator parallelize / drop alertsLoading gates / season filter / lazy qrcode / entry chunk budget

### #2 Warm-cycle navigation

- 31 routes audited, ~28 with mount-time fetch
- 4 P0: route remount key (single largest INP) / MessageThread 200 unvirtualized / FamilyBalanceList 164 unvirtualized / 42-of-46 hooks no cache
- §17.4 backlog corrected: hook count 2× worse than estimated (25-35 not 16+); 7 realtime channels confirmed exactly
- 0 lists virtualized; react-window not in package.json

### #3 Bundle / code split

- 81 JS chunks measured
- Entry chunk over §16.10 budget (+30 KB gz)
- Total over §16.10 hard limit (+38 KB gz)
- CI gate threshold mismatch + nonexistent supabase chunk lookup
- 1.77 MB orphan logo PNGs in public/
- Vite `manualChunks` config absent

---

## AP compliance

- **AP #45** — §4.AP shipped same commit ✓
- **AP #50 RETIRED** — line-by-line methodology held throughout dispatch ✓
- **AP #58** — cross-batch pattern check applied; 5 CROSS-PATTERNs ✓
- **AP #61** — pre-phase audit gate; required outputs delivered ✓
- **§17.8** — every agent reported §16.15 2-pass cascade-catch findings ✓

---

**Next session opens with:** Wave 2.C dispatch per §4.AN (#4 realtime channel hygiene + #5 React hook hygiene + #16 UX surface audit + #17 cross-role coverage matrix + #24 observability coverage). Plus Wave 2.B Batches 2-4 routing decisions (cache library choice + virtualization scope + bundle reduction sequencing + CI gate split timing).
