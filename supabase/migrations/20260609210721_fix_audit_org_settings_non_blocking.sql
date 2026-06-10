-- Non-blocking audit fix: skip when auth.uid() is null (actor_user_id is NOT NULL),
-- wrap inserts so the audit can never abort the business UPDATE. Re-asserts final body.
--
-- AP#21 repo-mirror parity. APPLIED IN PROD via MCP last session (registered as
-- 20260609210721). DO NOT re-apply / hand-run. End-state-faithful re-assert of
-- audit_org_settings_change; verified this session via pg_get_functiondef.

create or replace function public.audit_org_settings_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_actor uuid := auth.uid();
begin
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
