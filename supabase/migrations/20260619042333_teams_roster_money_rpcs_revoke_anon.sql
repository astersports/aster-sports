-- ============================================================================
-- MIRROR of applied migration 20260619042333_teams_roster_money_rpcs_revoke_anon
-- (applied via Supabase MCP 2026-06-19). Byte-faithful to production; mirror
-- only (AP #21). Companion to 20260619042256_teams_roster_money_rpcs.
-- Least-privilege on the money path: Supabase default privileges grant EXECUTE
-- to anon explicitly, which REVOKE FROM PUBLIC does not touch (AP #57). The
-- internal user_has_role_in_org guard already rejects anon (auth.uid() null),
-- so this is defense-in-depth. CC verified live 2026-06-19: anon EXECUTE = false
-- on all 6.
-- ============================================================================

revoke execute on function public.add_roster_member(uuid,uuid,text,int) from anon;
revoke execute on function public.drop_roster_member(uuid,uuid,text) from anon;
revoke execute on function public.set_jersey(uuid,uuid,int) from anon;
revoke execute on function public.set_roster_type(uuid,uuid,text) from anon;
revoke execute on function public.record_family_transaction(uuid,uuid,text,int,text,timestamptz,text) from anon;
revoke execute on function public.void_transaction(uuid) from anon;
