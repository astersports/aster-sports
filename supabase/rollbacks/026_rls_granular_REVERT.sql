-- ============================================================
-- 026_rls_granular_REVERT.sql
-- ============================================================
-- Reverts Migration 026: drop the 36 granular policies, restore 9 ALL policies.
-- WARNING: This restores the P0 security hole. Use only for emergency rollback.
-- ============================================================

BEGIN;

-- Drop all granular policies created by Migration 026
DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;

DROP POLICY IF EXISTS "teams_select" ON public.teams;
DROP POLICY IF EXISTS "teams_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_update" ON public.teams;
DROP POLICY IF EXISTS "teams_delete" ON public.teams;

DROP POLICY IF EXISTS "team_players_select" ON public.team_players;
DROP POLICY IF EXISTS "team_players_insert" ON public.team_players;
DROP POLICY IF EXISTS "team_players_update" ON public.team_players;
DROP POLICY IF EXISTS "team_players_delete" ON public.team_players;

DROP POLICY IF EXISTS "team_staff_select" ON public.team_staff;
DROP POLICY IF EXISTS "team_staff_insert" ON public.team_staff;
DROP POLICY IF EXISTS "team_staff_update" ON public.team_staff;
DROP POLICY IF EXISTS "team_staff_delete" ON public.team_staff;

DROP POLICY IF EXISTS "seasons_select" ON public.seasons;
DROP POLICY IF EXISTS "seasons_insert" ON public.seasons;
DROP POLICY IF EXISTS "seasons_update" ON public.seasons;
DROP POLICY IF EXISTS "seasons_delete" ON public.seasons;

DROP POLICY IF EXISTS "locations_select" ON public.locations;
DROP POLICY IF EXISTS "locations_insert" ON public.locations;
DROP POLICY IF EXISTS "locations_update" ON public.locations;
DROP POLICY IF EXISTS "locations_delete" ON public.locations;

DROP POLICY IF EXISTS "opponents_select" ON public.opponents;
DROP POLICY IF EXISTS "opponents_insert" ON public.opponents;
DROP POLICY IF EXISTS "opponents_update" ON public.opponents;
DROP POLICY IF EXISTS "opponents_delete" ON public.opponents;

DROP POLICY IF EXISTS "event_notifications_select" ON public.event_notifications;
DROP POLICY IF EXISTS "event_notifications_insert" ON public.event_notifications;
DROP POLICY IF EXISTS "event_notifications_update" ON public.event_notifications;
DROP POLICY IF EXISTS "event_notifications_delete" ON public.event_notifications;

DROP POLICY IF EXISTS "player_activations_select" ON public.player_activations;
DROP POLICY IF EXISTS "player_activations_insert" ON public.player_activations;
DROP POLICY IF EXISTS "player_activations_update" ON public.player_activations;
DROP POLICY IF EXISTS "player_activations_delete" ON public.player_activations;

-- Restore the original ALL policies
CREATE POLICY "events_org_isolation" ON public.events
  FOR ALL USING (
    team_id IN (SELECT teams.id FROM teams WHERE teams.org_id = current_user_org_id())
  );

CREATE POLICY "teams_org_isolation" ON public.teams
  FOR ALL USING (org_id = current_user_org_id());

CREATE POLICY "team_players_org_isolation" ON public.team_players
  FOR ALL USING (
    team_id IN (SELECT teams.id FROM teams WHERE teams.org_id = current_user_org_id())
  );

CREATE POLICY "team_staff_org_isolation" ON public.team_staff
  FOR ALL USING (
    team_id IN (SELECT teams.id FROM teams WHERE teams.org_id = current_user_org_id())
  );

CREATE POLICY "seasons_org_isolation" ON public.seasons
  FOR ALL USING (org_id = current_user_org_id());

CREATE POLICY "locations_org_isolation" ON public.locations
  FOR ALL USING (org_id = current_user_org_id());

CREATE POLICY "opponents_org_isolation" ON public.opponents
  FOR ALL USING (org_id = current_user_org_id());

CREATE POLICY "notifications_queue_org_isolation" ON public.event_notifications
  FOR ALL USING (org_id = current_user_org_id());

CREATE POLICY "Coaches can manage activations" ON public.player_activations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN teams t ON t.id = e.team_id
      JOIN user_roles ur ON ur.organization_id = t.org_id
      WHERE e.id = player_activations.event_id
        AND ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['admin', 'coach'])
    )
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
