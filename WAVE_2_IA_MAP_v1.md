# Wave 2 — Coach Quick-Score IA Map

**Version:** v1.1 (April 30, 2026)
**Authors:** Frank + Claude (multi-session conversation, April 30, 2026)
**Supersedes:** WAVE_2_IA_MAP_v1.md (in-place update; v1 git history preserves the diff)

## Changelog: v1 → v1.1

Fresh-eyes audit on April 30, 2026 surfaced 9 holes (B1-B9) + 8 enhancements (E1-E8) + 4 cross-cutting observations. Frank resolved all of them. v1.1 rolls them into the locked decisions list, expands pre-flight to include items the audit identified, and updates the commit roadmap with the new specificity.

Frank-resolved questions baked into v1.1:
- Q1 → POG dropdown source: **all team players including Futures Academy** (Decision 4)
- Q2 → audit table editor name: **denormalized `editor_name` column on audit row** (Decision 12)
- Q3 → POG display on /records: **separate muted line below score, variable row height accepted** (new Decision 23)
- Q4 → backfill POG dropdown source: **current roster + footer note**, not historical (new Decision 24)

---

## Purpose

Wave 2 unlocks the records page. Today `/records` is read-only — there is no UI to enter game results. The 14 already-played Spring 2026 games sit unscored in the database; new games queue up the same way. Wave 2 ships the score-entry pipeline end-to-end:

- Score entry sheet (final-only and quarter-by-quarter modes)
- Save Draft + Publish flow combined in a single commit
- Edit + audit trail (CLAUDE.md §16.8 compliant)
- Backfill queue for already-played games
- Multi-game tournament "Score next game" flow

Wave 2 does **not** ship per-player box scores, push notifications, or editorial content (game recaps, highlight cards) — those land in later waves. See **Deferred** section.

---

## Locked decisions (28 total)

### Entry + flow

**1. Entry point.** Coach starts a game-score from the event detail page. Tap an event → "Score game" button. Button visible only to coach (assigned via `coaching_assignments`) + admin.

**2. Score granularity.** Two-mode toggle on the entry sheet. Default is "final score only" for 5-second entry. Quarter-by-quarter mode available via toggle for coaches who want it.

**3. Publish flow.** Save as draft (`published_at = NULL`), separate Publish button. Both buttons live in the same form from day one — Wave 2B-C ships them combined to avoid an unusable middle state where coaches save but parents see nothing.

**4. Player-of-the-game.** Optional dropdown on the entry form, defaults to no selection. **Source: all team players including Futures Academy roster_type.** Academy kids playing up should be recognizable as POG. Filter is `team_id = event.team_id`, no roster_type exclusion.

**5. Coach highlight.** 140-character short note. Stored in `game_results.coach_highlight`. Migration NNN adds `CHECK (char_length(coach_highlight) <= 140)` so DB enforces, not just UI.

**6. Per-player stats.** NONE for v1. Game stats per-player explicitly out of scope per CLAUDE.md §16.12 ("Game stats per-player allowed in 2026? NO"). Box score is its own future wave (post-2026).

**7. Permission.** Coach (assigned via `coaching_assignments`) + admin. Not assistant coach (Darien) — admin override always works for any coverage gap.

**8. Backfill queue.** Already-played games appear in a "Needs scoring" queue at `/coach/games-to-score` (its own route). Filter: `start_at < now AND status NOT IN ('cancelled', 'postponed') AND event_type IN (game-equivalent values per pre-flight 3) AND no game_results row`.

**9. Per-game rules.** Defer to the per-game rules migration (number TBD when that wave starts). Wave 2 does not ask the coach about quarter length, FT line, or any rule overrides.

**10. Push notifications.** NONE for v1. Parents discover on next app open. Push setup is its own scope (Capacitor + APNs/FCM + Phase 5 / Wave 10 territory).

### Edit + audit

**11. Edit-after-publish: allowed.** Logged to a new `game_result_edits` audit table (schema in Decision 22). Parent-visible "Updated by Coach Kenny at 4:47 PM" appears inline on the GameLogRow when edits exist. Per CLAUDE.md §16.8: every override is timestamped, author-tagged, surfaced.

**12. Audit row author identity = denormalized `editor_name TEXT NOT NULL`.** Audit row stores the coach/admin's name at the time of the edit. Rationale: (a) audit semantics specifically want historical snapshots — if Coach Kenny later changes their display name, prior edits should still read "Coach Kenny"; (b) avoids public RLS exposure of users / coaching_assignments (multi-tenant safe for Phase 7-B).

