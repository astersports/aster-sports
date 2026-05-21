-- Audit hygiene followups for PR #450 + #451 verification migrations.
-- Fix 1: player_game_stats org_id FK missing covering index.
-- Fix 2: team_types 4 RLS policies use bare auth.uid() instead of (select auth.uid()).

CREATE INDEX IF NOT EXISTS player_game_stats_org_id_idx
  ON public.player_game_stats (org_id);

DROP POLICY IF EXISTS team_types_read_org_members ON public.team_types;
DROP POLICY IF EXISTS team_types_insert_admin ON public.team_types;
DROP POLICY IF EXISTS team_types_update_admin ON public.team_types;
DROP POLICY IF EXISTS team_types_delete_admin ON public.team_types;

CREATE POLICY team_types_read_org_members ON public.team_types
  FOR SELECT
  USING (
    org_id IN (
      SELECT user_roles.organization_id
      FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY team_types_insert_admin ON public.team_types
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT user_roles.organization_id
      FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY team_types_update_admin ON public.team_types
  FOR UPDATE
  USING (
    org_id IN (
      SELECT user_roles.organization_id
      FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT user_roles.organization_id
      FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    )
  );

CREATE POLICY team_types_delete_admin ON public.team_types
  FOR DELETE
  USING (
    org_id IN (
      SELECT user_roles.organization_id
      FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
    )
  );
