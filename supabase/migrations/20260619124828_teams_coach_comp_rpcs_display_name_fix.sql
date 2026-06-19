-- ============================================================================
-- MIRROR of applied migration 20260619124828_teams_coach_comp_rpcs_display_name_fix
-- (applied via Supabase MCP 2026-06-19). Byte-faithful (AP #21).
-- NOTE: this is the FIRST of two fixes to 20260619123536 — it adds display_name
-- but does NOT yet map the team_staff role vocabulary; the AP#26 replay then
-- caught the role-CHECK mismatch and 20260619125024 supersedes these bodies.
-- ============================================================================

-- Fix for 20260619123536_teams_coach_comp_rpcs: coaching_assignments.display_name
-- is NOT NULL with no default — the original INSERT omitted it and failed at
-- runtime (AP#18: NOT NULL validates at INSERT even when conflict routes to
-- UPDATE; caught by the AP#26 replay before any UI shipped). Both writers now
-- stamp display_name from staff_profiles (coalesced to 'Coach'). remove_team_coach
-- is unaffected (no coaching_assignments INSERT) and is not re-created here.

create or replace function public.assign_team_coach(
  p_team_id uuid, p_user_id uuid, p_role text,
  p_paid boolean default false, p_rate_cents int default null,
  p_scope text default 'all_events', p_effective_start date default null
) returns void language plpgsql security definer set search_path=public as $fn$
declare v_org uuid; v_name text;
begin
  select org_id into v_org from teams where id=p_team_id;
  if v_org is null then raise exception 'TEAM_NOT_FOUND'; end if;
  if not user_has_role_in_org(v_org, array['admin']) then raise exception 'NOT_AUTHORIZED'; end if;
  if p_role not in ('head_coach','assistant','team_manager','program_director') then raise exception 'BAD_ROLE'; end if;
  select display_name into v_name from staff_profiles where user_id=p_user_id and org_id=v_org;
  v_name := coalesce(v_name, 'Coach');
  insert into team_staff(team_id, user_id, role) values (p_team_id, p_user_id, p_role)
    on conflict (team_id, user_id) do update set role=excluded.role;
  if p_paid then
    if p_scope not in ('all_events','games_only','practices_only') then raise exception 'BAD_SCOPE'; end if;
    if coalesce(p_rate_cents,0) <= 0 then raise exception 'RATE_MUST_BE_POSITIVE'; end if;
    update coaching_assignments set active=false
      where team_id=p_team_id and user_id=p_user_id and active=true and not (role=p_role and scope=p_scope);
    insert into coaching_assignments(org_id, team_id, user_id, display_name, role, scope, pay_per_session_cents, active, effective_start_date)
      values (v_org, p_team_id, p_user_id, v_name, p_role, p_scope, p_rate_cents, true, coalesce(p_effective_start, current_date))
      on conflict (team_id, user_id, role, scope)
      do update set pay_per_session_cents=excluded.pay_per_session_cents, active=true, effective_start_date=excluded.effective_start_date, display_name=excluded.display_name;
  else
    update coaching_assignments set active=false
      where team_id=p_team_id and user_id=p_user_id and active=true;
  end if;
end $fn$;

create or replace function public.set_coach_comp(
  p_team_id uuid, p_user_id uuid, p_rate_cents int,
  p_scope text default 'all_events', p_role text default 'head_coach'
) returns void language plpgsql security definer set search_path=public as $fn$
declare v_org uuid; v_name text;
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
  select display_name into v_name from staff_profiles where user_id=p_user_id and org_id=v_org;
  v_name := coalesce(v_name, 'Coach');
  update coaching_assignments set active=false
    where team_id=p_team_id and user_id=p_user_id and active=true and not (role=p_role and scope=p_scope);
  insert into coaching_assignments(org_id, team_id, user_id, display_name, role, scope, pay_per_session_cents, active, effective_start_date)
    values (v_org, p_team_id, p_user_id, v_name, p_role, p_scope, p_rate_cents, true, current_date)
    on conflict (team_id, user_id, role, scope)
    do update set pay_per_session_cents=excluded.pay_per_session_cents, active=true, display_name=excluded.display_name;
  update team_staff set role=p_role where team_id=p_team_id and user_id=p_user_id;
end $fn$;