**13. Audit table public-readable from day one.** RLS on `game_result_edits` allows anon SELECT, matching `game_results` (Migrations 025/028). Coach name is denormalized on the row per Decision 12, so no additional table joins needed for anon viewers.

**14. Audit table read pattern = batched.** No N+1 on `/records`. Either fold audit metadata into the existing `useOrgTeamRecords` query as a left-join projection, or new `useOrgGameEdits(orgId)` hook returning `{ byGameId: { [game_id]: latestEdit } }`. Decide between the two during Wave 2A migration design — the choice depends on RLS shape and the audit-row count per game (left-join cleaner for "last edit only" projection; separate hook cleaner for "full edit history").

**15. Live updates after edit = eventual consistency for v1.** Parent's open `/records` tab shows stale "no edit" state until tab focus refetch. Audit item E2 from yesterday's session noted `useOrgTeamRecords` lacks `useRefetchOnVisible` wiring; that fix is post-Wave-2 cleanup, not in scope here. Edits are not invisible — they're just not real-time.

**16. Result auto-derivation.** Derive from `our_score` vs `opponent_score` on save (us > them = W, < them = L, equal = T). Coach can override via radio when math is wrong (forfeit wins, technical losses, etc.). Override is the rare path.

**17. Override-result UX.** Hidden by default. Below the auto-derived result text, a small "Override" link reveals the W/L/T radio. Keeps the form lean for the 99% case.

**18. Multi-game tournament flow.** "Score next game" button on save success. If the coach is in a tournament event (`event.tournament_id IS NOT NULL`, verified per pre-flight 7), button jumps to the next unscored game in the same tournament. Sequential per-game flow; no batch-entry view in v1.

**19. `quarter_scores` JSONB shape.** Stays NULL when coach uses final-only mode. Only populated when quarter mode is selected. `/records` GameLogRow renders quarter breakdown only when the column is non-null — display ships in Wave 2D as part of the same commit as the data write.

### Data model + migration

**20. Use existing `game_results` table.** Pre-flight verifies the column inventory. Expected: `quarter_scores` JSONB, `player_of_game_id`, `coach_highlight`, `published_at`, `our_score`, `opponent_score`, `opponent_name`, `result`. Any column gaps surface during Wave 2A pre-flight and are added in the same migration.

**21. `published_at` controls visibility on `/records`.** NULL = draft / unpublished. Set timestamp = published. Existing convention from Migrations 025/028.

**22. `game_result_edits` audit table schema (proposed; pre-flight may surface column adjustments):**

```sql
CREATE TABLE game_result_edits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_result_id  uuid NOT NULL REFERENCES game_results(id) ON DELETE CASCADE,
  editor_user_id  uuid NOT NULL REFERENCES auth.users(id),
  editor_name     text NOT NULL,                          -- denormalized per Decision 12
  edited_at       timestamptz NOT NULL DEFAULT now(),
  fields_changed  jsonb NOT NULL,                         -- {our_score: [old, new], ...}
  prior_values    jsonb NOT NULL                          -- full snapshot before edit
);

CREATE INDEX idx_game_result_edits_game_id ON game_result_edits(game_result_id);
```

RLS: anon SELECT (per Decision 13). Insert restricted to authenticated coach + admin (via auth.uid() in the policy).

**23. Migration NNN scope.** Adds `game_result_edits` table per Decision 22 + any column gaps in `game_results` surfaced by pre-flight + `CHECK` constraint on `coach_highlight` length per Decision 5 + RLS policies (write for assigned coach + admin on `game_results`; public SELECT on `game_result_edits`). Migration number TBD by pre-flight item 0 — userMemories said "014" but production is past 028 + 14 timestamped migrations (per master index Decision 64). Real number is in the 040s+.

### Display

**24. POG display on `/records` GameLogRow = separate muted line below score.** Format: `Player of the Game: Mia Rodriguez`. Renders only when POG is set. Tone: editorial, like a print box score. **Caveat:** rows with POG are taller than rows without — variable row height across the records page. This is intentional (POG line is a "this game had a standout" signal); 2B-C should NOT try to "fix" it during build with a placeholder or fixed-height shim.

**25. Quarter score display on GameLogRow = inline secondary line below score.** Format: `Q1 8-7 · Q2 12-9 · Q3 6-5 · Q4 6-7` muted, matches the two-line pattern from 3d-g.4 TeamRow. Renders only when `quarter_scores` is non-null.

### Form UX

