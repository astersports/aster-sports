-- ============================================================================
-- MIRROR of applied migration 20260619042256_teams_roster_money_rpcs
-- (applied via Supabase MCP 2026-06-19 on Frank's GO). Byte-faithful to
-- production; CC does not edit this, it is a mirror (AP #21). Verified live by
-- CC 2026-06-19: all 6 SECURITY DEFINER, search_path=public pinned, EXECUTE to
-- authenticated only (anon revoked in the companion _revoke_anon migration).
-- ============================================================================

-- PR-0: Teams redesign action layer. 6 SECURITY DEFINER RPCs.
-- Roster RPCs authz admin|coach (matches team_players/roster_members RLS).
-- Money RPCs authz admin (matches financial_* RLS). All scope to org via teams.

create or replace function public.add_roster_member(
  p_team_id uuid, p_player_id uuid, p_roster_type text default 'rostered', p_jersey int default null
) returns uuid language plpgsql security definer set search_path=public as $fn$
declare v_org uuid; v_id uuid;
begin
  select org_id into v_org from teams where id=p_team_id;
  if v_org is null then raise exception 'TEAM_NOT_FOUND'; end if;
  if not user_has_role_in_org(v_org, array['admin','coach']) then raise exception 'NOT_AUTHORIZED'; end if;
  if p_roster_type not in ('rostered','futures') then raise exception 'BAD_ROSTER_TYPE'; end if;
  -- mirror first (team_players activation trigger requires a roster_members row)
  if not exists (select 1 from roster_members where team_id=p_team_id and player_id=p_player_id) then
    insert into roster_members(player_id, team_id, jersey_number) values (p_player_id, p_team_id, p_jersey);
  end if;
  -- then team_players active (jersey set only on fresh insert; re-add keeps existing jersey)
  if exists (select 1 from team_players where team_id=p_team_id and player_id=p_player_id) then
    update team_players set status='active', left_at=null, roster_type=p_roster_type
      where team_id=p_team_id and player_id=p_player_id returning id into v_id;
  else
    insert into team_players(team_id, player_id, roster_type, status, jersey_number, joined_at)
      values (p_team_id, p_player_id, p_roster_type, 'active', p_jersey::text, now()) returning id into v_id;
  end if;
  return v_id;
end $fn$;

create or replace function public.drop_roster_member(p_team_id uuid, p_player_id uuid, p_mode text)
returns void language plpgsql security definer set search_path=public as $fn$
declare v_org uuid; v_season uuid;
begin
  select org_id, season_id into v_org, v_season from teams where id=p_team_id;
  if v_org is null then raise exception 'TEAM_NOT_FOUND'; end if;
  if not user_has_role_in_org(v_org, array['admin','coach']) then raise exception 'NOT_AUTHORIZED'; end if;
  if p_mode = 'inactivate' then
    update team_players set status='inactive', left_at=now()
      where team_id=p_team_id and player_id=p_player_id;
  elsif p_mode = 'hard' then
    if exists (select 1 from financial_transactions where applied_to_player_id=p_player_id and org_id=v_org)
       or exists (select 1 from registrations where player_id=p_player_id and (team_id=p_team_id or program_id=v_season)) then
      raise exception 'ROSTER_HARD_DELETE_BLOCKED';
    end if;
    delete from team_players where team_id=p_team_id and player_id=p_player_id;
    delete from roster_members where team_id=p_team_id and player_id=p_player_id;
  else
    raise exception 'BAD_MODE';
  end if;
end $fn$;

create or replace function public.set_jersey(p_team_id uuid, p_player_id uuid, p_jersey int)
returns void language plpgsql security definer set search_path=public as $fn$
declare v_org uuid;
begin
  select org_id into v_org from teams where id=p_team_id;
  if v_org is null then raise exception 'TEAM_NOT_FOUND'; end if;
  if not user_has_role_in_org(v_org, array['admin','coach']) then raise exception 'NOT_AUTHORIZED'; end if;
  -- clear mirror first so neither alignment trigger sees a mismatch mid-update
  update roster_members set jersey_number=null where team_id=p_team_id and player_id=p_player_id;
  update team_players set jersey_number=p_jersey::text where team_id=p_team_id and player_id=p_player_id;
  update roster_members set jersey_number=p_jersey where team_id=p_team_id and player_id=p_player_id;
end $fn$;

create or replace function public.set_roster_type(p_team_id uuid, p_player_id uuid, p_type text)
returns void language plpgsql security definer set search_path=public as $fn$
declare v_org uuid;
begin
  select org_id into v_org from teams where id=p_team_id;
  if v_org is null then raise exception 'TEAM_NOT_FOUND'; end if;
  if not user_has_role_in_org(v_org, array['admin','coach']) then raise exception 'NOT_AUTHORIZED'; end if;
  if p_type not in ('rostered','futures') then raise exception 'BAD_ROSTER_TYPE'; end if;
  update team_players set roster_type=p_type where team_id=p_team_id and player_id=p_player_id;
end $fn$;

create or replace function public.record_family_transaction(
  p_team_id uuid, p_player_id uuid, p_type text, p_amount_cents int,
  p_method text default null, p_occurred_at timestamptz default now(), p_note text default null
) returns uuid language plpgsql security definer set search_path=public as $fn$
declare v_org uuid; v_season uuid; v_guardian uuid; v_account uuid; v_tx uuid;
begin
  select org_id, season_id into v_org, v_season from teams where id=p_team_id;
  if v_org is null then raise exception 'TEAM_NOT_FOUND'; end if;
  if not user_has_role_in_org(v_org, array['admin']) then raise exception 'NOT_AUTHORIZED'; end if;
  if p_type not in ('payment','refund','adjustment','fee') then raise exception 'BAD_TYPE'; end if;
  if p_type in ('payment','refund','fee') and coalesce(p_amount_cents,0) <= 0 then raise exception 'AMOUNT_MUST_BE_POSITIVE'; end if;
  if p_method is not null and p_method not in ('zelle','venmo','cash','check','stripe','other') then raise exception 'BAD_METHOD'; end if;
  select guardian_id into v_guardian from player_guardians
    where player_id=p_player_id order by is_primary desc nulls last limit 1;
  if v_guardian is null then raise exception 'NO_GUARDIAN_FOR_PLAYER'; end if;
  insert into financial_accounts(org_id, guardian_id, season_id, season_fee_cents, discount_cents)
    values (v_org, v_guardian, v_season, 0, 0)
    on conflict (org_id, guardian_id, season_id) do nothing;
  select id into v_account from financial_accounts
    where org_id=v_org and guardian_id=v_guardian and season_id=v_season;
  insert into financial_transactions(account_id, org_id, transaction_type, amount_cents,
     payment_method, occurred_at, applied_to_player_id, recorded_by, processing_fee_cents, notes)
    values (v_account, v_org, p_type, p_amount_cents, p_method,
     coalesce(p_occurred_at, now()), p_player_id, auth.uid(), 0, p_note)
    returning id into v_tx;
  return v_tx;
end $fn$;

create or replace function public.void_transaction(p_transaction_id uuid)
returns uuid language plpgsql security definer set search_path=public as $fn$
declare v record; v_new uuid;
begin
  select * into v from financial_transactions where id=p_transaction_id;
  if not found then raise exception 'TX_NOT_FOUND'; end if;
  if not user_has_role_in_org(v.org_id, array['admin']) then raise exception 'NOT_AUTHORIZED'; end if;
  if v.reverses_transaction_id is not null then raise exception 'CANNOT_VOID_A_REVERSAL'; end if;
  if exists (select 1 from financial_transactions where reverses_transaction_id=p_transaction_id) then raise exception 'ALREADY_VOIDED'; end if;
  insert into financial_transactions(account_id, org_id, transaction_type, amount_cents,
     payment_method, occurred_at, applied_to_player_id, recorded_by, processing_fee_cents, reverses_transaction_id, notes)
    values (v.account_id, v.org_id, v.transaction_type, v.amount_cents, v.payment_method,
     now(), v.applied_to_player_id, auth.uid(), 0, p_transaction_id, 'void of '||p_transaction_id::text)
    returning id into v_new;
  return v_new;
end $fn$;

revoke all on function public.add_roster_member(uuid,uuid,text,int) from public;
revoke all on function public.drop_roster_member(uuid,uuid,text) from public;
revoke all on function public.set_jersey(uuid,uuid,int) from public;
revoke all on function public.set_roster_type(uuid,uuid,text) from public;
revoke all on function public.record_family_transaction(uuid,uuid,text,int,text,timestamptz,text) from public;
revoke all on function public.void_transaction(uuid) from public;
grant execute on function public.add_roster_member(uuid,uuid,text,int) to authenticated;
grant execute on function public.drop_roster_member(uuid,uuid,text) to authenticated;
grant execute on function public.set_jersey(uuid,uuid,int) to authenticated;
grant execute on function public.set_roster_type(uuid,uuid,text) to authenticated;
grant execute on function public.record_family_transaction(uuid,uuid,text,int,text,timestamptz,text) to authenticated;
grant execute on function public.void_transaction(uuid) to authenticated;
