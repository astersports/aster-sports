# Wave 2 — Coach Quick-Score IA Map v1

**Status:** Locked April 30, 2026
**Authors:** Frank + Claude (multi-session conversation, April 30, 2026)
**Supersedes:** None (first IA Map for Wave 2)

---

## Purpose

Wave 2 unlocks the records page. Today `/records` is read-only — there is no UI for coaches or admins to enter game results. The 14 already-played Spring 2026 games sit unscored in the database; new games queue up the same way. Wave 2 ships the score-entry pipeline end-to-end:

- Score entry sheet (final-only and quarter-by-quarter modes)
- Save Draft + Publish flow
- Edit + audit trail (CLAUDE.md §16.8 compliant)
- Backfill queue for already-played games
- Multi-game tournament "Score next game" flow

Wave 2 does **not** ship per-player box scores, push notifications, or editorial content (game recaps, highlight cards) — those land in later waves. See **Deferred** section.

---

## Locked decisions (19 total)

### Entry + flow

**1. Entry point.** Coach starts a game-score from the event detail page. Tap an event → "Score game" button. Button visible only to coach (assigned via `coaching_assignments`) + admin.

**2. Score granularity.** Two-mode toggle on the entry sheet. Default is "final score only" for 5-second entry. Quarter-by-quarter mode available via toggle for coaches who want it.

**3. Publish flow.** Save as draft (`published_at = NULL`), separate Publish button. Coach reviews POG + highlight before going live to parents. Both buttons live in the same form from day one — Wave 2B-C ships them combined to avoid an unusable middle state where coaches can save but parents see nothing.

**4. Player-of-the-game.** Optional dropdown on the entry form, defaults to no selection. No prompt or modal — coach picks during entry or skips. Single form, single mental model.

**5. Coach highlight.** 140-character short note. Substantial enough to matter, fast enough to type postgame. Stored in `game_results.coach_highlight`.

**6. Per-player stats.** NONE for v1. Game stats per-player explicitly out of scope per CLAUDE.md §16.12 ("Game stats per-player allowed in 2026? NO"). Box score is its own future wave (post-2026). Wave 2 ships team-level scores + POG only.

**7. Permission.** Coach (assigned via `coaching_assignments`) + admin. Not assistant coach (Darien) — admin override always works for any coverage gap.

**8. Backfill queue.** Already-played games appear in a "Needs scoring" queue at `/coach/games-to-score` (its own route, not coach-home-embedded — coach-home build is its own wave). Filter: `start_at < now AND status NOT IN ('cancelled', 'postponed') AND event_type = 'game' AND no game_results row`.

**9. Per-game rules.** Defer to Migration 015 (when it lands). Wave 2 does not ask the coach about quarter length, FT line, or any rule overrides.

**10. Push notifications.** NONE for v1. Parents discover on next app open. Push setup is its own scope (Capacitor + APNs/FCM + Phase 5 / Wave 10 territory).

### Edit + audit

**11. Edit-after-publish: allowed.** Logged to a new `game_result_edits` audit table (schema decision in Wave 2A pre-flight). Parent-visible "Updated by Coach Kenny at 4:47 PM" appears inline on the GameLogRow when edits exist. Per CLAUDE.md §16.8: every override is timestamped, author-tagged, surfaced.

**12. Audit table is public-readable from day one.** RLS on `game_result_edits` allows anon SELECT, matching `game_results` (public RLS via Migrations 025/028). Coach names already public via `/teams` and tournament cards — exposing edit author on `/records` introduces no new visibility risk. No retrofit later.

**13. Result auto-derivation.** Derive from `our_score` vs `opponent_score` on save (us > them = W, < them = L, equal = T). Coach can override via radio when math is wrong (forfeit wins, technical losses, etc.). Override is rare; auto-derive is the default.

**14. Multi-game tournament flow.** "Score next game" button on save success. If the coach is in a tournament event (`event.tournament_id IS NOT NULL`), button jumps to the next unscored game in the same tournament. Sequential per-game flow; no batch-entry view in v1.

**15. `quarter_scores` JSONB shape.** Stays NULL when coach uses final-only mode. Only populated when quarter mode is selected. `/records` GameLogRow renders quarter breakdown only when the column is non-null — quarter display ships in Wave 2D as part of the same commit as the data write (no half-feature).

### Data model

