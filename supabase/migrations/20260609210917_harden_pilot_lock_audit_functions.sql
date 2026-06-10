-- Hardening: pin guard search_path='' (linter 0011) + revoke EXECUTE from
-- public/anon/authenticated on both trigger functions (AP#57; triggers fire without
-- an EXECUTE grant). Re-asserts the guard body with the pinned search_path.
--
-- AP#21 repo-mirror parity. APPLIED IN PROD via MCP last session (registered as
-- 20260609210917). DO NOT re-apply / hand-run. End-state-faithful; verified this
-- session via pg_get_functiondef + proacl (both functions execute as postgres +
-- service_role only; public/anon/authenticated revoked; triggers fire regardless).

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

revoke all on function public.guard_pilot_cutover() from public, anon, authenticated;
revoke all on function public.audit_org_settings_change() from public, anon, authenticated;
