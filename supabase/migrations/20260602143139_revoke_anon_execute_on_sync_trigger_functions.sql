-- Security hygiene (get_advisors: anon_security_definer_function_executable, AP #57).
-- These 4 are TRIGGER functions (returns trigger): they execute inside triggers as
-- the table owner and are never invoked directly, so a direct EXECUTE grant to
-- PUBLIC/anon/authenticated is superfluous (accidental default-PUBLIC inheritance).
-- REVOKE does NOT affect trigger firing — triggers don't check the invoker's EXECUTE
-- privilege. AP #23/#57: revoke from PUBLIC before roles (Supabase also default-grants
-- anon). The 3 genuinely anon-facing SECDEF RPCs (get_invitation_by_token,
-- get_public_program, submit_registration) are deliberately LEFT anon-executable —
-- parent-invite acceptance + public self-registration are unauthenticated flows.
revoke execute on function public.trg_sync_opponent_from_event() from public, anon, authenticated;
revoke execute on function public.trg_sync_opponent_from_game_result() from public, anon, authenticated;
revoke execute on function public.trg_sync_tournament_team_from_event() from public, anon, authenticated;
revoke execute on function public.trg_sync_tournament_team_from_game_result() from public, anon, authenticated;
