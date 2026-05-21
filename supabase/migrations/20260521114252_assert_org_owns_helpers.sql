-- BUNDLE D step 1 — SECDEF helper library for cross-org entity ownership
-- validation. Per L99 Batch 12 audit P1.1 + P1.2 and Frank's Q5 design
-- call routing (option a — per-call SECDEF asserts).
--
-- Edge functions that accept entity IDs in request body (tournament_id,
-- team_id, event_id, season_id) call these helpers BEFORE the data
-- fetch to verify the entity belongs to the caller's org. Closes the
-- cross-org leak vector that promotes to P0 at multi-tenant scale.
--
-- All helpers return boolean (true if entity belongs to org, false
-- otherwise). Callers should `if (!result) throw new Error("cross-org
-- violation")` or equivalent.

CREATE OR REPLACE FUNCTION assert_org_owns_tournament(
  p_tournament_id uuid,
  p_org_id uuid
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tournaments
    WHERE id = p_tournament_id
      AND org_id = p_org_id
  );
$$;

CREATE OR REPLACE FUNCTION assert_org_owns_team(
  p_team_id uuid,
  p_org_id uuid
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM teams
    WHERE id = p_team_id
      AND org_id = p_org_id
  );
$$;

CREATE OR REPLACE FUNCTION assert_org_owns_event(
  p_event_id uuid,
  p_org_id uuid
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- events table has no org_id directly — FK-scoped via team_id → teams.org_id
  SELECT EXISTS (
    SELECT 1
    FROM events e
    JOIN teams t ON t.id = e.team_id
    WHERE e.id = p_event_id
      AND t.org_id = p_org_id
  );
$$;

CREATE OR REPLACE FUNCTION assert_org_owns_season(
  p_season_id uuid,
  p_org_id uuid
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM seasons
    WHERE id = p_season_id
      AND org_id = p_org_id
  );
$$;

-- Anti-pattern #23: REVOKE FROM PUBLIC before role-specific revoke.
-- Supabase project default privileges also auto-grant EXECUTE to anon
-- on new functions, so explicit REVOKE FROM anon is required even after
-- REVOKE FROM PUBLIC. Verified post-apply via routine_privileges.
REVOKE EXECUTE ON FUNCTION assert_org_owns_tournament(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION assert_org_owns_team(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION assert_org_owns_event(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION assert_org_owns_season(uuid, uuid) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION assert_org_owns_tournament(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION assert_org_owns_team(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION assert_org_owns_event(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION assert_org_owns_season(uuid, uuid) FROM anon;

-- Grant to authenticated and service_role (edge functions use service_role).
GRANT EXECUTE ON FUNCTION assert_org_owns_tournament(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION assert_org_owns_team(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION assert_org_owns_event(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION assert_org_owns_season(uuid, uuid) TO authenticated, service_role;

COMMENT ON FUNCTION assert_org_owns_tournament IS
  'Cross-org entity ownership validation helper. Used by edge functions to verify body params belong to caller org before data fetch. Per L99 Batch 12 P1.1 + P1.2 + Frank Q5 routing 2026-05-21.';
COMMENT ON FUNCTION assert_org_owns_team IS
  'Cross-org entity ownership validation helper. Used by edge functions to verify body params belong to caller org before data fetch. Per L99 Batch 12 P1.1 + P1.2 + Frank Q5 routing 2026-05-21.';
COMMENT ON FUNCTION assert_org_owns_event IS
  'Cross-org entity ownership validation helper. events FK-scoped via team_id → teams.org_id. Per L99 Batch 12 P1.1 + P1.2 + Frank Q5 routing 2026-05-21.';
COMMENT ON FUNCTION assert_org_owns_season IS
  'Cross-org entity ownership validation helper. Used by edge functions to verify body params belong to caller org before data fetch. Per L99 Batch 12 P1.1 + P1.2 + Frank Q5 routing 2026-05-21.';
