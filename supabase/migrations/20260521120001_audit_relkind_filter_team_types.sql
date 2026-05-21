-- Audit discipline migration — anti-pattern #24 (relkind='r' filter).
-- Historical 20260509234301_team_types_catalog.sql:50 checked
-- pg_class.relrowsecurity WITHOUT the relkind='r' filter. The target
-- is a freshly-CREATEd table, so false-positive in practice. This
-- migration re-runs the check WITH the proper filter as discipline
-- lock.

DO $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT c.relrowsecurity
  INTO rls_enabled
  FROM pg_class c
  WHERE c.oid = 'public.team_types'::regclass
    AND c.relkind = 'r';

  IF rls_enabled IS NULL THEN
    RAISE EXCEPTION 'team_types not found as a base table (relkind=r)';
  END IF;

  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'team_types has RLS disabled — audit fail';
  END IF;

  RAISE NOTICE 'team_types RLS verified with relkind=r filter';
END $$;
