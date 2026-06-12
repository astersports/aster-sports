-- SD-11 / §16.8 (SCHEDULE_L99_BUILD_SPEC §2 PR-B'): staff RSVP override
-- audit. RSVPs close at start_at everywhere; staff may still edit on the
-- event detail surface, and every post-start staff edit writes a row
-- here — timestamped, author-tagged ("[Override · Coach Kenny · 4:47 PM]"
-- format per §16.8). Immutable log: INSERT-only, no UPDATE/DELETE grants.
-- FK-scoped via events -> teams -> org (AP #37 exception class; no
-- org_id column, same as event_rsvps).
-- (AP #21 mirror of MCP apply_migration 20260612111335. Verified:
-- authenticated INSERT+SELECT only, 0 anon/PUBLIC grants, 2 policies.)

CREATE TABLE event_rsvp_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL,
  actor_name text,
  old_response text,
  new_response text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX event_rsvp_audit_event_idx ON event_rsvp_audit (event_id, created_at DESC);

ALTER TABLE event_rsvp_audit ENABLE ROW LEVEL SECURITY;

-- Staff of the event's org: read + insert (mirrors game_results staff
-- traversal; auth.uid() subselect-wrapped per the auth_rls_initplan rule).
CREATE POLICY event_rsvp_audit_select_staff ON event_rsvp_audit
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN events e ON e.id = event_rsvp_audit.event_id
    JOIN teams t ON t.id = e.team_id
    WHERE ur.user_id = (SELECT auth.uid())
      AND ur.organization_id = t.org_id
      AND ur.role = ANY (ARRAY['admin'::text, 'coach'::text])
  ));

CREATE POLICY event_rsvp_audit_insert_staff ON event_rsvp_audit
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN events e ON e.id = event_rsvp_audit.event_id
      JOIN teams t ON t.id = e.team_id
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.organization_id = t.org_id
        AND ur.role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  );

-- Grants: immutable audit — authenticated gets SELECT + INSERT only.
-- Explicit PUBLIC-then-anon revoke per AP #23 + AP #57 (Supabase default
-- privileges auto-grant to anon on new tables).
REVOKE ALL ON event_rsvp_audit FROM PUBLIC;
REVOKE ALL ON event_rsvp_audit FROM anon;
GRANT SELECT, INSERT ON event_rsvp_audit TO authenticated;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON event_rsvp_audit FROM authenticated;
