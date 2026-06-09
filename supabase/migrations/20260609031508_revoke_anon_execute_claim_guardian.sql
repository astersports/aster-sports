-- AP#57 fix: REVOKE EXECUTE FROM anon on claim_guardian_by_email. Supabase
-- default-privileges auto-granted anon EXECUTE on the new function; the original
-- migration's REVOKE FROM PUBLIC did not remove that explicit anon grant (the
-- AP#23/#57 trap). No functional change (the function no-ops for anon — auth.uid()
-- is NULL -> 'unauthenticated'); defense-in-depth. Authored + applied by the
-- architect via MCP 2026-06-09; AP#21 mirror (verbatim).
REVOKE EXECUTE ON FUNCTION public.claim_guardian_by_email() FROM anon;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routine_privileges
    WHERE routine_schema='public' AND routine_name='claim_guardian_by_email' AND grantee='anon')
  THEN RAISE EXCEPTION 'verify failed: anon still holds EXECUTE on claim_guardian_by_email'; END IF;
END $$;
