-- Closes Wave 3.B #10 P0-1: RLS policies bypassing current_user_*() helpers.
--
-- The audit flagged that the players_update_coach policy in migration 022
-- subselects roster_members directly inside its USING/WITH CHECK clauses:
--
--   id IN (SELECT player_id FROM public.roster_members
--          WHERE team_id = ANY(public.current_user_staff_team_ids()))
--
-- The pattern works but mixes helper + direct read, defeats the §11.5
-- "RLS policies never reference roster_members directly" rule, and makes
-- the policy expression harder to reason about + harder to refactor when
-- the canonical source moves off roster_members (already partially done
-- per the player_equipment work).
--
-- Fix: introduce current_user_coached_player_ids() — a SECURITY DEFINER
-- helper that wraps the subselect — and refactor the policy to use it.
-- Sibling of current_user_teammate_player_ids (parent-side, mig 028).

create or replace function public.current_user_coached_player_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(array_agg(distinct rm.player_id), array[]::uuid[])
  from public.roster_members rm
  where rm.team_id = any(public.current_user_staff_team_ids());
$$;

-- AP #23 + #57: explicit revokes; authenticated is the only role
-- with EXECUTE (matches the sibling helpers).
revoke execute on function public.current_user_coached_player_ids() from public;
revoke execute on function public.current_user_coached_player_ids() from anon;
grant  execute on function public.current_user_coached_player_ids() to authenticated;

comment on function public.current_user_coached_player_ids() is
  'Player ids on teams the caller coaches (via team_staff). SECDEF wraps the roster_members read so RLS policies on players can scope to coachable players without subselecting roster_members directly. Sibling of current_user_teammate_player_ids() (parent-side).';

-- Refactor the players_update_coach policy to use the helper.
-- Same predicate, same semantics — just no inline subselect on roster_members.
drop policy if exists "players_update_coach" on public.players;
create policy "players_update_coach" on public.players
  for update
  to authenticated
  using (
    public.user_has_role_in_org(org_id, array['coach'])
    and id = any(public.current_user_coached_player_ids())
  )
  with check (
    public.user_has_role_in_org(org_id, array['coach'])
    and id = any(public.current_user_coached_player_ids())
  );

-- Verification: helper exists + policy got recreated.
do $$
declare
  fn_count int;
  pol_count int;
begin
  select count(*) into fn_count
    from pg_proc
   where proname = 'current_user_coached_player_ids' and pronamespace = 'public'::regnamespace;
  if fn_count <> 1 then
    raise exception 'current_user_coached_player_ids() helper missing';
  end if;

  select count(*) into pol_count
    from pg_policies
   where schemaname = 'public' and tablename = 'players' and policyname = 'players_update_coach';
  if pol_count <> 1 then
    raise exception 'players_update_coach policy missing after refactor';
  end if;
end $$;
