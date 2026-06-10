-- Pilot cutover guard + org_settings audit trigger (end-state faithful mirror).
--
-- AP#21 repo-mirror parity. APPLIED IN PROD via MCP last session (registered in
-- supabase_migrations.schema_migrations as 20260609210514). DO NOT re-apply / hand-run —
-- this file exists only so repo <-> schema_migrations is in parity. End-state-faithful
-- (replaying files 210514 -> 210721 -> 210917 in order reproduces the verified live
-- state); aligned to the registered version string, not a byte-reconstruction of the
-- historical body. Verified this session via pg_get_functiondef + pg_get_triggerdef.

create or replace function public.guard_pilot_cutover()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if old.pilot_test_recipient_email is not null
     and (new.pilot_test_recipient_email is null or new.pilot_test_recipient_email = '') then
    raise exception 'pilot cutover blocked: clearing pilot_test_recipient_email is disabled while pilot is mandatory (drop trigger trg_guard_pilot_cutover to re-enable)';
  end if;
  if old.pilot_mode_enabled is true and new.pilot_mode_enabled is false then
    raise exception 'pilot cutover blocked: disabling pilot_mode_enabled is disabled while pilot is mandatory (drop trigger trg_guard_pilot_cutover to re-enable)';
  end if;
  return new;
end;
$$;

create or replace function public.audit_org_settings_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_actor uuid := auth.uid();
begin
  -- never block the business write: out-of-band/service writes have no app actor,
  -- and actor_user_id is NOT NULL, so skip the audit row in that case.
  if v_actor is null then
    return new;
  end if;
  begin
    if new.pilot_test_recipient_email is distinct from old.pilot_test_recipient_email then
      insert into pii_audit_log(actor_user_id, target_table, target_record_id, field_changed, old_value, new_value, org_id)
      values (v_actor, 'organization_settings', new.id, 'pilot_test_recipient_email', old.pilot_test_recipient_email, new.pilot_test_recipient_email, new.organization_id);
    end if;
    if new.pilot_mode_enabled is distinct from old.pilot_mode_enabled then
      insert into pii_audit_log(actor_user_id, target_table, target_record_id, field_changed, old_value, new_value, org_id)
      values (v_actor, 'organization_settings', new.id, 'pilot_mode_enabled', old.pilot_mode_enabled::text, new.pilot_mode_enabled::text, new.organization_id);
    end if;
    if new.from_email is distinct from old.from_email then
      insert into pii_audit_log(actor_user_id, target_table, target_record_id, field_changed, old_value, new_value, org_id)
      values (v_actor, 'organization_settings', new.id, 'from_email', old.from_email, new.from_email, new.organization_id);
    end if;
    if new.reply_to_email is distinct from old.reply_to_email then
      insert into pii_audit_log(actor_user_id, target_table, target_record_id, field_changed, old_value, new_value, org_id)
      values (v_actor, 'organization_settings', new.id, 'reply_to_email', old.reply_to_email, new.reply_to_email, new.organization_id);
    end if;
  exception when others then
    raise warning 'audit_org_settings_change failed (non-fatal): %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists trg_guard_pilot_cutover on public.organization_settings;
create trigger trg_guard_pilot_cutover
  before update on public.organization_settings
  for each row execute function public.guard_pilot_cutover();

drop trigger if exists trg_audit_org_settings on public.organization_settings;
create trigger trg_audit_org_settings
  after update on public.organization_settings
  for each row execute function public.audit_org_settings_change();
