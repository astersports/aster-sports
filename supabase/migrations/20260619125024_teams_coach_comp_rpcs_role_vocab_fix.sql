-- ============================================================================
-- MIRROR of applied migration 20260619125024_teams_coach_comp_rpcs_role_vocab_fix
-- (applied via Supabase MCP 2026-06-19). Byte-faithful (AP #21). This is the
-- FINAL, correct version of assign_team_coach + set_coach_comp (folds in the
-- display_name fix from 20260619124828). Verified end-to-end by the AP#26
-- rolled-back replay: assign → edit (single active comp) → unassign, with
-- team_staff role correctly mapped (head_coach / assistant→assistant_coach /
-- else→manager).
-- ============================================================================

-- Fix 2 for the comp RPCs (caught by the AP#26 replay): team_staff.role CHECK
-- allows head_coach|assistant_coach|manager, while coaching_assignments.role
-- allows head_coach|assistant|team_manager|program_director — two vocabularies.
-- We map comp role -> team_staff role at the boundary (not altering the CHECK,
-- which useOrgCoaches/useTeamHeadCoach read). coaching_assignments keeps the
-- precise comp role; team_staff stores the access-level role. program_director
-- has no team_staff peer → maps to 'manager' for access. Includes the
-- display_name fix from the prior migration (full correct bodies).

create or replace function public.assign_team_coach(
  p_team_id uuid, p_user_id uuid, p_role text,
  p_paid boolean default false, p_rate_cents int default null,
  p_scope text default 'all_events', p_effective_start date default null
) returns void language plpgsql security definer set search_path=public as $fn$
declare v_org uuid; v_name text; v_ts_role text;
begin
  select org_id into v_org from teams where id=p_team_id;
  if v_org is null then raise exception 'TEAM_NOT_FOUND'; end if;
  if not user_has_role_in_org(v_org, array['admin']) then raise exception 'NOT_AUTHORIZED'; end if;
  if p_role not in ('head_coach','assistant','team_manager','program_director') then raise exception 'BAD_ROLE'; end if;
  select display_name into v_name from staff_profiles where user_id=p_user_id and org_id=v_org;
  v_name := coalesce(v_name, 'Coach');
  v_ts_role := case p_role when 'head_coach' then 'head_coach' when 'assistant' then 'assistant_coach' else 'manager' end;
  insert into team_staff(team_id, user_id, role) values (p_team_id, p_user_id, v_ts_role)
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
declare v_org uuid; v_name text; v_ts_role text;
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
  v_ts_role := case p_role when 'head_coach' then 'head_coach' when 'assistant' then 'assistant_coach' else 'manager' end;
  update coaching_assignments set active=false
    where team_id=p_team_id and user_id=p_user_id and active=true and not (role=p_role and scope=p_scope);
  insert into coaching_assignments(org_id, team_id, user_id, display_name, role, scope, pay_per_session_cents, active, effective_start_date)
    values (v_org, p_team_id, p_user_id, v_name, p_role, p_scope, p_rate_cents, true, current_date)
    on conflict (team_id, user_id, role, scope)
    do update set pay_per_session_cents=excluded.pay_per_session_cents, active=true, display_name=excluded.display_name;
  update team_staff set role=v_ts_role where team_id=p_team_id and user_id=p_user_id;
end $fn$;
