-- ============================================================
-- PILOT MODE INFRASTRUCTURE
--
-- Two-layer flag system to prevent accidental real-family sends
-- during the pilot period (through Fall 2026):
--
--   organization_settings.pilot_mode_enabled  (org gate, DEFAULT TRUE)
--   guardians.is_pilot_family                  (per-guardian flag, DEFAULT FALSE)
--
-- get_digest_recipients gains an optional p_pilot_only param. The
-- single-arg signature is dropped so every caller must consciously
-- opt in to the pilot filter (defense in depth — UI can't accidentally
-- bypass).
--
-- Fall rollout = single SQL UPDATE flipping pilot_mode_enabled to FALSE.
-- ============================================================

-- 1. Add pilot_mode_enabled to organization_settings
ALTER TABLE public.organization_settings
  ADD COLUMN pilot_mode_enabled boolean NOT NULL DEFAULT TRUE;

-- 2. Add is_pilot_family to guardians + partial index
ALTER TABLE public.guardians
  ADD COLUMN is_pilot_family boolean NOT NULL DEFAULT FALSE;

CREATE INDEX guardians_pilot_family_idx
  ON public.guardians(org_id, is_pilot_family)
  WHERE is_pilot_family = TRUE;

-- 3. Recreate get_digest_recipients with optional pilot filter
CREATE OR REPLACE FUNCTION public.get_digest_recipients(
  p_org_id uuid,
  p_pilot_only boolean DEFAULT FALSE
)
RETURNS TABLE (
  guardian_id uuid,
  email text,
  full_name text,
  team_ids uuid[],
  team_names text[]
)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
  SELECT
    g.id,
    g.email,
    TRIM(CONCAT_WS(' ', g.first_name, g.last_name)),
    array_agg(DISTINCT tp.team_id),
    array_agg(DISTINCT tm.name)
  FROM public.guardians g
  JOIN public.player_guardians pg ON pg.guardian_id = g.id
  JOIN public.team_players tp ON tp.player_id = pg.player_id
  JOIN public.teams tm ON tm.id = tp.team_id
  WHERE g.org_id = p_org_id
    AND g.email IS NOT NULL
    AND tp.status = 'active'
    AND tm.org_id = p_org_id
    AND (p_pilot_only = FALSE OR g.is_pilot_family = TRUE)
  GROUP BY g.id, g.email, g.first_name, g.last_name
  ORDER BY g.last_name NULLS LAST, g.first_name NULLS LAST;
$$;

REVOKE EXECUTE ON FUNCTION public.get_digest_recipients(uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_digest_recipients(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_digest_recipients(uuid, boolean) TO authenticated;

-- 4. Drop the old single-arg signature so callers must opt in to pilot
--    parameter (forces conscious decision at every call site)
DROP FUNCTION IF EXISTS public.get_digest_recipients(uuid);

-- 5. Verification block
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='organization_settings'
      AND column_name='pilot_mode_enabled'
  ) THEN
    RAISE EXCEPTION 'pilot_mode_enabled column missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='guardians'
      AND column_name='is_pilot_family' AND is_nullable='NO'
  ) THEN
    RAISE EXCEPTION 'is_pilot_family not registered correctly';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='get_digest_recipients'
      AND pg_get_function_arguments(p.oid) LIKE '%p_pilot_only%'
  ) THEN
    RAISE EXCEPTION 'get_digest_recipients(p_pilot_only) overload missing';
  END IF;
END $$;
