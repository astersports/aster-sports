-- 2-D3: Game day flow — event_arrivals table + coach checklist state

CREATE TABLE IF NOT EXISTS public.event_arrivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  guardian_id uuid REFERENCES public.guardians(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('on_the_way', 'arrived', 'running_late')),
  eta_minutes integer CHECK (eta_minutes IN (5, 10, 15, 30)),
  reason text,
  status_changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, player_id)
);

CREATE INDEX idx_event_arrivals_event ON public.event_arrivals (event_id);
CREATE INDEX idx_event_arrivals_player ON public.event_arrivals (player_id);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS coach_checklist_state jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.event_arrivals ENABLE ROW LEVEL SECURITY;

-- Parents can read/write arrivals for their own children's events
CREATE POLICY event_arrivals_parent_read ON public.event_arrivals
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN teams t ON t.id = e.team_id
      JOIN user_roles ur ON ur.organization_id = t.org_id
      WHERE ur.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY event_arrivals_parent_write ON public.event_arrivals
  FOR INSERT TO authenticated
  WITH CHECK (
    guardian_id IN (
      SELECT g.id FROM guardians g WHERE g.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY event_arrivals_parent_update ON public.event_arrivals
  FOR UPDATE TO authenticated
  USING (
    guardian_id IN (
      SELECT g.id FROM guardians g WHERE g.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    guardian_id IN (
      SELECT g.id FROM guardians g WHERE g.user_id = (SELECT auth.uid())
    )
  );

-- Staff can read all and write (coach override)
CREATE POLICY event_arrivals_staff_all ON public.event_arrivals
  FOR ALL TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN teams t ON t.id = e.team_id
      JOIN user_roles ur ON ur.organization_id = t.org_id
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = ANY (ARRAY['admin', 'coach'])
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT e.id FROM events e
      JOIN teams t ON t.id = e.team_id
      JOIN user_roles ur ON ur.organization_id = t.org_id
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = ANY (ARRAY['admin', 'coach'])
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.event_arrivals;
