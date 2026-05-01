-- Wave 1G: Parent-scoped RLS on event_rsvps + event_comments
-- + event_duties. Closes BUG-03 (P0 privacy/auth boundary).
-- Decision #110. Applied 2026-05-01 as registered version 20260501201639.
--
-- Three tables shared cmd='ALL' + event_org_matches(event_id) +
-- with_check=NULL. Any org member could write any row. Migration
-- drops 3 broken policies, creates current_user_guardian_id() helper
-- (pre-existing, cosmetic rewrite for self-documentation), creates
-- 6 new policies with explicit with_check constraints.
--
-- Data audit pre-migration: 0 cross-family violations (28 rsvps,
-- 6 comments, 10 duties all clean).

-- Helper function for guardian-id lookup (pre-existed; cosmetic rewrite)
CREATE OR REPLACE FUNCTION public.current_user_guardian_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $func$
  SELECT id FROM public.guardians
  WHERE user_id = auth.uid()
  LIMIT 1;
$func$;

GRANT EXECUTE ON FUNCTION public.current_user_guardian_id()
  TO authenticated;

-- event_rsvps: parent writes own children only
DROP POLICY IF EXISTS event_rsvps_org_all ON public.event_rsvps;
DROP POLICY IF EXISTS event_rsvps_write_own_child ON public.event_rsvps;
DROP POLICY IF EXISTS event_rsvps_write_staff ON public.event_rsvps;

CREATE POLICY event_rsvps_write_own_child ON public.event_rsvps
  FOR ALL
  USING (
    event_org_matches(event_id)
    AND player_id = ANY(current_user_player_ids())
  )
  WITH CHECK (
    event_org_matches(event_id)
    AND player_id = ANY(current_user_player_ids())
  );

CREATE POLICY event_rsvps_write_staff ON public.event_rsvps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN teams t ON t.id = e.team_id
      WHERE e.id = event_rsvps.event_id
        AND user_has_role_in_org(t.org_id, ARRAY['admin','coach'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN teams t ON t.id = e.team_id
      WHERE e.id = event_rsvps.event_id
        AND user_has_role_in_org(t.org_id, ARRAY['admin','coach'])
    )
  );

-- event_comments: own comments only
DROP POLICY IF EXISTS event_comments_org_all ON public.event_comments;
DROP POLICY IF EXISTS event_comments_write_own ON public.event_comments;
DROP POLICY IF EXISTS event_comments_write_staff ON public.event_comments;

CREATE POLICY event_comments_write_own ON public.event_comments
  FOR ALL
  USING (
    event_org_matches(event_id)
    AND author_user_id = auth.uid()
  )
  WITH CHECK (
    event_org_matches(event_id)
    AND author_user_id = auth.uid()
  );

CREATE POLICY event_comments_write_staff ON public.event_comments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN teams t ON t.id = e.team_id
      WHERE e.id = event_comments.event_id
        AND user_has_role_in_org(t.org_id, ARRAY['admin','coach'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN teams t ON t.id = e.team_id
      WHERE e.id = event_comments.event_id
        AND user_has_role_in_org(t.org_id, ARRAY['admin','coach'])
    )
  );

-- event_duties: parents UPDATE only (claim/release)
DROP POLICY IF EXISTS event_duties_org_all ON public.event_duties;
DROP POLICY IF EXISTS event_duties_claim_release ON public.event_duties;
DROP POLICY IF EXISTS event_duties_write_staff ON public.event_duties;

CREATE POLICY event_duties_claim_release ON public.event_duties
  FOR UPDATE
  USING (
    event_org_matches(event_id)
    AND (
      guardian_id IS NULL
      OR guardian_id = current_user_guardian_id()
    )
  )
  WITH CHECK (
    event_org_matches(event_id)
    AND (
      guardian_id IS NULL
      OR guardian_id = current_user_guardian_id()
    )
  );

CREATE POLICY event_duties_write_staff ON public.event_duties
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN teams t ON t.id = e.team_id
      WHERE e.id = event_duties.event_id
        AND user_has_role_in_org(t.org_id, ARRAY['admin','coach'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN teams t ON t.id = e.team_id
      WHERE e.id = event_duties.event_id
        AND user_has_role_in_org(t.org_id, ARRAY['admin','coach'])
    )
  );
