-- Surface bracket games on the public tournament scoreboard. Bracket games carry
-- placeholder seed labels (e.g. "National Green 1st Place") instead of resolved team
-- FKs until the seed resolves. LEFT JOIN both sides + COALESCE(display_name,
-- placeholder_label, 'TBD') so a null-FK bracket game renders honestly with its
-- TM seed text. is_bracket lets the client flag the row. No fabrication: the
-- placeholder label is TM's literal seed text; 'TBD' only when even that is absent.
-- APPLIED to prod via MCP 2026-06-28 on Frank's go; mirror per AP #21.
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
    'home', COALESCE(h.display_name, dg.home_placeholder_label, 'TBD'),
    'homeScore', dg.home_score,
    'away', COALESCE(a.display_name, dg.away_placeholder_label, 'TBD'),
    'awayScore', dg.away_score,
    'isBracket', dg.is_bracket,
    'venue', CASE WHEN v.id IS NOT NULL
      THEN jsonb_build_object('name', v.name, 'city', v.city, 'state', v.state)
      ELSE NULL END
  ) ORDER BY dg.start_at NULLS LAST, d.name), '[]'::jsonb)
  FROM public.tournaments t
  JOIN public.tournament_divisions d ON d.tournament_id = t.id
  JOIN public.division_games dg ON dg.tournament_division_id = d.id
  LEFT JOIN public.tournament_division_teams h ON h.id = dg.home_division_team_id
  LEFT JOIN public.tournament_division_teams a ON a.id = dg.away_division_team_id
  LEFT JOIN public.venues v ON v.id = dg.venue_id
  WHERE t.id = p_tournament_id AND t.archived_at IS NULL AND public.org_is_public_listed(t.org_id);
$function$;
