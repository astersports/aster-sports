-- ============================================================
-- WEEKLY DIGEST RECIPIENT RESOLUTION
--
-- Returns one row per guardian (deduped across multiple kids on
-- different teams). Multi-team families like Stephanie Samaritano
-- (11U Girls + 8U Boys) get one row with team_ids = both teams.
--
-- Used by the digest composer to fan out per-family rendered emails.
-- Composer iterates rows, fetches each family's events for the period,
-- renders the personalized day-sectioned schedule, captures per-recipient
-- body in comms_message_recipients.
--
-- SECURITY INVOKER: respects existing guardians SELECT RLS (admins can
-- read all org guardians; coaches see only their team's families).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_digest_recipients(p_org_id uuid)
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
    g.id AS guardian_id,
    g.email,
    TRIM(CONCAT_WS(' ', g.first_name, g.last_name)) AS full_name,
    array_agg(DISTINCT tp.team_id) AS team_ids,
    array_agg(DISTINCT tm.name) AS team_names
  FROM public.guardians g
  JOIN public.player_guardians pg ON pg.guardian_id = g.id
  JOIN public.team_players tp ON tp.player_id = pg.player_id
  JOIN public.teams tm ON tm.id = tp.team_id
  WHERE g.org_id = p_org_id
    AND g.email IS NOT NULL
    AND tp.status = 'active'
    AND tm.org_id = p_org_id
  GROUP BY g.id, g.email, g.first_name, g.last_name
  ORDER BY g.last_name NULLS LAST, g.first_name NULLS LAST;
$$;

REVOKE EXECUTE ON FUNCTION public.get_digest_recipients(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_digest_recipients(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_digest_recipients(uuid) TO authenticated;

-- Verification
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='get_digest_recipients') THEN
    RAISE EXCEPTION 'get_digest_recipients function not created';
  END IF;
END $$;
