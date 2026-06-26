-- Post-apply advisor hygiene: the two AAU trigger functions are invoked by the trigger
-- mechanism (as table owner), never by a direct CALL — so no caller needs EXECUTE.
-- Revoke the default grants (AP #23/#57) to clear the anon/authenticated-SECDEF-executable
-- advisories. Trigger invocation is unaffected. Owner-approved + MCP-applied 2026-06-26.
REVOKE EXECUTE ON FUNCTION public.assert_division_game_external() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assert_division_game_external() FROM anon;
REVOKE EXECUTE ON FUNCTION public.assert_division_game_external() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.assert_family_child_verified() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assert_family_child_verified() FROM anon;
REVOKE EXECUTE ON FUNCTION public.assert_family_child_verified() FROM authenticated;
