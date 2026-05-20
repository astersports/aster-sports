-- Frank-reported 2026-05-20 ("Keep records but all updates need to be
-- in sync for scoring and championships"). Today's session manually
-- backfilled Rumble for the Ring CT champions/finalists via MCP after
-- discovering tournament_teams.final_place / final_record_wins /
-- final_record_losses don't auto-update when game_results are
-- published. Caught a second drift case during the audit:
-- WPCYO Spring League 2026 10U Blue stored 0-0 against actual 3-2;
-- 9U Boys stored 0-0 against actual 1-6.
--
-- This migration:
-- 1. Adds sync_tournament_team_record(tournament_id, team_id) — a
--    SECURITY DEFINER helper that recomputes wins/losses/final_place
--    for one (tournament, team) pair from current game_results
-- 2. Adds an AFTER INSERT/UPDATE/DELETE trigger on game_results that
--    fires the helper for the affected (tournament, team)
-- 3. Adds an AFTER UPDATE trigger on events to catch
--    is_championship_final / tournament_id / team_id flips that would
--    re-classify existing game_results
-- 4. One-time backfill: runs the helper across every existing
--    tournament_teams row so production is in sync at migration time
--
-- Championship semantics:
-- - bool_or(is_championship_final AND result='W') -> 'Champions'
-- - bool_or(is_championship_final AND result='L') -> 'Finalists'
-- - Otherwise: PRESERVE existing final_place (don't downgrade a
--   manually-set value like "3rd Place" when no championship final
--   game exists)
--
-- All counts filter on published_at IS NOT NULL — unpublished scores
-- shouldn't move the Records page.

CREATE OR REPLACE FUNCTION public.sync_tournament_team_record(p_tournament_id UUID, p_team_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wins INT;
  v_losses INT;
  v_won_champ_final BOOLEAN;
  v_lost_champ_final BOOLEAN;
  v_new_place TEXT;
BEGIN
  IF p_tournament_id IS NULL OR p_team_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE gr.result = 'W'),
    COUNT(*) FILTER (WHERE gr.result = 'L'),
    bool_or(e.is_championship_final AND gr.result = 'W'),
    bool_or(e.is_championship_final AND gr.result = 'L')
  INTO v_wins, v_losses, v_won_champ_final, v_lost_champ_final
  FROM game_results gr
  JOIN events e ON e.id = gr.event_id
  WHERE e.tournament_id = p_tournament_id
    AND e.team_id = p_team_id
    AND gr.published_at IS NOT NULL;

  IF v_won_champ_final THEN
    v_new_place := 'Champions';
  ELSIF v_lost_champ_final THEN
    v_new_place := 'Finalists';
  ELSE
    v_new_place := NULL; -- COALESCE below preserves existing value
  END IF;

  UPDATE tournament_teams
  SET
    final_record_wins = COALESCE(v_wins, 0),
    final_record_losses = COALESCE(v_losses, 0),
    final_place = COALESCE(v_new_place, final_place)
  WHERE tournament_id = p_tournament_id AND team_id = p_team_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_tournament_team_record(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_tournament_team_record(UUID, UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.trg_sync_tournament_team_from_game_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_tournament_id UUID;
  v_team_id UUID;
  v_old_tournament_id UUID;
  v_old_team_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_event_id := OLD.event_id;
  ELSE
    v_event_id := NEW.event_id;
  END IF;

  SELECT tournament_id, team_id INTO v_tournament_id, v_team_id
  FROM events WHERE id = v_event_id;

  IF v_tournament_id IS NOT NULL AND v_team_id IS NOT NULL THEN
    PERFORM sync_tournament_team_record(v_tournament_id, v_team_id);
  END IF;

  -- On UPDATE where event_id changed, also resync the OLD event's pair.
  IF TG_OP = 'UPDATE' AND NEW.event_id IS DISTINCT FROM OLD.event_id THEN
    SELECT tournament_id, team_id INTO v_old_tournament_id, v_old_team_id
    FROM events WHERE id = OLD.event_id;
    IF v_old_tournament_id IS NOT NULL AND v_old_team_id IS NOT NULL THEN
      PERFORM sync_tournament_team_record(v_old_tournament_id, v_old_team_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_tournament_team_on_game_result ON game_results;
CREATE TRIGGER trg_sync_tournament_team_on_game_result
AFTER INSERT OR UPDATE OR DELETE ON game_results
FOR EACH ROW EXECUTE FUNCTION trg_sync_tournament_team_from_game_result();

CREATE OR REPLACE FUNCTION public.trg_sync_tournament_team_from_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_championship_final IS DISTINCT FROM OLD.is_championship_final
     OR NEW.tournament_id IS DISTINCT FROM OLD.tournament_id
     OR NEW.team_id IS DISTINCT FROM OLD.team_id THEN
    IF NEW.tournament_id IS NOT NULL THEN
      PERFORM sync_tournament_team_record(NEW.tournament_id, NEW.team_id);
    END IF;
    IF OLD.tournament_id IS DISTINCT FROM NEW.tournament_id
       OR OLD.team_id IS DISTINCT FROM NEW.team_id THEN
      IF OLD.tournament_id IS NOT NULL THEN
        PERFORM sync_tournament_team_record(OLD.tournament_id, OLD.team_id);
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_tournament_team_on_event_update ON events;
CREATE TRIGGER trg_sync_tournament_team_on_event_update
AFTER UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION trg_sync_tournament_team_from_event();

-- One-time backfill: bring every existing tournament_teams row into
-- sync with game_results so the Records page shows current state.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tournament_id, team_id FROM tournament_teams LOOP
    PERFORM sync_tournament_team_record(r.tournament_id, r.team_id);
  END LOOP;
END $$;

COMMENT ON FUNCTION public.sync_tournament_team_record(UUID, UUID) IS 'Recomputes tournament_teams.final_record_wins / final_record_losses / final_place for one (tournament, team) pair from published game_results. Championship logic preserves manually-set final_place (e.g., "3rd Place") when no championship final game exists. Migration 20260520120945 backfill ran across all existing rows.';
