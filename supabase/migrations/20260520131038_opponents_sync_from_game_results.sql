-- Frank-reported 2026-05-20 (Opponents page shows "0 games played" for
-- every opponent despite 12 CYO games linked via events.opponent_id).
-- Same anti-pattern class as PR #357 (tournament_teams <- game_results).
--
-- Adds:
-- 1. sync_opponent_record(opponent_id) -- SECURITY DEFINER helper that
--    recomputes head_to_head_wins / head_to_head_losses / last_played_at
--    from current game_results for that opponent
-- 2. AFTER INSERT/UPDATE/DELETE trigger on game_results
-- 3. AFTER UPDATE trigger on events (catches opponent_id flips)
-- 4. One-time backfill across all opponents.
--
-- Scope note: opponent linkage is via events.opponent_id (FK to
-- opponents.id). Events with only a text `opponent` field (no FK) are
-- NOT counted -- these are tournament opponents that aren't yet in the
-- opponents directory. Separate data-hygiene task to import those.

CREATE OR REPLACE FUNCTION public.sync_opponent_record(p_opponent_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wins INT;
  v_losses INT;
  v_last_played TIMESTAMPTZ;
BEGIN
  IF p_opponent_id IS NULL THEN RETURN; END IF;

  SELECT
    COUNT(*) FILTER (WHERE gr.result = 'W'),
    COUNT(*) FILTER (WHERE gr.result = 'L'),
    MAX(e.start_at)
  INTO v_wins, v_losses, v_last_played
  FROM game_results gr
  JOIN events e ON e.id = gr.event_id
  WHERE e.opponent_id = p_opponent_id
    AND gr.published_at IS NOT NULL;

  UPDATE opponents
  SET
    head_to_head_wins = COALESCE(v_wins, 0),
    head_to_head_losses = COALESCE(v_losses, 0),
    last_played_at = v_last_played
  WHERE id = p_opponent_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_opponent_record(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_opponent_record(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.trg_sync_opponent_from_game_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_opponent_id UUID;
  v_old_opponent_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_event_id := OLD.event_id;
  ELSE
    v_event_id := NEW.event_id;
  END IF;

  SELECT opponent_id INTO v_opponent_id FROM events WHERE id = v_event_id;
  IF v_opponent_id IS NOT NULL THEN
    PERFORM sync_opponent_record(v_opponent_id);
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.event_id IS DISTINCT FROM OLD.event_id THEN
    SELECT opponent_id INTO v_old_opponent_id FROM events WHERE id = OLD.event_id;
    IF v_old_opponent_id IS NOT NULL THEN
      PERFORM sync_opponent_record(v_old_opponent_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_opponent_on_game_result ON game_results;
CREATE TRIGGER trg_sync_opponent_on_game_result
AFTER INSERT OR UPDATE OR DELETE ON game_results
FOR EACH ROW EXECUTE FUNCTION trg_sync_opponent_from_game_result();

CREATE OR REPLACE FUNCTION public.trg_sync_opponent_from_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.opponent_id IS DISTINCT FROM OLD.opponent_id THEN
    IF NEW.opponent_id IS NOT NULL THEN
      PERFORM sync_opponent_record(NEW.opponent_id);
    END IF;
    IF OLD.opponent_id IS NOT NULL THEN
      PERFORM sync_opponent_record(OLD.opponent_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_opponent_on_event_update ON events;
CREATE TRIGGER trg_sync_opponent_on_event_update
AFTER UPDATE OF opponent_id ON events
FOR EACH ROW EXECUTE FUNCTION trg_sync_opponent_from_event();

-- One-time backfill: bring every existing opponents row in sync.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM opponents LOOP
    PERFORM sync_opponent_record(r.id);
  END LOOP;
END $$;

COMMENT ON FUNCTION public.sync_opponent_record(UUID) IS 'Recomputes opponents.head_to_head_wins / head_to_head_losses / last_played_at for one opponent from published game_results linked via events.opponent_id. Migration 20260520131038 backfill ran across all existing rows.';
