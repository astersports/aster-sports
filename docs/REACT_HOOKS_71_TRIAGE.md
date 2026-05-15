# React Hooks 7.1.1 Triage

**Created:** 2026-05-13
**Trigger:** Dependabot PR #148 (safe-minor-and-patch group) bumps `eslint-plugin-react-hooks` 7.0.1 → 7.1.1, which ships React 19 / React Compiler idiom checks.
**Status:** 16 violations across 5 new rules. All set to `'warn'` (not `'error'`) in `eslint.config.js` so the bump can land without forcing a rushed fix-pass; build doesn't fail; violations stay visible in CI output.

This doc is the per-site triage list. Fix one PR at a time, each scoped to one violation (or one root-cause group). When the warning count for a rule hits zero, promote that rule from `'warn'` to `'error'` and delete the matching disable in `eslint.config.js`.

---

## Counts by rule

| Rule | Count | Description |
|---|---|---|
| `react-hooks/set-state-in-effect` | 10 | `setState` called synchronously inside a `useEffect` body causes cascading renders |
| `react-hooks/preserve-manual-memoization` | 3 | React Compiler can't preserve manual `useMemo`/`useCallback` deps; inferred deps don't match specified |
| `react-hooks/immutability` | 1 | Variable accessed before declaration (TDZ-class issue) |
| `react-hooks/purity` | 1 | Impure call (e.g. `Date.now()`) during render produces unstable results |
| `react-hooks/refs` | 1 | Ref accessed during render (rules of hooks violation under React 19) |
| **Total** | **16** | |

Plus 1 `react-hooks/exhaustive-deps` warning (pre-existing rule, not part of the 7.1.1 surface).

---

## Pre-existing inline disables (covers some sites)

Found via `grep -rn "eslint-disable.*react-hooks/(set-state-in-effect|purity|immutability|refs|preserve-manual-memoization)" src/`:

| File:line | Disabled rule | Why |
|---|---|---|
| `src/components/briefings/StepSendConfirm.jsx:49` | `react-hooks/purity` | (likely an intentional Date.now / id-generation; verify) |
| `src/hooks/useBriefingFilters.js:65` | `react-hooks/preserve-manual-memoization` | (likely an accepted memo pattern; verify) |

Both predate the 7.1.1 bump — added preemptively or migrated from another lint setup. The triage should confirm they're still needed and document why next to the disable comment.

---

## Per-site triage table

### Group A — "fetch on mount" pattern (5 sites)

`useEffect(() => { fetcher(); }, [fetcher])` where the fetcher internally `setState`s. The rule fires because the first render runs the effect, which sets state, which re-renders. Cascading-render risk under React 19's new scheduler.

| File:line | Likely fix |
|---|---|
| `src/hooks/useNeedsBriefing.js:47` | Move fetch outside effect (use TanStack Query / `use()`) OR mark as intentional with a "this is the canonical fetch hook" disable comment |
| `src/hooks/useRideClaims.js:35` | Same |
| `src/hooks/useRideOffers.js:35` | Same |
| `src/hooks/useRoster.js:54` | Same |
| `src/hooks/useTournament.js:38` | Same |

**PR scope:** could be 1 PR (all 5 share the pattern + likely fix). If switching to `use()` or TanStack Query is the move, that's a Wave-scale refactor — defer until that decision is made.

### Group B — "cache-then-fetch" pattern (2 sites) — MERGED INTO GROUP A

**Structural-similarity correction (2026-05-15, in flight during Group B PR).**
The original triage doc claimed Group B's fix was mechanical: "Move cache
read into useState initializer; fetch in effect." When CC implemented this
on `useLocations.js` and `useTournaments.js`, the rule still fired on the
remaining `useEffect(() => { fetch(); }, [fetch]);` line. Reason: `fetch`
internally calls `setLoading(true)` synchronously before its first await,
so any effect that invokes `fetch()` is reachable-setState from the effect
body and trips the rule.

Group B is structurally the same as Group A: both are "effect calls a
fetcher that internally setStates." The lazy-initializer cleanup is a
real UX improvement (cached data renders on first paint vs first
effect-tick) but does NOT drain the lint warning by itself.

