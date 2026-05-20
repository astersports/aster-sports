-- V-23 iCal subscription URL — schema foundation.
--
-- Add a per-team feed token used by the team-feed edge function to
-- look up the team without exposing team_id directly in subscribe
-- URLs. Tokens are random UUIDs (cast to text for URL composability).
--
-- NOT NULL + UNIQUE + DEFAULT gen_random_uuid()::text means:
--   - Every existing team gets a token via the default at migration
--   - New teams created post-migration get one automatically
--   - No null states; no manual backfill needed.
--
-- The token is treated as a bearer secret — anyone with the URL can
-- subscribe to the team's calendar. This matches the iCal feed model
-- (read-only public via opaque URL); the URL must NOT leak to
-- non-parents. Future iteration may add per-user tokens for
-- revocation; this v1 ships team-level tokens (one token = whole
-- team subscription).

ALTER TABLE teams ADD COLUMN team_feed_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text;

-- SECURITY DEFINER RPC for the edge function. Avoids granting the
-- edge function direct table read; lookup goes through this single
-- entry point with explicit token-scoped semantics.
CREATE OR REPLACE FUNCTION public.get_team_by_feed_token(p_token TEXT)
RETURNS TABLE (id UUID, name TEXT, org_id UUID, team_color TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id, name, org_id, team_color
  FROM teams
  WHERE team_feed_token = p_token
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_team_by_feed_token(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_team_by_feed_token(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_team_by_feed_token(TEXT) TO service_role;
