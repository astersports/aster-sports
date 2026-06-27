-- Avoid name collision with the pre-existing app-side get_public_team_schedule(uuid)
-- (events-based, single team id). Rename the AAU tracked-teams (division_games) variant
-- to get_public_aau_team_schedule. Same body as 20260627024824, distinct name.
drop function if exists public.get_public_team_schedule(uuid[]);

create or replace function public.get_public_aau_team_schedule(p_team_ids uuid[])
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(g.row order by g.sort_at nulls last), '[]'::jsonb)
  from (
    select
      dg.start_at as sort_at,
      jsonb_build_object(
        'gameId', dg.id,
        'gameCode', dg.external_game_id,
        'trackedTeamId', tt.id,
        'trackedTeamName', tt.display_name,
        'isHome', dg.home_division_team_id = tt.id,
        'opponent', case when dg.home_division_team_id = tt.id then opp_a.display_name else opp_h.display_name end,
        'myScore', case when dg.home_division_team_id = tt.id then dg.home_score else dg.away_score end,
        'oppScore', case when dg.home_division_team_id = tt.id then dg.away_score else dg.home_score end,
        'status', dg.status,
        'startAt', dg.start_at,
        'court', dg.court,
        'division', d.name,
        'tournamentId', t.id,
        'tournament', t.name,
        'venue', case when v.id is not null then jsonb_build_object(
            'name', v.name, 'address', v.address, 'city', v.city, 'state', v.state,
            'lat', v.lat, 'lng', v.lng
          ) else null end
      ) as row
    from tournament_division_teams tt
    join tournament_divisions d on d.id = tt.tournament_division_id
    join tournaments t on t.id = d.tournament_id
    join division_games dg on (dg.home_division_team_id = tt.id or dg.away_division_team_id = tt.id)
    left join tournament_division_teams opp_h on opp_h.id = dg.home_division_team_id
    left join tournament_division_teams opp_a on opp_a.id = dg.away_division_team_id
    left join venues v on v.id = dg.venue_id
    where tt.id = any(p_team_ids)
      and public.org_is_public_listed(t.org_id)
  ) g;
$$;

revoke execute on function public.get_public_aau_team_schedule(uuid[]) from public;
revoke execute on function public.get_public_aau_team_schedule(uuid[]) from anon;
grant execute on function public.get_public_aau_team_schedule(uuid[]) to anon, authenticated;
