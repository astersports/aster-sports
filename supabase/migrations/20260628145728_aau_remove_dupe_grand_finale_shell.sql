-- APPLIED to prod via MCP 2026-06-28 on Frank's explicit go ("investigate all prod tournaments
-- then remove the dupes"); mirror per AP #21.
--
-- Remove the one true duplicate tournament: an empty, archived, tm-less shadow of the live
-- "Zero Gravity NY Grand Finale" (9def04d1, which carries the TM id + 108 live games and is
-- refreshed by the aau-live-score-poll cron). The shell 63bd2dd7 has 0 games and 0 platform
-- refs (0 events/rosters/comms/achievements/scenarios) — only 13 empty divisions / 69 external
-- team rows / 16 pools, which cascade-delete cleanly. The hub already hides it
-- (get_public_tournament_directory filters archived_at IS NULL + dedups by name+start_date),
-- so this is pure DB hygiene. Guarded: refuses to fire unless the row is the expected empty
-- archived tm-less shell, so it can never delete the live tournament by mistake.
--
-- Investigation note (why this is the ONLY removable dupe): the 8 Legacy-Hoopers-org (e3e95e21)
-- same-named tournaments are NOT dupes and are NOT touched here — they are the pilot tenant's
-- real platform tournaments (real events, rosters, championship_scenarios) that merely share
-- names with the public scraped copies under the directory org (a51e2a00). Deleting them would
-- cascade-wipe live roster/scenario data.
DO $$
DECLARE
  v_id uuid := '63bd2dd7-069a-4e38-9e28-0bc54e30a165';
  v_archived boolean;
  v_tm text;
  v_games int;
BEGIN
  SELECT archived_at IS NOT NULL, tm_id_tournament
    INTO v_archived, v_tm
  FROM public.tournaments WHERE id = v_id;
  IF NOT FOUND THEN
    RAISE NOTICE 'tournament % already absent — no-op', v_id;
    RETURN;
  END IF;
  SELECT count(*) INTO v_games
  FROM public.division_games dg
  JOIN public.tournament_divisions td ON td.id = dg.tournament_division_id
  WHERE td.tournament_id = v_id;
  IF v_tm IS NOT NULL OR NOT v_archived OR v_games > 0 THEN
    RAISE EXCEPTION 'guard tripped: % is not the expected empty archived shell (tm=%, archived=%, games=%) — refusing to delete',
      v_id, v_tm, v_archived, v_games;
  END IF;
  DELETE FROM public.tournaments WHERE id = v_id; -- cascades: divisions, division_teams, pools
  RAISE NOTICE 'removed duplicate Grand Finale shell %', v_id;
END $$;
