-- Operator directive 2026-06-12 (visual-pass round 3 grading note):
-- ride-share + volunteer/duty features activate at the SYSTEM SETTINGS
-- level, not per event. §16.16 read-now compliant: the readers (schedule
-- card facts line + event-detail Rides/Volunteers sections) ship in the
-- same PR. Shape mirrors organizations.auto_notifications + its
-- admin-gated merged-write RPC (A2 precedent, 20260609164118).
-- (AP #21 mirror of MCP apply_migration 20260612164911.)

ALTER TABLE organizations
  ADD COLUMN feature_settings jsonb NOT NULL
  DEFAULT '{"rides_enabled": true, "duties_enabled": true}'::jsonb;

create or replace function public.set_org_feature_settings(p_org_id uuid, p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_result jsonb;
begin
  if not public.user_has_role_in_org(p_org_id, array['admin']) then
    raise exception 'not authorized to update org features' using errcode = '42501';
  end if;
  if p_patch is null or jsonb_typeof(p_patch) is distinct from 'object' then
    raise exception 'patch must be a json object' using errcode = '22023';
  end if;
  update public.organizations
     set feature_settings = coalesce(feature_settings, '{}'::jsonb) || p_patch
   where id = p_org_id
   returning feature_settings into v_result;
  if v_result is null then
    raise exception 'org not found' using errcode = 'P0002';
  end if;
  return v_result;
end $$;

revoke all on function public.set_org_feature_settings(uuid, jsonb) from public;
revoke all on function public.set_org_feature_settings(uuid, jsonb) from anon;
grant execute on function public.set_org_feature_settings(uuid, jsonb) to authenticated;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname='set_org_feature_settings'
                   and p.prosecdef) then
    raise exception 'post-check failed: SECDEF fn not present';
  end if;
end $$;
