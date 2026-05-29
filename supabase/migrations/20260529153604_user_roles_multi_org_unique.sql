-- Migration #0 (EMBER_PROGRAM_SETUP_SPEC_v2 build, PR 0): identity foundation.
-- Replaces UNIQUE(user_id) with UNIQUE(user_id, organization_id) so one person
-- can hold roles in multiple orgs (the family-first multi-org moat). The spec
-- §2.1 wrongly assumed this was already in place; production had UNIQUE(user_id).
-- Backward-compatible (verified pre-flight: 5 rows / 5 distinct users / 0 FKs /
-- 0 composite dupes). Pairs with the AuthContext .maybeSingle() anti-trap fix in
-- the same PR. Applied via Supabase MCP 2026-05-29 (version 20260529153604).

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_org_id_key UNIQUE (user_id, organization_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_key') THEN
    RAISE EXCEPTION 'verify failed: old UNIQUE(user_id) still present';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_org_id_key') THEN
    RAISE EXCEPTION 'verify failed: new UNIQUE(user_id, organization_id) missing';
  END IF;
  RAISE NOTICE 'user_roles multi-org unique reshape verified.';
END $$;
