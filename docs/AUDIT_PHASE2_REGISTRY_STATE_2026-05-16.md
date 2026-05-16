# Phase 2 Registry + State-Machine Drift Audit

**Date:** 2026-05-16 (Italy morning)
**Method:** 3 parallel Explore agents
**Coverage:** RESOLVER_REGISTRY (8 kinds), SECTION_RENDERERS (32 sections), BODY_LAZY (10 kinds), KIND_COMPOSERS (4 kinds), KIND_METADATA (10 kinds), state-machine sweep (8 hooks + reducers)
**Status:** Read-only inventory. Fix policy per Frank's fix-as-you-go reframe — Class 5 (Registry) ALLOWED but 3 P0 findings require new renderer files (~60-90 min total work), see "Trade-off" section.

---

## P0-LATENT findings (3) — orphan emit-sites

All 3 findings: a resolver emits a section with a `kind` value that has NO entry in `SECTION_RENDERERS`. `composer.js:renderSections()` calls `warnUnknownKind()` (dev console only) then returns an empty string. **In production, the section silently renders as empty.**

These are LATENT because the affected briefing kinds (`rsvp_nudge`, `academy_callup_notice`, `tournament_recap`) **have not been sent to real recipients yet** per `comms_messages` table inspection — only `weekly_digest` has been sent in production. So the bugs would fire on FIRST SEND of these kinds.

### P0-LATENT-1: `event_card` orphan — emitted by rsvp_nudge

**Resolver:** `src/lib/engine/resolvers/rsvpNudge.js:121`
```js
sections.push({ kind: 'event_card', team_color: ..., date: ..., time: ..., location_name: ..., location_map_url: ..., opponent: ... });
```

**Renderer:** NONE. `SECTION_RENDERERS.event_card` is undefined.

**Impact:** Every rsvp_nudge briefing has an empty section where the event card should display the game date/time/location/opponent for the parent reading the nudge. The whole point of an RSVP nudge — what they're being nudged FOR — is invisible.

**Fix scope:** Build `src/lib/engine/renderers/eventCard.js` — table layout with team-color stripe, date/time prominently displayed, opponent + venue + map link. ~30-40 lines. Register in `composer.js`.

### P0-LATENT-2: `event_card` orphan — emitted by academy_callup_notice

**Resolver:** `src/lib/engine/resolvers/academyCallupNotice.js:119`

Same `event_card` kind, same orphan, same impact: the callup notice tells a parent "your kid is being called up to this game" but the game details render empty.

**Fix scope:** ONE renderer fixes both P0-LATENT-1 + P0-LATENT-2 (same section type, both resolvers emit identical shape).

### P0-LATENT-3: `placement_block` + `game_log` orphans — emitted by tournament_recap

**Resolver:** `src/lib/engine/resolvers/tournamentRecapHelpers.js`
- `buildPlacementBlock` at line 12 returns `{ kind: 'placement_block', team_color, final_place, record }`
- `buildGameLogSection` at line 38 + 46 returns `{ kind: 'game_log', team_color, days, placeholder }`

Both kinds: NOT in `SECTION_RENDERERS`. tournament_recap briefings would have empty placement and empty game log — the two PRIMARY content blocks of a recap.

**Fix scope:** Build `src/lib/engine/renderers/placementBlock.js` (~25 lines, simple "X-Y record, finished Nth" formatting) + `src/lib/engine/renderers/gameLog.js` (~50 lines, per-day grouped game cards with result/MVP/coach highlight). Register both in `composer.js`.

---

## P1 findings (3)

### P1-1: `championship_scenarios` renderer is dead code

`composer.js:57` registers `championship_scenarios: renderChampionshipScenarios` but no resolver in the codebase emits a section with that kind. Renderer file exists (`renderers/championshipScenarios.js`) but never reached.

**Action:** Either build a resolver path that uses it OR delete the renderer + registration. Audit doesn't decide; flagging as P1.

### P1-2: 4 KIND_COMPOSERS entries are unreachable

`composer.js:93–98` registers 4 legacy compose() entries: `academy_callup_notice`, `weekly_digest`, `announcement`, `custom_message`.