**26. Score input mobile UX.** All score inputs use `<input type="number" inputMode="numeric" pattern="[0-9]*">` so iOS shows the number pad. 44px tap targets minimum on form buttons. Coach is entering scores postgame on a phone in a noisy gym; the form has to land shipping-ready for that environment.

**27. Opponent name pre-fill.** Score entry sheet pre-fills the opponent name field from `event.opponent` (existing column). Editable — coach can override at game time when "TBD" resolves to a real team name.

**28. POG dropdown for backfill = current roster + footer note.** Backfill queue (Wave 2E) entry sheets show the team's *current* roster in the POG dropdown, not the historical roster as of the event date. Footer note: *"Showing current roster. If a player has since left the team, note them in the highlight field."* Spring 2026 turnover is low; historical-roster temporal queries are 2027-season concern.

### Concurrency + workflow

**29. Concurrent edit handling = last-write-wins.** Two admins editing the same game simultaneously: both edits log to the audit table; second edit overwrites first in `game_results`; audit history reveals the divergence. No optimistic concurrency check, no lock-out warnings — over-engineering for v1.

**30. Pre-merge gate per CLAUDE.md §16.13.** Each Wave 2 sub-wave verifies the 10-item Elite Stack checklist before push: optimistic UI, density-aware, kindness microcopy, accessibility, notification cadence, translation-extractable, privacy locks, audit trail, presence toast, performance budget. Required for merge.

### Procedural locks

**31. Wave 2 follows the 3d-b.1 hotfix pattern.** Sub-wave hotfixes (e.g., 2B-C.1, 2D.1) are fine when smoke testing surfaces gaps. Hotfix scope = single-line or single-component fix on the just-shipped wave; anything bigger is its own sub-wave.

**32. EMBER_MASTER_INDEX_v3.md tracked in git from this commit forward.** Previously untracked. Wave 2 IA Map v1 landing committed it; v1.1 keeps it tracked.

**33. `.gitignore` enforces the explicit-add discipline.** `rides-audit-source.zip` and `WAVE_3A_PROMPT_v2.md` (the persistent "stay untracked" items from Wave 3d build queue notes) move into `.gitignore`. The discipline is enforced by the file, not by hand. Hard Rule #9 in master index updated to match (`git add` per file, not `-A`).

---

## Deferred (explicit non-scope)

- Per-player box score (points / rebounds / assists per player)
- Tournament batch-entry view
- Push notifications (Wave 10 territory)
- Per-game rule overrides (per-game rules migration, number TBD)
- Statement Win / Run of Play editorial pills (Wave 4 conversation)
- Highlight cards, multi-paragraph game recaps (Wave 4)
- Rotation Planner integration (Phase 2 separate scope; minutes data feeds in later)
- Multi-tenant `/records` (Phase 7-B)
- Coach home page build (separate wave; Wave 2E ships standalone route)
- Tournament rules JSONB column (per-game rules migration)
- Historical-roster POG dropdown for backfill (per Decision 28; 2027-season concern)
- `useOrgTeamRecords` `useRefetchOnVisible` wiring (post-Wave 2 cleanup; per Decision 15 + audit item E2)
- **Tournament UI tabs (Games / Roster / Messages / Scenarios)** — named-deferred to **Wave 5 — Tournament UI** per master-index Decision #105 (May 1, 2026). The 4 stub tabs on TournamentDetailPage previously referenced session names (`2B-β`, `2B-γ`, `2B-δ`, `2C`) that became stale when v1.1 narrowed Wave 2 to Coach Quick-Score; microcopy updated to point at Wave 5 in the same docs commit as this amendment.

---

## Pre-flight checklist (run before Wave 2A)

Run via Supabase MCP. Report findings before drafting Migration NNN. Each item has an "if surprising" exposure note so Frank knows what changes when an answer doesn't match assumption.

**0. MIGRATION NUMBER.** `SELECT MAX(version) FROM supabase_migrations.schema_migrations` (or list `\dt supabase_migrations.*`). Determines next migration number.
- *If surprising:* if no `supabase_migrations` schema/table exists in this project's setup, fall back to inspecting the `supabase/migrations/` directory in the repo for the highest filename prefix.

**1. `game_results` columns + constraints + RLS policies.** Confirm presence of: `quarter_scores` JSONB, `player_of_game_id` UUID, `coach_highlight` TEXT, `published_at` TIMESTAMPTZ, `our_score` INT, `opponent_score` INT, `opponent_name` TEXT, `result` TEXT. Confirm NOT NULL constraints. Confirm existing RLS shape.
- *If surprising:* if `coach_highlight` already has a length CHECK (in some other shape), reconcile rather than add a duplicate. If `opponent_name` doesn't exist, add to Migration NNN scope.