**16. Use existing `game_results` table.** Pre-flight verifies the column inventory. Expected per-userMemories: `quarter_scores` JSONB, `player_of_game_id`, `coach_highlight`, `published_at`, `our_score`, `opponent_score`, `result`. Any column gaps surface during Wave 2A pre-flight and are added in the same migration.

**17. `published_at` controls visibility on `/records`.** NULL = draft / unpublished. Set timestamp = published. Existing convention from Migrations 025/028.

**18. Migration NNN scope.** Adds `game_result_edits` audit table + any column gaps surfaced by pre-flight + RLS policies (write for assigned coach + admin, public SELECT for audit table). Migration number TBD by pre-flight item 0 — userMemories said "014" but production is past 028 + 14 timestamped migrations (per master index Decision 64). Real number is in the 040s+.

### Procedural locks

**19. EMBER_MASTER_INDEX_v3.md is tracked in git from this commit forward.** Previously untracked per build queue's recurring "stay untracked" footnote. Living untracked is technical debt for the canonical decisions doc. Wave 2 IA Map landing commit is the moment it joins the repo.

---

## Deferred (explicit non-scope)

- Per-player box score (points / rebounds / assists per player)
- Tournament batch-entry view
- Push notifications (Wave 10 territory)
- Per-game rule overrides (Migration 015 territory)
- Statement Win / Run of Play editorial pills (Wave 4 conversation)
- Highlight cards, multi-paragraph game recaps (Wave 4)
- Rotation Planner integration (Phase 2 separate scope; minutes data feeds in later)
- Multi-tenant `/records` (Phase 7-B)
- Coach home page build (separate wave)
- Tournament rules JSONB column (Migration 015)

---

## Pre-flight checklist (run before Wave 2A)

Run via Supabase MCP. Report findings before drafting Migration NNN.

**0. MIGRATION NUMBER.** `SELECT MAX(version) FROM supabase_migrations.schema_migrations` (or `\dt supabase_migrations.*` to inspect). Determines the next migration number. Wave 2A migration text uses that number, not "014" or any asserted value.

1. **`game_results` columns + constraints + RLS policies.** Confirm presence of: `quarter_scores` JSONB, `player_of_game_id` UUID, `coach_highlight` TEXT, `published_at` TIMESTAMPTZ, `our_score` INT, `opponent_score` INT, `opponent_name` TEXT, `result` TEXT. Confirm NOT NULL constraints. Confirm existing RLS (likely from Migration 010 + 025 + 028).

2. **`coaching_assignments` columns + active rows.** Confirm coach permission can be derived from this table. Count active rows for Legacy Hoopers org. Verify coach → team mapping.

3. **`event_type` values used in production.** Confirm `'game'` is the filter target for backfill queue (vs `'practice'`, `'tournament'`, etc.). `SELECT DISTINCT event_type FROM events WHERE org_id = '...';`

4. **Event status values.** Confirm `'cancelled'` and `'postponed'` are the exclusion targets for backfill. `SELECT DISTINCT status FROM events WHERE org_id = '...';`

5. **Existing `game_results` rows for Legacy Hoopers.** Count + how many have `published_at` set vs NULL. Sets the "needs backfill" expectation. Per Wave 3d-d MCP queries: 27 rows × 5 teams currently with `published_at` set, all from prior backfill work.

6. **`game_results` RLS today.** What policies exist? Public SELECT for `/records`? Match the same shape for `game_result_edits`.

7. **Tournament context.** `events` table has `tournament_id` FK? `tournaments` table exists? Wave 2F's "Score next game" depends on this.

---

## Commit roadmap

Six sub-waves, paced 1-2 commits per session. Total: 4-5 sessions.

Each commit follows Wave 3d discipline:
- Pre-flight inspection before code
- Each touched file ≤150 lines
- Build queue update in same deploy chain
- Lint clean (0 errors), build clean
- Vercel verification after push
- Explicit `git add` per file, no `-A`

### Wave 2A — Schema + audit table + RLS

- Pre-flight item 0 (migration number) runs first
- Migration NNN: `game_result_edits` audit table + any column gaps in `game_results` surfaced by pre-flight items 1-2
- RLS policies: coach + admin write on `game_results` for assigned team; public SELECT on `game_result_edits` to match `game_results`
- MCP-verified pre-flight on existing columns + policies before drafting migration text
- Estimated: 1 migration file + 1 build queue entry. No React code.

