-- May 16 audit P2 items #13 + #14: FK CASCADE gaps.
--
-- #13: event_ride_requests.org_id → organizations(id) — was NO ACTION,
-- so deleting an org left orphan ride requests blocking the cleanup.
-- Org delete is a heavyweight tenant teardown; CASCADE matches the
-- discipline used for other event_* tables.
--
-- #14: game_results.player_of_game_id → players(id) — was NO ACTION,
-- so deleting a player blocks if they're a player_of_game on any
-- past recap. Semantics: when a player record is deleted (rare, but
-- legitimate for roster cleanup), the historical game_result row
-- should keep its score + opponent + score; just null out the
-- player_of_game reference. SET NULL is the right rule.

ALTER TABLE event_ride_requests DROP CONSTRAINT event_ride_requests_org_id_fkey;
ALTER TABLE event_ride_requests ADD CONSTRAINT event_ride_requests_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE game_results DROP CONSTRAINT game_results_player_of_game_id_fkey;
ALTER TABLE game_results ADD CONSTRAINT game_results_player_of_game_id_fkey
  FOREIGN KEY (player_of_game_id) REFERENCES players(id) ON DELETE SET NULL;