**2. `coaching_assignments` columns + active rows.** Confirm coach permission can be derived from this table. Count active rows for Legacy Hoopers org. Verify coach → team mapping.
- *If surprising:* if no active rows for any current coach, the coach permission gate can't function. Decision 7 needs revision (admin-only until coaching_assignments populated).

**3. `event_type` distinct values.** `SELECT DISTINCT event_type FROM events WHERE org_id = '...';` Confirm which value(s) represent scoreable games.
- *If surprising:* if tournament games carry `event_type='tournament'` instead of `'game'`, Decision 8's filter expands. May also affect Wave 2F's tournament-context detection if tournament events are flat (no parent record).

**4. `events.status` distinct values.** Confirm `'cancelled'` and `'postponed'` are the exclusion targets for backfill.
- *If surprising:* if production uses different status strings (e.g., `'canceled'` US spelling, `'rescheduled'`), update Decision 8's filter.

**5. Existing `game_results` rows for Legacy Hoopers + published vs draft split.** Sets the "needs backfill" expectation.
- *If surprising:* count higher than ~14 means more backfill work than estimated. Lower means some games already have results.

**6. RLS policies on `game_results` today.** What policies exist? Public SELECT for `/records`? Match for the new audit table.
- *If surprising:* if RLS is stricter than expected (e.g., authenticated-only), confirm /records public visibility actually works today and how (likely Migrations 025/028 added the public-read policy).

**7. Tournament context.** `events.tournament_id` FK column exists? `tournaments` table exists? Wave 2F's "Score next game" depends on this.
- *If surprising:* **CRITICAL** — if `events.tournament_id` doesn't exist, Wave 2F is redesigned (or deferred). Tournament games may use `tournament_teams` join table instead, requiring different navigation logic.

**8. Backfill achievement-without-score check.** `SELECT COUNT(*) FROM team_achievements ta WHERE NOT EXISTS (SELECT 1 FROM game_results gr WHERE gr.event_id = ta.event_id AND gr.published_at IS NOT NULL);` (Adapt to actual `team_achievements` schema.) If count > 0, that's data-model inversion: achievements entered before the score they reference. Coach UX should be aware these games may already have partial editorial state.
- *If surprising:* if count is high, Wave 2E backfill UX needs to surface "achievement already exists for this game" as a hint to the coach.

---

## Commit roadmap

Six sub-waves, paced 1-2 commits per session. Total: 4-5 sessions.

Each commit follows Wave 3d discipline:
- Pre-flight inspection before code
- Each touched file ≤150 lines
- Build queue update in same deploy chain
- Lint clean (0 errors), build clean
- Vercel verification after push
- Explicit `git add` per file (per Decision 33; `.gitignore` enforces)
- §16.13 pre-merge gate verification (per Decision 30)

### Wave 2A — Schema + audit table + RLS

- Pre-flight item 0 (migration number) runs first
- Migration NNN: `game_result_edits` table per Decision 22 schema + any column gaps in `game_results` surfaced by pre-flight + `CHECK (char_length(coach_highlight) <= 140)` per Decision 5
- RLS policies: coach + admin write on `game_results` for assigned team; public SELECT on `game_result_edits`
- MCP-verified pre-flight on existing columns + policies before drafting migration text
- Estimated: 1 migration file + 1 build queue entry. No React code.

### Wave 2B-C — Score entry sheet + Save Draft + Publish + edit (combined)

Originally split as 2B (entry/publish) + 2C (edit). Combined per Decision 3 + cross-cutting #1 to avoid an unusable middle state. Final-only mode only; quarter mode lands in Wave 2D.

- New score-entry sheet (modal or sub-route of `/events/:id`)
- Form fields: `our_score`, `opponent_score`, `opponent_name` pre-filled per Decision 27, `result` auto-derived per Decision 16 with hidden override per Decision 17, POG dropdown per Decision 4, `coach_highlight` 140 char per Decision 5
- Numeric input modes per Decision 26
- "Save Draft" → writes `game_results` row with `published_at = NULL`
- "Publish" → sets `published_at = now()`, refreshes `/records`
- Coach permission gate via `coaching_assignments`; admin override per Decision 7
- Estimated: 2-3 React components + 1 hook + page wiring. ~3-4 files.

### Wave 2D — Edit + audit + display

