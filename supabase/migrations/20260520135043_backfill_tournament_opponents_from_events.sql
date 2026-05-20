-- Frank-flagged 2026-05-20 L99 v6 §5.3 D1. PR #363 wired
-- opponents.head_to_head from game_results via events.opponent_id,
-- but only 12 of 48 games had opponent_id set; the other 30 distinct
-- opponent strings (tournament foes) sat in events.opponent text only.
-- This migration:
-- 1. Inserts the 30 missing opponents into the directory (DISTINCT +
--    NOT EXISTS guards against duplicates; no UNIQUE constraint on
--    (org_id, name) so ON CONFLICT isn't usable here per anti-pattern
--    #25 -- pre-filter via the WHERE clause instead).
-- 2. Backfills events.opponent_id by matching events.opponent text
--    to the new opponents.name.
-- 3. The PR #357 + PR #363 triggers fire on each events UPDATE and
--    recompute head_to_head_wins / head_to_head_losses /
--    last_played_at automatically. No explicit sync call needed.
--
-- Circuit hint: ZG-prefixed tournaments + Rumble for the Ring CT are
-- all AAU circuit; default 'aau' for these.

-- Step 1: insert missing opponents
INSERT INTO public.opponents (org_id, name, circuit)
SELECT DISTINCT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'::uuid, e.opponent, 'aau'
FROM events e
JOIN teams tm ON tm.id = e.team_id
WHERE tm.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND e.opponent IS NOT NULL
  AND e.opponent != ''
  AND e.opponent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM opponents o
    WHERE o.name = e.opponent AND o.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'::uuid
  );

-- Step 2: backfill events.opponent_id from the now-complete directory.
-- The trg_sync_opponent_on_event_update trigger (PR #363) fires on
-- each row update and recomputes the affected opponent's
-- head_to_head_* / last_played_at from game_results.
UPDATE events e
SET opponent_id = o.id
FROM opponents o, teams tm
WHERE e.team_id = tm.id
  AND tm.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND o.org_id = tm.org_id
  AND o.name = e.opponent
  AND e.opponent_id IS NULL;
