-- AAU: schedule RPC keys on the STABLE resolved_key (architect P0-A durable fix).
-- Was get_public_aau_team_schedule(uuid[]) matching the VOLATILE tournament_division_teams.id,
-- which a re-ingest re-mints -> tracked teams orphan -> zero games -> blank next-up card.
-- Now accept text[] and match resolved_key (case-insensitive) OR external_team_key OR id::text,
-- scoped to the LIVE (non-archived) tournament so existing tracks self-heal across re-ingests.
-- Applied to prod via MCP 2026-06-27 (owner-authorized, pre-onboarding); mirror per AP #21.

drop function if exists public.get_public_aau_team_schedule(uuid[]);

create or replace function public.get_public_aau_team_schedule(p_team_ids text[])
returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(g.row order by g.sort_at nulls last), '[]'::jsonb)
  from (
    select dg.start_at as sort_at,
      jsonb_build_object(
        'gameId', dg.id, 'gameCode', dg.external_game_id,
        'trackedTeamId', tt.id, 'trackedTeamName', tt.display_name,
        'isHome', dg.home_division_team_id = tt.id,
        'opponent', case when dg.home_division_team_id = tt.id then opp_a.display_name else opp_h.display_name end,
        'myScore', case when dg.home_division_team_id = tt.id then dg.home_score else dg.away_score end,
        'oppScore', case when dg.home_division_team_id = tt.id then dg.away_score else dg.home_score end,
        'status', dg.status, 'startAt', dg.start_at, 'court', dg.court,
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
        lower(tt.resolved_key) = any (array(select lower(k) from unnest(p_team_ids) as k))
        or tt.external_team_key = any (p_team_ids)
        or tt.id::text = any (p_team_ids)
      )
      and t.archived_at is null
      and public.org_is_public_listed(t.org_id)
  ) g;
$function$;

revoke execute on function public.get_public_aau_team_schedule(text[]) from public;
grant execute on function public.get_public_aau_team_schedule(text[]) to anon, authenticated;
