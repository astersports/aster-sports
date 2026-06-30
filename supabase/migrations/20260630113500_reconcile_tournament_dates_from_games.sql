-- Self-heal a tournament's date span to cover its actual games. The
-- TourneyMachine importer (aau-ingest-tournament) writes tournaments.start_date
-- /end_date from the scraped Tournament.aspx summary page, which can understate
-- a multi-week league (Westchester Summer League scraped Jun 23-26 but runs to
-- Aug 18) — and rewrites them on EVERY ingest, clobbering any manual fix. This
-- statement-level trigger extends the tournament span to cover every division
-- game, so the dates correct themselves on each ingest regardless of what the
-- importer wrote. Extend-only (LEAST/GREATEST): never contracts a span, so an
-- intentionally wider scraped window is preserved and a deleted game never
-- shrinks the range. NY-anchored date extraction (the public Hub renders NY).
--
-- Applied to prod via MCP 2026-06-30 (mirror file per AP #21). Verified: setting
-- end_date back to the scraped value and touching a game self-heals to the true
-- max game date.

CREATE OR REPLACE FUNCTION public.reconcile_tournament_dates_from_games()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH affected AS (
    SELECT DISTINCT td.tournament_id AS tid
    FROM changed_games r
    JOIN public.tournament_divisions td ON td.id = r.tournament_division_id
  ),
  spans AS (
    SELECT td.tournament_id AS tid,
           MIN((dg.start_at AT TIME ZONE 'America/New_York')::date) AS g_start,
           MAX((dg.start_at AT TIME ZONE 'America/New_York')::date) AS g_end
    FROM public.tournament_divisions td
    JOIN public.division_games dg ON dg.tournament_division_id = td.id
    WHERE td.tournament_id IN (SELECT tid FROM affected)
    GROUP BY td.tournament_id
  )
  UPDATE public.tournaments t
  SET start_date = LEAST(t.start_date, s.g_start),
      end_date   = GREATEST(t.end_date, s.g_end)
  FROM spans s
  WHERE t.id = s.tid
    AND s.g_start IS NOT NULL
    AND (t.start_date <> LEAST(t.start_date, s.g_start)
         OR t.end_date <> GREATEST(t.end_date, s.g_end));
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reconcile_tournament_dates_from_games() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reconcile_tournament_dates_from_games() FROM anon;

DROP TRIGGER IF EXISTS trg_reconcile_tournament_dates_ins ON public.division_games;
DROP TRIGGER IF EXISTS trg_reconcile_tournament_dates_upd ON public.division_games;
DROP TRIGGER IF EXISTS trg_reconcile_tournament_dates_del ON public.division_games;

CREATE TRIGGER trg_reconcile_tournament_dates_ins
  AFTER INSERT ON public.division_games
  REFERENCING NEW TABLE AS changed_games
  FOR EACH STATEMENT EXECUTE FUNCTION public.reconcile_tournament_dates_from_games();

CREATE TRIGGER trg_reconcile_tournament_dates_upd
  AFTER UPDATE ON public.division_games
  REFERENCING NEW TABLE AS changed_games
  FOR EACH STATEMENT EXECUTE FUNCTION public.reconcile_tournament_dates_from_games();

CREATE TRIGGER trg_reconcile_tournament_dates_del
  AFTER DELETE ON public.division_games
  REFERENCING OLD TABLE AS changed_games
  FOR EACH STATEMENT EXECUTE FUNCTION public.reconcile_tournament_dates_from_games();