**Decision**: Group B's 2 sites fold into Group A's unified doctrine PR
(now 7 sites: 5 original + 2 from Group B). All 7 get the same treatment:
intentional `eslint-disable-next-line react-hooks/set-state-in-effect`
with a per-site reason comment + a CLAUDE.md doctrine note. Real refactor
to TanStack Query / React 19 `use()` parks as a Wave 1 follow-up.

**Lazy-initializer cleanup**: shipped separately as a perf PR (NOT a
lint drainage). See PR with title `perf(hooks): lazy-initialize cache
hit in useLocations + useTournaments`.

| File:line | Disposition |
|---|---|
| `src/hooks/useLocations.js:58` (now :56 post lazy-init) | → Group A unified doctrine PR (disable comment) |
| `src/hooks/useTournaments.js:86` (now :84 post lazy-init) | → Group A unified doctrine PR (disable comment) |

### Group C — distinct one-offs in set-state-in-effect (3 sites)

| File:line | What's happening |
|---|---|
| `src/components/briefings/BriefingComposer.jsx:100` | `setHasParentTournament(false)` in an early-return guard inside an effect. Likely fixable by deriving from props/state during render instead. |
| `src/components/ride/PostOfferForm.jsx:63` | Conditional `setPickupTime`/`setReturnTime` from props on `open` toggle. Already has an `eslint-disable` for `exhaustive-deps`. Probably needs a derived-state refactor. |
| `src/hooks/useAttendanceData.js:17` | `setLoading(false)` early return + key-check ref pattern. Effect-with-ref-dedupe — common React 18 pattern that the new rule flags. |

**PR scope:** 1 PR each (different concerns).

### Group D — preserve-manual-memoization (3 sites)

React Compiler analysis says the inferred deps for these `useMemo`/`useCallback` don't match the manually specified ones. Either the manual deps are too narrow (memo invalidates more than needed) or too broad (memo invalidates less than needed).

| File:line | Likely fix |
|---|---|
| `src/hooks/useBriefingDraft.js:57` | Compare inferred vs manual deps (CI message lists both); align |
| `src/hooks/useEventDelete.js:19` | Same |
| `src/hooks/useScheduleChangeAudit.js:38` | Same |

**PR scope:** 1 PR for all 3 (mechanical).

### Group E — one-offs (3 sites)

| File:line | Rule | Description |
|---|---|---|
| `src/hooks/useScoreDraft.js:47` | `react-hooks/refs` | Accessing a ref during render. Move to effect or `useSyncExternalStore`. |
| `src/hooks/useScoreDraft.js:94` | `react-hooks/immutability` | Variable accessed before declaration. May be a hoisting issue. |
| `src/hooks/useAttendanceData.js:82` | `react-hooks/purity` | `Date.now()` called during render. Move to effect or use `useRef` for the timestamp. |

**PR scope:** 1 PR per file (`useScoreDraft.js` has 2 issues, fix together).

---

## Promotion criteria

When the warning count for a rule hits zero, promote that rule from `'warn'` to `'error'` in `eslint.config.js` and delete the matching block-comment line. Don't promote until zero — leaving warnings unaddressed under `'warn'` is technical debt accumulation.

Suggested PR sequence:
1. Group D (3 sites, mechanical) → flip `preserve-manual-memoization` to error
2. Group E `useScoreDraft.js` (2 issues, 1 file) → flip `refs` + `immutability` to error
3. Group E `useAttendanceData.js:82` (1 issue) → flip `purity` to error
4. Group B (2 sites, 1 PR) → partial set-state-in-effect drain
5. Group C (3 sites, 3 PRs) → further drain
6. Group A (5 sites, doctrine call: refactor or document?) → final drain → flip `set-state-in-effect` to error

---

## Background context

JS-3 (PR #149) — `AdminSeasonsPage.jsx:130` stale closure on `confirmSwitch.id` after Enter key — was exactly this class of bug. The `set-state-in-effect` rule + the broader React 19 render-scheduling checks exist *because* React 19 changed the timing of when effects fire relative to user input. Each violation in this triage list is a potential JS-3-shaped bug. Don't dismiss them as lint pedantry.
