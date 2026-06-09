-- Migration: add_set_org_auto_notifications_rpc
-- As-applied via Supabase MCP 2026-06-09 (version 20260609164118).
-- Architect-authored (A2 sign-off 2026-06-09); CC committed the mirror per AP#21.
--
-- Why this exists: organizations has RLS ON with a SELECT-only policy (no UPDATE
-- policy), so an authenticated client cannot UPDATE organizations.auto_notifications
-- directly — the write is denied at runtime. This SECURITY DEFINER, admin-gated,
-- merged-write RPC is the only client write path for the AutoNotificationSettingsForm
-- (A2). The SQL `||` merge protects sibling auto_notifications keys; the role gate
-- enforces admin-only SERVER-SIDE (not just by hiding the mount).
create or replace function public.set_org_auto_notifications(p_org_id uuid, p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_result jsonb;
begin
  if not public.user_has_role_in_org(p_org_id, array['admin']) then
    raise exception 'not authorized to update org notifications' using errcode = '42501';
  end if;
  if p_patch is null or jsonb_typeof(p_patch) is distinct from 'object' then
    raise exception 'patch must be a json object' using errcode = '22023';
  end if;
  update public.organizations
     set auto_notifications = coalesce(auto_notifications, '{}'::jsonb) || p_patch
   where id = p_org_id
   returning auto_notifications into v_result;
  if v_result is null then
    raise exception 'org not found' using errcode = 'P0002';
  end if;
  return v_result;
end $$;

revoke all on function public.set_org_auto_notifications(uuid, jsonb) from public;
grant execute on function public.set_org_auto_notifications(uuid, jsonb) to authenticated;

-- post-condition (run after apply)
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname='set_org_auto_notifications'
                   and p.prosecdef) then
    raise exception 'post-check failed: SECDEF fn not present';
  end if;
end $$;
