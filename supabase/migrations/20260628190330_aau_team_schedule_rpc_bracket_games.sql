-- Attach a division's unresolved bracket games to each of its tracked teams so the
-- championship shows as a team's next game (with venue → directions + weather) even
-- before the seed resolves to that team. Two branches UNION'd:
--   Branch 1 — games where the tracked team is one side (pool + resolved bracket).
--              opponent now COALESCEs a placeholder label for a half-resolved bracket game.
--   Branch 2 — unresolved bracket games in the team's division NOT yet assigned to it,
--              surfaced as "Championship · vs TBD" (isBracket=true, opponent null,
--              bracketHome/bracketAway carry TM's seed text). The CLIENT gates these by
--              bracket posture so an eliminated team never shows a game it can't play
--              (H6/H7 — no fabrication; the game is real, the gate is honesty).
-- APPLIED to prod via MCP 2026-06-28 on Frank's go; mirror per AP #21.
CREATE OR REPLACE FUNCTION public.get_public_aau_team_schedule(p_team_ids text[])
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(jsonb_agg(g.row order by g.sort_at nulls last), '[]'::jsonb)
  from (
    -- Branch 1: tracked team is one of the two sides.
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

    union all

    -- Branch 2: unresolved bracket games in the team's division, not yet assigned to it.
    select dg.start_at as sort_at,
      jsonb_build_object(
        'gameId', dg.id, 'gameCode', dg.external_game_id,
        'trackedTeamId', tt.id, 'trackedTeamName', tt.display_name,
        'qkey', public.aau_qkey(tt.resolved_key, d.gender, d.grade_label, d.grade_min, d.grade_max),
        'isHome', null,
        'opponent', null,
        'myScore', null, 'oppScore', null,
        'status', dg.status, 'startAt', dg.start_at, 'court', dg.court,
        'isBracket', true,
        'bracketHome', coalesce(opp_h.display_name, dg.home_placeholder_label),
        'bracketAway', coalesce(opp_a.display_name, dg.away_placeholder_label),
        'division', d.name, 'tournamentId', t.id, 'tournament', t.name,
        'venue', case when v.id is not null then jsonb_build_object('name',v.name,'address',v.address,'city',v.city,'state',v.state,'lat',v.lat,'lng',v.lng) else null end
      ) as row
    from tournament_division_teams tt
    join tournament_divisions d on d.id = tt.tournament_division_id
    join tournaments t on t.id = d.tournament_id
    join division_games dg on dg.tournament_division_id = d.id
      and dg.is_bracket
      and (dg.home_division_team_id is null or dg.away_division_team_id is null)
      and dg.home_division_team_id is distinct from tt.id
      and dg.away_division_team_id is distinct from tt.id
      and dg.status is distinct from 'final'
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
