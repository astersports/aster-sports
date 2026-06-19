-- ============================================================================
-- MIRROR of applied migration 20260619123536_teams_coach_comp_rpcs
-- (applied via Supabase MCP 2026-06-19 on Frank's GO). Byte-faithful to
-- production; CC does not edit this, it is a mirror (AP #21). Verified live by
-- CC 2026-06-19: all 3 SECURITY DEFINER, search_path=public pinned, EXECUTE to
-- authenticated only (anon has no EXECUTE — confirmed via has_function_privilege).
-- ============================================================================

-- Teams redesign PR-2 Part B: coach assignment + comp action layer.
-- 3 SECURITY DEFINER RPCs, admin-only (comp is admin money; roster RPCs were
-- admin|coach). Each writes team_staff (access) and/or coaching_assignments
-- (comp) so the two tables cannot drift (the finding that motivated this PR:
-- a team_staff row with no rate let a coach work unpaid silently).
--
-- R1 (verified composite unique key coaching_assignments (team_id,user_id,role,
-- scope)): we keep ONE active comp row per (team, coach). assign/set_comp
-- deactivate any other active (role,scope) rows for the coach on this team,
-- then upsert the target row active — so changing role/scope never leaves a
-- stale active row for stamp_event_coach_pay()'s "highest active rate wins" to
-- mis-pick. Split-scope comp (separate games/practice rates) is intentionally
-- not built yet (architect: no per-event-type rate editor yet).

create or replace function public.assign_team_coach(
  p_team_id uuid, p_user_id uuid, p_role text,
  p_paid boolean default false, p_rate_cents int default null,
  p_scope text default 'all_events', p_effective_start date default null
) returns void language plpgsql security definer set search_path=public as $fn$
declare v_org uuid;
begin
  select org_id into v_org from teams where id=p_team_id;
  if v_org is null then raise exception 'TEAM_NOT_FOUND'; end if;
  if not user_has_role_in_org(v_org, array['admin']) then raise exception 'NOT_AUTHORIZED'; end if;
  if p_role not in ('head_coach','assistant','team_manager','program_director') then raise exception 'BAD_ROLE'; end if;
  -- access row (team_staff) — always written
  insert into team_staff(team_id, user_id, role) values (p_team_id, p_user_id, p_role)
    on conflict (team_id, user_id) do update set role=excluded.role;
  if p_paid then
    if p_scope not in ('all_events','games_only','practices_only') then raise exception 'BAD_SCOPE'; end if;
    if coalesce(p_rate_cents,0) <= 0 then raise exception 'RATE_MUST_BE_POSITIVE'; end if;
    update coaching_assignments set active=false
      where team_id=p_team_id and user_id=p_user_id and active=true and not (role=p_role and scope=p_scope);
    insert into coaching_assignments(org_id, team_id, user_id, role, scope, pay_per_session_cents, active, effective_start_date)
      values (v_org, p_team_id, p_user_id, p_role, p_scope, p_rate_cents, true, coalesce(p_effective_start, current_date))
      on conflict (team_id, user_id, role, scope)
      do update set pay_per_session_cents=excluded.pay_per_session_cents, active=true, effective_start_date=excluded.effective_start_date;
  else
    -- volunteer: no active rate row (comp state renders "Volunteer", not a missing row)
    update coaching_assignments set active=false
      where team_id=p_team_id and user_id=p_user_id and active=true;
  end if;
end $fn$;

create or replace function public.set_coach_comp(
  p_team_id uuid, p_user_id uuid, p_rate_cents int,
  p_scope text default 'all_events', p_role text default 'head_coach'
) returns void language plpgsql security definer set search_path=public as $fn$
declare v_org uuid;
begin
  select org_id into v_org from teams where id=p_team_id;
  if v_org is null then raise exception 'TEAM_NOT_FOUND'; end if;
  if not user_has_role_in_org(v_org, array['admin']) then raise exception 'NOT_AUTHORIZED'; end if;
  if p_role not in ('head_coach','assistant','team_manager','program_director') then raise exception 'BAD_ROLE'; end if;
  if p_scope not in ('all_events','games_only','practices_only') then raise exception 'BAD_SCOPE'; end if;
  if coalesce(p_rate_cents,0) <= 0 then raise exception 'RATE_MUST_BE_POSITIVE'; end if;
  if not exists (select 1 from team_staff where team_id=p_team_id and user_id=p_user_id) then
    raise exception 'COACH_NOT_ON_TEAM';
  end if;
  update coaching_assignments set active=false
    where team_id=p_team_id and user_id=p_user_id and active=true and not (role=p_role and scope=p_scope);
  insert into coaching_assignments(org_id, team_id, user_id, role, scope, pay_per_session_cents, active, effective_start_date)
    values (v_org, p_team_id, p_user_id, p_role, p_scope, p_rate_cents, true, current_date)
    on conflict (team_id, user_id, role, scope)
    do update set pay_per_session_cents=excluded.pay_per_session_cents, active=true;
  update team_staff set role=p_role where team_id=p_team_id and user_id=p_user_id;
end $fn$;

create or replace function public.remove_team_coach(p_team_id uuid, p_user_id uuid, p_mode text)
returns void language plpgsql security definer set search_path=public as $fn$
declare v_org uuid; v_has_pay boolean;
begin
  select org_id into v_org from teams where id=p_team_id;
  if v_org is null then raise exception 'TEAM_NOT_FOUND'; end if;
  if not user_has_role_in_org(v_org, array['admin']) then raise exception 'NOT_AUTHORIZED'; end if;
  select exists (
    select 1 from event_coach_assignments eca join events e on e.id=eca.event_id
    where eca.coach_user_id=p_user_id and e.team_id=p_team_id and eca.pay_status in ('owed','paid')
  ) into v_has_pay;
  if p_mode='unassign' then
    delete from team_staff where team_id=p_team_id and user_id=p_user_id;
    update coaching_assignments set active=false where team_id=p_team_id and user_id=p_user_id and active=true;
  elsif p_mode='delete' then
    if v_has_pay then raise exception 'COACH_DELETE_BLOCKED'; end if;
    delete from team_staff where team_id=p_team_id and user_id=p_user_id;
    delete from coaching_assignments where team_id=p_team_id and user_id=p_user_id;
  else
    raise exception 'BAD_MODE';
  end if;
end $fn$;

-- Hardening (AP#23/#57): REVOKE FROM PUBLIC is insufficient on Supabase
-- (anon auto-granted), so revoke anon explicitly too; grant authenticated only.
revoke all on function public.assign_team_coach(uuid,uuid,text,boolean,int,text,date) from public;
revoke all on function public.set_coach_comp(uuid,uuid,int,text,text) from public;
revoke all on function public.remove_team_coach(uuid,uuid,text) from public;
revoke all on function public.assign_team_coach(uuid,uuid,text,boolean,int,text,date) from anon;
revoke all on function public.set_coach_comp(uuid,uuid,int,text,text) from anon;
revoke all on function public.remove_team_coach(uuid,uuid,text) from anon;
grant execute on function public.assign_team_coach(uuid,uuid,text,boolean,int,text,date) to authenticated;
grant execute on function public.set_coach_comp(uuid,uuid,int,text,text) to authenticated;
grant execute on function public.remove_team_coach(uuid,uuid,text) to authenticated;
