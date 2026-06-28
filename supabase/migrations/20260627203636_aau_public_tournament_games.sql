-- Public per-tournament games feed for the Tournament Detail scoreboard. Returns every game in a
-- public tournament with division + team display names + scores + court + venue + status, ordered
-- by start time. Plane A read only (display names + public scores; no identity key, no PII/child/
-- money). Mirrors the existing public-read RPC conventions (SECURITY DEFINER, org_is_public_listed).
--
-- APPLIED to prod via MCP 2026-06-27 on Frank's "build it now" (Tournament Detail page); mirror per
-- AP #21. Verified: returns 102 games for the live Grand Finale.
CREATE OR REPLACE FUNCTION public.get_public_tournament_games(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'gameId', dg.id,
    'divisionId', d.id,
    'divisionName', d.name,
    'gender', d.gender,
    'gradeLabel', d.grade_label,
    'tier', d.tier,
    'startAt', dg.start_at,
    'court', dg.court,
    'status', dg.status,
    'home', h.display_name,
    'homeScore', dg.home_score,
    'away', a.display_name,
    'awayScore', dg.away_score,
    'venue', CASE WHEN v.id IS NOT NULL
      THEN jsonb_build_object('name', v.name, 'city', v.city, 'state', v.state)
      ELSE NULL END
  ) ORDER BY dg.start_at NULLS LAST, d.name), '[]'::jsonb)
  FROM public.tournaments t
  JOIN public.tournament_divisions d ON d.tournament_id = t.id
  JOIN public.division_games dg ON dg.tournament_division_id = d.id
  JOIN public.tournament_division_teams h ON h.id = dg.home_division_team_id
  JOIN public.tournament_division_teams a ON a.id = dg.away_division_team_id
  LEFT JOIN public.venues v ON v.id = dg.venue_id
  WHERE t.id = p_tournament_id AND t.archived_at IS NULL AND public.org_is_public_listed(t.org_id);
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_tournament_games(uuid) TO anon, authenticated;