- `academy_callup_notice`: dispatches via `academyCallupSend` (registry path) — legacy compose() unreachable
- `weekly_digest`: dispatches via `digestSend` (dedicated path) — legacy compose() unreachable
- `announcement` + `custom_message`: legacy free-form path with ZERO active callers (per grep)

`composerSubmit.js:71` guards against falling through to the legacy path. All 4 entries are defensive but never invoked.

**Action:** Defensive retains are OK per the existing comment in composer.js. Worth a P1 cleanup PR to either prove they're needed (find a code path) or remove (if confirmed unreachable). Low risk either way.

### P1-3: 5 legacy kind enum values in `constants.js`

`src/lib/constants.js:72–77` defines `TOURNAMENT_MESSAGE_TYPES` array with 5 kind values that were retired from production:
- `tournament_final`
- `tournament_rsvp_lock`
- `tournament_recap_interim`
- `tournament_recap_final`
- `multi_team_notice`

Grep confirms zero active references outside `constants.js` + tests. Comment at line 68 notes coupling to a database CHECK constraint — verify before removing.

**Action:** Confirm the current `kind_check` constraint doesn't reference these (per my Phase 1 SQL: it doesn't — the canonical 10 kinds are the only ones in the constraint). Safe to remove the dead enum.

---

## P2 findings (1)

### P2-1: Stale comment in `tournamentPrelim.js`

Line 1 references old kind name `tournament_preliminary` (renamed to `tournament_prelim` in wave 4.1d-5). Comment-only drift; no runtime impact.

---

## State-machine sweep — CLEAN, no findings

8 hooks/reducers inspected. Both prior bugs verified fixed and in place:
- `useImportSchedule.js:76-77` — re-runs validateParsedRow + classifyRowAgainstExisting on every edit (PR #181 fix)
- `ImportSchedulePage.jsx:68-72` — gates PreviewTable to `{preview, committing}` only; `done` renders success card (PR #190 fix)

All other inspected hooks (useScoreDraft, useLiveGame, useRsvps, useEventRsvpCounts, useAttendanceData, composerReducer, BriefingComposer) use proper useMemo dependencies or full recomputation. No staling patterns detected.

---

## Trade-off — fix-as-you-go on P0-LATENT vs continue audit

Per Frank's fix-as-you-go policy, Class 5 (Registry) findings are ALLOWED for immediate fix. BUT the 3 P0-LATENT fixes require **building new renderer files** (~30-50 lines each, 3 renderers total = 90-150 lines, plus composer registration). Substantive work that consumes 60-90 min of audit-day budget.

Two paths:

**A. Ship the 3 renderers NOW (fix-as-you-go strict)**
- Build event_card, placement_block, game_log renderers
- Register in composer.js
- Verify by running compose() against test fixtures
- ~60-90 min
- Pushes Phase 3/4/5 later

**B. Stage to post-synthesis batched PR**
- Findings logged in this markdown
- Continue Phase 3, 4, 5 + synthesis
- Build renderers post-synthesis when full picture is known
- Rationale: LATENT bugs don't affect real users (no real sends of these kinds yet). Fixing later costs nothing.
- Pushes the renderer work to the end of audit-day OR Sunday

**Recommend B.** The "P0" classification reflects severity-if-triggered, not urgency. With no production users on these kinds, the cost of deferral is zero. Phase 3-5 audit findings might inform the renderer design (e.g., if Phase 5 surfaces a contract gap with the resolver shape).

Standing by for Frank's routing on A vs B before Phase 3 kicks off.

---

## Phase 2 status: COMPLETE

- **Findings:** 3 P0-LATENT (orphan renderers), 3 P1 (dead code + legacy enum), 1 P2 (stale comment)
- **State-machine drift:** zero active findings; both prior PR fixes verified in place
- **Fix PRs from Phase 2:** PENDING Frank's A vs B routing on P0-LATENT
- **Process correction noted:** none new this phase. Phase 1 corrections (information_schema verification + directory context check) held.

Standing by for Frank's routing to Phase 3 (Migration + Deploy reconciliation).
