-- Migration: revoke_anon_set_org_auto_notifications
-- As-applied via Supabase MCP 2026-06-09 (version 20260609164149).
-- CC hygiene follow-up to add_set_org_auto_notifications_rpc (kept separate so the
-- architect-authored migration stays byte-exact).
--
-- AP#57 (extends #23): Supabase default privileges auto-grant EXECUTE to anon on
-- new functions despite `revoke all from public`. The companion migration granted
-- EXECUTE to authenticated only; verified post-apply that anon still held EXECUTE
-- (grant chain showed anon:EXECUTE). This closes that gap so the SECDEF admin-writer
-- is not anon-callable via /rest/v1/rpc. Functionally harmless on its own — the
-- body's user_has_role_in_org gate raises 42501 for a null auth.uid() — but
-- defense-in-depth per registered anti-pattern.
revoke execute on function public.set_org_auto_notifications(uuid, jsonb) from public;
revoke execute on function public.set_org_auto_notifications(uuid, jsonb) from anon;

-- post-condition: anon must no longer hold EXECUTE
do $$
begin
  if exists (
    select 1 from information_schema.routine_privileges
    where routine_schema='public' and routine_name='set_org_auto_notifications'
      and grantee='anon' and privilege_type='EXECUTE'
  ) then
    raise exception 'post-check failed: anon still holds EXECUTE';
  end if;
end $$;