Renumbered from prior 2C/2D split.

- "Edit" button on published GameLogRow (coach + admin only)
- Edit form opens pre-populated from `game_results`, reuses 2B-C's sheet
- Save creates audit row in `game_result_edits` per Decision 22 schema + updates `game_results`
- "Updated by X at Y" inline rendering on GameLogRow when audit rows exist (Decision 11)
- Audit reads via batched pattern per Decision 14
- Anon-readable per Decision 13 — works on `/records` without auth
- POG display per Decision 24 (muted line, variable row height accepted)
- Estimated: 1 React component (Edit form, reuses 2B-C's sheet) + 1 hook for batched audit reads + GameLogRow update.

### Wave 2E — Quarter mode toggle + GameLogRow quarter display

- Toggle on entry sheet: "Final" / "Quarters"
- Quarter mode reveals 4 input pairs (Q1 us/them, Q2, Q3, Q4) with numeric input modes
- Auto-sums to `our_score` / `opponent_score`
- Writes `quarter_scores` JSONB on save
- GameLogRow conditionally renders quarter breakdown per Decision 25 (inline muted line)
- Single commit: write + display together (no half-feature)
- Estimated: entry sheet update + GameLogRow display update. ~2 files.

### Wave 2F — Backfill queue at `/coach/games-to-score`

- New `/coach/games-to-score` route, `<RequireAuth allowedRoles={['coach', 'admin']}>` per Decision 7
- Lists past unscored games per Decision 8 filter
- Each row links to score entry sheet (Wave 2B-C's surface)
- POG dropdown shows current roster + footer note per Decision 28
- Optional badge count on coach-facing nav (if such nav exists)
- Estimated: 1 page + 1 hook + route wiring. ~2-3 files.

### Wave 2G — Multi-game tournament "Score next game" flow

- "Score next game" button on Wave 2D publish/edit success
- Detects `event.tournament_id`, finds next unscored event in same tournament
- Pre-fills `opponent_name` from tournament schedule per Decision 27
- Estimated: small change to publish-success flow + 1 helper for tournament context detection. ~2 files.
- *Conditional on pre-flight item 7 confirming tournament FK shape.*

---

## Wave 2 sequence (visual)

```
2A:    Schema + audit + RLS                          → foundation
2B-C:  Score entry + Save Draft + Publish (combined) → user-shippable
2D:    Edit + audit + display                        → trust + correctness
2E:    Quarter mode + display                        → depth
2F:    Backfill queue at /coach/games-to-score       → catches up the 14 unscored
2G:    Tournament "Score next game" flow             → fast Saturdays
```

Pace: 1-2 commits per session. 4-5 sessions total.

---

## Open questions

**(none — all 28 load-bearing decisions resolved as of v1.1 amendment, April 30, 2026)**

If drafting Wave 2A pre-flight surfaces a new question (e.g., a column doesn't exist where userMemories said it did, or RLS on `game_results` needs to be replaced not extended), surface it here before shipping any code. Drift is the enemy.

---

## Expected path from here

1. Frank approves IA Map v1.1 (or sends back edits)
2. CC runs pre-flight queries via Supabase MCP per the checklist above
3. CC writes Wave 2A prompt (Migration NNN scope locked from pre-flight findings)
4. Frank approves; migration runs via `apply_migration` with GO from Frank
5. Wave 2B-C prompt; commit; Vercel verify
6. Continue 2D → 2E → 2F → 2G

Each wave is its own session opener if needed. Wave 2 is not a single-day shippable feature — pace is 1-2 commits per session, matching Wave 3d's rhythm.

---

## After this document is committed

- Decisions #88-104 appended to `EMBER_MASTER_INDEX_v3.md` (next consecutive slot after Decision 87 from v1)
- Master index `NEXT ACTION QUEUED` updated to point at Wave 2A pre-flight (was stale, pointing at Wave 3a from April 29)
- Master index Hard Rule #9 updated: `git add` per file (not `-A`); `.gitignore` enforces persistent untracked items
- `.gitignore` extended with `rides-audit-source.zip` + `WAVE_3A_PROMPT_v2.md` per Decision 33
- Wave 2 v1.1 amendment note appended to `SKYFIRE_BUILD_QUEUE_v2.md`
- Single docs commit: `docs: Wave 2 IA Map v1.1; .gitignore + master index updates`
- Each Wave 2 sub-wave verifies §16.13 pre-merge gate before push (per Decision 30)

After the docs commit lands, **Wave 2A pre-flight is the next prompt.**
