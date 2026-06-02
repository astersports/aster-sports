-- Closes Wave 3.B #10 P0-2: alignment trigger was unidirectional. The
-- existing team_players_alignment_check (migration 20260505201932) only
-- fires on team_players INSERT/UPDATE — it can't catch:
--   - DELETE from roster_members while an active team_players row still
--     references the (team_id, player_id) pair → orphan active row
--   - UPDATE of roster_members.jersey_number creating divergence from
--     team_players.jersey_number
--
-- This migration adds the reciprocal direction so the alignment lock is
-- symmetric. Same semantics as the existing trigger, run from the other
-- side of the relation.
--
-- Operator note: if you need to deactivate a player, UPDATE team_players
-- status='inactive' first, THEN DELETE the roster_members row (or just
-- leave roster_members in place — it's the registration record).

create or replace function public.tg_roster_members_alignment_check()
returns trigger
language plpgsql
security invoker
set search_path to public
as $function$
begin
  -- DELETE side: block if an active team_players row still references the
  -- (team_id, player_id) pair. Forces operator to deactivate team_players
  -- explicitly before removing the registration.
  if tg_op = 'DELETE' then
    if exists (
      select 1 from public.team_players
      where team_id = old.team_id
        and player_id = old.player_id
        and status = 'active'
    ) then
      raise exception 'cannot DELETE roster_members (% / %) while team_players is still active for that pair. UPDATE team_players status to inactive first.', old.team_id, old.player_id;
    end if;
    return old;
  end if;

  -- UPDATE side (jersey_number divergence): if there's a matching
  -- team_players row with a non-null jersey, the new roster_members
  -- jersey must agree.
  if tg_op = 'UPDATE' and new.jersey_number is not null then
    if exists (
      select 1 from public.team_players tp
      where tp.team_id = new.team_id
        and tp.player_id = new.player_id
        and tp.jersey_number is not null
        and tp.jersey_number is distinct from new.jersey_number::text
    ) then
      raise exception 'roster_members.jersey_number (%) does not match team_players.jersey_number for (% / %). Update both or pick one as truth.', new.jersey_number, new.team_id, new.player_id;
    end if;
    return new;
  end if;

  return new;
end;
$function$;

drop trigger if exists roster_members_alignment_check on public.roster_members;
create trigger roster_members_alignment_check
  before update or delete on public.roster_members
  for each row execute function public.tg_roster_members_alignment_check();

-- AP #23 + #57: explicit revokes on the SECURITY INVOKER trigger function
-- aren't strictly needed (no GRANT given), but make the lockdown loud.
revoke execute on function public.tg_roster_members_alignment_check() from public;
revoke execute on function public.tg_roster_members_alignment_check() from anon;
revoke execute on function public.tg_roster_members_alignment_check() from authenticated;

comment on function public.tg_roster_members_alignment_check() is
  'Reciprocal of tg_team_players_alignment_check. Blocks roster_members DELETE while an active team_players row references the pair; blocks roster_members.jersey_number UPDATE that would diverge from team_players. Closes Wave 3.B #10 P0-2 (bidirectional alignment lock).';

-- Verification:
do $$
declare
  trigger_count int;
begin
  select count(*) into trigger_count
    from pg_trigger
   where tgname = 'roster_members_alignment_check' and not tgisinternal;
  if trigger_count <> 1 then
    raise exception 'reciprocal alignment trigger missing';
  end if;
end $$;