### Wave 2B — Score entry sheet + Save Draft + Publish flow (combined)

- New score-entry sheet (modal or sub-route of `/events/:id`)
- Form fields: `our_score`, `opponent_score`, `opponent_name` (text), `result` (auto-derive + override radio per Decision 13), POG dropdown (per Decision 4), `coach_highlight` (140 char per Decision 5)
- "Save Draft" button → writes `game_results` row with `published_at = NULL`
- "Publish" button → sets `published_at = now()`, refreshes `/records`
- Coach permission gate via `coaching_assignments`; admin override
- Final-only mode only; quarter mode lands in Wave 2D
- Estimated: 2-3 React components + 1 hook + page wiring. ~3-4 files.

### Wave 2C — Edit + audit

- "Edit" button on published GameLogRow (coach + admin only)
- Edit form opens pre-populated from `game_results`
- Save creates audit row in `game_result_edits` + updates `game_results`
- "Updated by X at Y" inline rendering on GameLogRow when audit rows exist (per Decision 11)
- Anon-readable per Decision 12 — works on the public `/records` page without auth
- Estimated: 1 React component (Edit form, likely reuses 2B's sheet) + 1 hook for audit reads + GameLogRow update.

### Wave 2D — Quarter mode toggle + GameLogRow quarter display

- Toggle on entry sheet: "Final" / "Quarters"
- Quarter mode reveals 4 input pairs (Q1 us/them, Q2, Q3, Q4)
- Auto-sums to `our_score` / `opponent_score`
- Writes `quarter_scores` JSONB on save
- GameLogRow conditionally renders quarter breakdown when column non-null (per Decision 15)
- Single commit: write + display together (no half-feature)
- Estimated: entry sheet update + GameLogRow display update. ~2 files.

### Wave 2E — Backfill queue at `/coach/games-to-score`

- New `/coach/games-to-score` route
- Lists past unscored games per filter from Decision 8
- Each row links to score entry sheet (Wave 2B's surface)
- Optional badge count on coach-facing nav (if such nav exists in current build)
- Coach + admin only
- Estimated: 1 page + 1 hook + route wiring. ~2-3 files.

### Wave 2F — Multi-game tournament "Score next game" flow

- "Score next game" button on Wave 2C/2B publish success
- Detects `event.tournament_id`, finds next unscored event in same tournament
- Pre-fills `opponent_name` from tournament schedule when available
- Estimated: small change to publish-success flow + 1 helper for tournament context detection. ~2 files.

---

## Wave 2 sequence (visual)

```
2A: Schema + audit + RLS               → foundation
2B: Score entry + Save Draft + Publish → user-shippable
2C: Edit + audit                       → trust + correctness
2D: Quarter mode + display             → depth
2E: Backfill queue                     → catches up the 14 unscored
2F: Tournament flow                    → makes Saturdays fast
```

Pace: 1-2 commits per session. 4-5 sessions total.

---

## Open questions

**(none — all 19 load-bearing decisions resolved as of April 30, 2026)**

If drafting Wave 2A pre-flight surfaces a new question (e.g., a column doesn't exist where userMemories said it did, or RLS on `game_results` needs to be replaced not extended), surface it here before shipping any code. Drift is the enemy.

---

## Expected path from here

1. Frank approves IA Map v1 (or sends back edits)
2. CC runs pre-flight queries via Supabase MCP per the checklist above
3. CC writes Wave 2A prompt (Migration NNN scope locked from pre-flight findings)
4. Frank approves; migration runs via `apply_migration` with GO from Frank
5. Wave 2B prompt; commit; Vercel verify
6. Continue 2C → 2D → 2E → 2F

Each wave is its own session opener if needed. Wave 2 is not a single-day shippable feature — pace is 1-2 commits per session, matching Wave 3d's rhythm.

---

## After this document is committed

- Decisions #69-87 appended to `EMBER_MASTER_INDEX_v3.md` (next consecutive slot after Decision 68)
- `EMBER_MASTER_INDEX_v3.md` joins git tracking (Decision 19 above)
- "Wave 2 — Coach Quick-Score" section appended to `SKYFIRE_BUILD_QUEUE_v2.md` listing the 6 sub-waves
- Single docs commit: `docs: lock Wave 2 IA Map v1; track master index`
- Push v2 → merge to main → push main → Vercel verifies docs deploy

After the docs commit lands, **Wave 2A pre-flight is the next prompt.**
