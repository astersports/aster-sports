-- Cutover Wave PR 6 (PR A) — coverage delegation schema.
-- event_coach_assignments: per-event coach OVERRIDE on top of the team
-- head-coach derivation (team_staff role='head_coach'). Option B per
-- docs/CUTOVER_WAVE_GAP_AUDIT.md Q3 — many-to-many event->coach with
-- assigned/attended/absent status. Design:
-- docs/AUDIT_COVERAGE_DELEGATION_PR6_2026-05-27.md
--
-- No org_id column — FK-scoped via events.team_id -> teams.org_id
-- (CLAUDE.md AP #37 exemption). RLS uses the (SELECT auth.uid())
-- subselect wrapper (initplan-safe per CLAUDE.md §5).
--
-- Mirror of MCP-applied migration registered as version 20260527102922
-- (AP #21). Byte-identical to the applied DDL.

CREATE TABLE public.event_coach_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  coach_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'attended', 'absent')),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, coach_user_id)
);

CREATE INDEX event_coach_assignments_event_idx
  ON public.event_coach_assignments(event_id);
CREATE INDEX event_coach_assignments_coach_idx
  ON public.event_coach_assignments(coach_user_id);

ALTER TABLE public.event_coach_assignments ENABLE ROW LEVEL SECURITY;

-- Admins of the event's org: full read/write. WITH CHECK mirrors USING
-- (AP #20 — an ALL policy must constrain writes, not just reads).
CREATE POLICY "admins manage own-org event coach assignments"
  ON public.event_coach_assignments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.teams t ON t.id = e.team_id
    JOIN public.user_roles ur ON ur.organization_id = t.org_id
    WHERE e.id = event_coach_assignments.event_id
      AND ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.teams t ON t.id = e.team_id
    JOIN public.user_roles ur ON ur.organization_id = t.org_id
    WHERE e.id = event_coach_assignments.event_id
      AND ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin')
  ));

-- Coaches read assignments for teams they staff, or where they are the
-- assigned coach. Read-only — writes come from the admin import path.
CREATE POLICY "coaches read relevant event coach assignments"
  ON public.event_coach_assignments FOR SELECT TO authenticated
  USING (
    coach_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.team_staff ts ON ts.team_id = e.team_id
      WHERE e.id = event_coach_assignments.event_id
        AND ts.user_id = (SELECT auth.uid())
    )
  );
