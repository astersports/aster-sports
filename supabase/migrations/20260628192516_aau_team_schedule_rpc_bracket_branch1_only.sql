-- Simplify the bracket attachment to branch-1 only (supersedes the branch-2 attach
-- in 20260628190330). Branch-1 (the tracked team is one side of the game) already
-- attaches a team's OWN bracket game the moment its seed resolves to it — and the
-- opponent COALESCEs the placeholder label, so a half-resolved final reads honestly
-- as "<team> vs Winner B2 / vs TBD". This:
--   • gives each team its confirmed bracket game with venue (directions + weather),
--   • never shows a team a game it isn't in (no eliminated-team over-attachment, so
--     no client posture-gate needed — H6/H7),
--   • leaves the fully-pre-resolution case to the hero's honest "your bracket game
--     posts here the moment the matchup + tip time are set".
-- isBracket flags the row so the client can badge it.
-- APPLIED to prod via MCP 2026-06-28; mirror per AP #21.
CREATE OR REPLACE FUNCTION public.get_public_aau_team_schedule(p_team_ids text[])
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(jsonb_agg(g.row order by g.sort_at nulls last), '[]'::jsonb)
  from (
    select dg.start_at as sort_at,
      jsonb_build_object(
        'gameId', dg.id, 'gameCode', dg.external_game_id,
        'trackedTeamId', tt.id, 'trackedTeamName', tt.display_name,
        'qkey', public.aau_qkey(tt.resolved_key, d.gender, d.grade_label, d.grade_min, d.grade_max),
        'isHome', dg.home_division_team_id = tt.id,
        'opponent', case when dg.home_division_team_id = tt.id
                         then coalesce(opp_a.display_name, dg.away_placeholder_label)
                         else coalesce(opp_h.display_name, dg.home_placeholder_label) end,
        'myScore', case when dg.home_division_team_id = tt.id then dg.home_score else dg.away_score end,
        'oppScore', case when dg.home_division_team_id = tt.id then dg.away_score else dg.home_score end,
        'status', dg.status, 'startAt', dg.start_at, 'court', dg.court,
        'isBracket', dg.is_bracket,
        'division', d.name, 'tournamentId', t.id, 'tournament', t.name,
        'venue', case when v.id is not null then jsonb_build_object('name',v.name,'address',v.address,'city',v.city,'state',v.state,'lat',v.lat,'lng',v.lng) else null end
      ) as row
    from tournament_division_teams tt
    join tournament_divisions d on d.id = tt.tournament_division_id
    join tournaments t on t.id = d.tournament_id
    join division_games dg on (dg.home_division_team_id = tt.id or dg.away_division_team_id = tt.id)
    left join tournament_division_teams opp_h on opp_h.id = dg.home_division_team_id
    left join tournament_division_teams opp_a on opp_a.id = dg.away_division_team_id
    left join venues v on v.id = dg.venue_id
    where (
        public.aau_qkey(tt.resolved_key, d.gender, d.grade_label, d.grade_min, d.grade_max) = any (p_team_ids)
        or lower(tt.resolved_key) = any (array(select lower(k) from unnest(p_team_ids) as k))
        or tt.external_team_key = any (p_team_ids)
        or tt.id::text = any (p_team_ids)
      )
      and t.archived_at is null
      and public.org_is_public_listed(t.org_id)
  ) g;
$function$;
