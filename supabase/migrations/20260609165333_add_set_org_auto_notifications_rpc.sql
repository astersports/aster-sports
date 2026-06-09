-- Migration: add_set_org_auto_notifications_rpc  (version 20260609165333)
--
-- REDUNDANT RE-ASSERT of 20260609164118_add_set_org_auto_notifications_rpc —
-- body-equivalent (byte-identical CREATE OR REPLACE). Mirror written by CC for
-- AP#21 applied-history parity; DO NOT re-apply or hand-run.
--
-- Two-lane collision, 2026-06-09: on the operator GO, the writer was applied in
-- BOTH lanes — CC at 16:41 (164118 + the 164149 AP#57 anon-revoke) and the
-- architect lane at 16:53 (this 165333). The architect's pre-apply existence
-- check was stale by apply time. No harm: CREATE OR REPLACE is idempotent and
-- this body matches 164118 exactly; the live function is correct.
--
-- Grant safety on replay: this block's `revoke all from public` + `grant
-- execute to authenticated` do NOT re-grant anon, and a CREATE OR REPLACE of an
-- already-existing function does not re-fire Supabase's default anon grant — so
-- the 164149 anon-revoke survives. Verified live post-collision: grant chain is
-- authenticated/postgres/service_role only (anon EXECUTE absent). `db reset`
-- replays 164118 -> 164149 -> 165333 and reproduces that same end state.
--
-- LANE LESSON (REV 2): schema changes stay in the architect lane only; the
-- architect re-checks function existence immediately before any apply. Recorded
-- here so the file set matches the DB and the collision is self-documenting.
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

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname='set_org_auto_notifications'
                   and p.prosecdef) then
    raise exception 'post-check failed: SECDEF fn not present';
  end if;
end $$;
