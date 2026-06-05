-- Defense-in-depth (audit P2): comms_message_recipients had table-level
-- SELECT/INSERT/UPDATE/DELETE granted to `anon`. RLS blocks anon (no
-- anon-targeted policy exists), but the grants should not exist at all.
--
-- AP #23 / #57: REVOKE FROM PUBLIC first, then explicitly FROM anon
-- (Supabase default privileges can auto-grant to anon independent of
-- PUBLIC; an explicit anon revoke is required). authenticated +
-- service_role grants are untouched -- they are load-bearing for the
-- admin/coach + parent policies.

REVOKE ALL ON TABLE public.comms_message_recipients FROM PUBLIC;
REVOKE ALL ON TABLE public.comms_message_recipients FROM anon;

do $$
declare
  v_anon_grants int;
begin
  select count(*) into v_anon_grants
  from information_schema.role_table_grants
  where table_schema='public' and table_name='comms_message_recipients' and grantee='anon';
  if v_anon_grants > 0 then
    raise exception 'anon still has % grant(s) on comms_message_recipients after revoke', v_anon_grants;
  end if;
  raise notice 'anon grants on comms_message_recipients fully revoked';
end $$;
