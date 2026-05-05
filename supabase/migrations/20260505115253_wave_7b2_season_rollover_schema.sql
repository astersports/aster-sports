-- 7-B.2: Season rollover — status column + audit table

ALTER TABLE public.seasons
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('planning', 'active', 'archived')),
  ADD COLUMN IF NOT EXISTS parent_season_id uuid REFERENCES public.seasons(id),
  ADD COLUMN IF NOT EXISTS rolled_over_at timestamptz;

CREATE TABLE IF NOT EXISTS public.season_rollovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_season_id uuid NOT NULL REFERENCES public.seasons(id),
  to_season_id uuid NOT NULL REFERENCES public.seasons(id),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  players_carried integer NOT NULL DEFAULT 0,
  players_advanced_age integer NOT NULL DEFAULT 0,
  players_dropped integer NOT NULL DEFAULT 0,
  coaches_carried integer NOT NULL DEFAULT 0,
  teams_recreated integer NOT NULL DEFAULT 0,
  financial_balances_carried_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'complete', 'rolled_back')),
  notes text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.season_rollovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY season_rollovers_admin ON public.season_rollovers
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'admin'
    )
  );
