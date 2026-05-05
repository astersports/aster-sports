-- Wave 1H: RLS hygiene — add WITH CHECK mirroring USING on 24 policies
-- Applied: 2026-05-04 19:03:31 UTC via Supabase MCP apply_migration
-- Project: vrwwpsbfbnveawqwbdmj (Legacy Hoopers / Skyfire / Ember)
-- Excludes user_roles_self (1 policy deferred pending invite-flow verification)
-- 13 cmd=ALL + 11 cmd=UPDATE policies

-- ============ ALL policies (13) ============

DROP POLICY IF EXISTS scenarios_write ON public.championship_scenarios;
CREATE POLICY scenarios_write ON public.championship_scenarios
  FOR ALL
  USING (tournament_id IN (
    SELECT tournaments.id FROM tournaments
    WHERE tournaments.org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach']))))
  WITH CHECK (tournament_id IN (
    SELECT tournaments.id FROM tournaments
    WHERE tournaments.org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach']))));

DROP POLICY IF EXISTS "Coaches can manage check_ins" ON public.check_ins;
CREATE POLICY "Coaches can manage check_ins" ON public.check_ins
  FOR ALL
  USING (EXISTS (SELECT 1 FROM events e JOIN teams t ON t.id = e.team_id JOIN user_roles ur ON ur.organization_id = t.org_id
    WHERE e.id = check_ins.event_id AND ur.user_id = (SELECT auth.uid()) AND ur.role = ANY (ARRAY['admin','coach'])))
  WITH CHECK (EXISTS (SELECT 1 FROM events e JOIN teams t ON t.id = e.team_id JOIN user_roles ur ON ur.organization_id = t.org_id
    WHERE e.id = check_ins.event_id AND ur.user_id = (SELECT auth.uid()) AND ur.role = ANY (ARRAY['admin','coach'])));

DROP POLICY IF EXISTS circuit_rules_write ON public.circuit_rules;
CREATE POLICY circuit_rules_write ON public.circuit_rules
  FOR ALL
  USING (org_id IN (SELECT user_roles.organization_id FROM user_roles WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = 'admin'))
  WITH CHECK (org_id IN (SELECT user_roles.organization_id FROM user_roles WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS coaching_assignments_write ON public.coaching_assignments;
CREATE POLICY coaching_assignments_write ON public.coaching_assignments
  FOR ALL
  USING (org_id IN (SELECT user_roles.organization_id FROM user_roles WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = 'admin'))
  WITH CHECK (org_id IN (SELECT user_roles.organization_id FROM user_roles WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS guardian_notification_prefs_self ON public.guardian_notification_prefs;
CREATE POLICY guardian_notification_prefs_self ON public.guardian_notification_prefs
  FOR ALL
  USING (guardian_id IN (SELECT guardians.id FROM guardians WHERE guardians.user_id = (SELECT auth.uid())))
  WITH CHECK (guardian_id IN (SELECT guardians.id FROM guardians WHERE guardians.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS location_rooms_org_isolation ON public.location_rooms;
CREATE POLICY location_rooms_org_isolation ON public.location_rooms
  FOR ALL
  TO authenticated
  USING (location_id IN (SELECT locations.id FROM locations WHERE locations.org_id = current_user_org_id()))
  WITH CHECK (location_id IN (SELECT locations.id FROM locations WHERE locations.org_id = current_user_org_id()));

DROP POLICY IF EXISTS "Admins can manage their org settings" ON public.organization_settings;
CREATE POLICY "Admins can manage their org settings" ON public.organization_settings
  FOR ALL
  USING (organization_id IN (SELECT user_roles.organization_id FROM user_roles WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = 'admin'))
  WITH CHECK (organization_id IN (SELECT user_roles.organization_id FROM user_roles WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS player_tags_write ON public.player_tags;
CREATE POLICY player_tags_write ON public.player_tags
  FOR ALL
  USING (player_id IN (SELECT players.id FROM players WHERE players.org_id IN (
    SELECT user_roles.organization_id FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach']))))
  WITH CHECK (player_id IN (SELECT players.id FROM players WHERE players.org_id IN (
    SELECT user_roles.organization_id FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach']))));

DROP POLICY IF EXISTS tmr_write ON public.tournament_message_recipients;
CREATE POLICY tmr_write ON public.tournament_message_recipients
  FOR ALL
  USING (message_id IN (SELECT tournament_messages.id FROM tournament_messages WHERE tournament_messages.tournament_id IN (
    SELECT tournaments.id FROM tournaments WHERE tournaments.org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach'])))))
  WITH CHECK (message_id IN (SELECT tournament_messages.id FROM tournament_messages WHERE tournament_messages.tournament_id IN (
    SELECT tournaments.id FROM tournaments WHERE tournaments.org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach'])))));

DROP POLICY IF EXISTS tournament_messages_write ON public.tournament_messages;
CREATE POLICY tournament_messages_write ON public.tournament_messages
  FOR ALL
  USING (tournament_id IN (SELECT tournaments.id FROM tournaments WHERE tournaments.org_id IN (
    SELECT user_roles.organization_id FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach']))))
  WITH CHECK (tournament_id IN (SELECT tournaments.id FROM tournaments WHERE tournaments.org_id IN (
    SELECT user_roles.organization_id FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach']))));

DROP POLICY IF EXISTS tournament_rosters_write ON public.tournament_rosters;
CREATE POLICY tournament_rosters_write ON public.tournament_rosters
  FOR ALL
  USING (tournament_id IN (SELECT tournaments.id FROM tournaments WHERE tournaments.org_id IN (
    SELECT user_roles.organization_id FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach']))))
  WITH CHECK (tournament_id IN (SELECT tournaments.id FROM tournaments WHERE tournaments.org_id IN (
    SELECT user_roles.organization_id FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach']))));

DROP POLICY IF EXISTS tournament_teams_write ON public.tournament_teams;
CREATE POLICY tournament_teams_write ON public.tournament_teams
  FOR ALL
  USING (tournament_id IN (SELECT tournaments.id FROM tournaments WHERE tournaments.org_id IN (
    SELECT user_roles.organization_id FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach']))))
  WITH CHECK (tournament_id IN (SELECT tournaments.id FROM tournaments WHERE tournaments.org_id IN (
    SELECT user_roles.organization_id FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach']))));

DROP POLICY IF EXISTS tournaments_write ON public.tournaments;
CREATE POLICY tournaments_write ON public.tournaments
  FOR ALL
  USING (org_id IN (SELECT user_roles.organization_id FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach'])))
  WITH CHECK (org_id IN (SELECT user_roles.organization_id FROM user_roles
    WHERE user_roles.user_id = (SELECT auth.uid()) AND user_roles.role = ANY (ARRAY['admin','coach'])));

-- ============ UPDATE policies (11) ============

DROP POLICY IF EXISTS event_notifications_update ON public.event_notifications;
CREATE POLICY event_notifications_update ON public.event_notifications
  FOR UPDATE
  USING (recipient_id = (SELECT auth.uid()) OR user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (recipient_id = (SELECT auth.uid()) OR user_has_role_in_org(org_id, ARRAY['admin']));

DROP POLICY IF EXISTS ride_claims_update ON public.event_ride_claims;
CREATE POLICY ride_claims_update ON public.event_ride_claims
  FOR UPDATE
  USING (rider_user_id = (SELECT auth.uid())
    OR offer_id IN (SELECT event_ride_offers.id FROM event_ride_offers WHERE event_ride_offers.driver_user_id = (SELECT auth.uid()))
    OR user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (rider_user_id = (SELECT auth.uid())
    OR offer_id IN (SELECT event_ride_offers.id FROM event_ride_offers WHERE event_ride_offers.driver_user_id = (SELECT auth.uid()))
    OR user_has_role_in_org(org_id, ARRAY['admin']));

DROP POLICY IF EXISTS ride_offers_update ON public.event_ride_offers;
CREATE POLICY ride_offers_update ON public.event_ride_offers
  FOR UPDATE
  USING (driver_user_id = (SELECT auth.uid()) OR user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (driver_user_id = (SELECT auth.uid()) OR user_has_role_in_org(org_id, ARRAY['admin']));

DROP POLICY IF EXISTS events_update ON public.events;
CREATE POLICY events_update ON public.events
  FOR UPDATE
  USING (user_has_role_in_org((SELECT teams.org_id FROM teams WHERE teams.id = events.team_id), ARRAY['admin','coach']))
  WITH CHECK (user_has_role_in_org((SELECT teams.org_id FROM teams WHERE teams.id = events.team_id), ARRAY['admin','coach']));

DROP POLICY IF EXISTS locations_update ON public.locations;
CREATE POLICY locations_update ON public.locations
  FOR UPDATE
  USING (user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));

DROP POLICY IF EXISTS opponents_update ON public.opponents;
CREATE POLICY opponents_update ON public.opponents
  FOR UPDATE
  USING (user_has_role_in_org(org_id, ARRAY['admin','coach']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin','coach']));

DROP POLICY IF EXISTS player_activations_update ON public.player_activations;
CREATE POLICY player_activations_update ON public.player_activations
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM events e JOIN teams t ON t.id = e.team_id
    WHERE e.id = player_activations.event_id AND user_has_role_in_org(t.org_id, ARRAY['admin','coach'])))
  WITH CHECK (EXISTS (SELECT 1 FROM events e JOIN teams t ON t.id = e.team_id
    WHERE e.id = player_activations.event_id AND user_has_role_in_org(t.org_id, ARRAY['admin','coach'])));

DROP POLICY IF EXISTS seasons_update ON public.seasons;
CREATE POLICY seasons_update ON public.seasons
  FOR UPDATE
  USING (user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));

DROP POLICY IF EXISTS team_players_update ON public.team_players;
CREATE POLICY team_players_update ON public.team_players
  FOR UPDATE
  USING (user_has_role_in_org((SELECT teams.org_id FROM teams WHERE teams.id = team_players.team_id), ARRAY['admin','coach']))
  WITH CHECK (user_has_role_in_org((SELECT teams.org_id FROM teams WHERE teams.id = team_players.team_id), ARRAY['admin','coach']));

DROP POLICY IF EXISTS team_staff_update ON public.team_staff;
CREATE POLICY team_staff_update ON public.team_staff
  FOR UPDATE
  USING (user_has_role_in_org((SELECT teams.org_id FROM teams WHERE teams.id = team_staff.team_id), ARRAY['admin']))
  WITH CHECK (user_has_role_in_org((SELECT teams.org_id FROM teams WHERE teams.id = team_staff.team_id), ARRAY['admin']));

DROP POLICY IF EXISTS teams_update ON public.teams;
CREATE POLICY teams_update ON public.teams
  FOR UPDATE
  USING (user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));

-- ============ Verification ============
DO $$
DECLARE
  remaining int;
  expected_remaining int := 1;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM pg_policies
  WHERE schemaname = 'public'
    AND cmd IN ('ALL','INSERT','UPDATE')
    AND with_check IS NULL
    AND policyname NOT IN ('user_roles_self');
  IF remaining > 0 THEN RAISE EXCEPTION 'Wave 1H verification failed: % policies still missing with_check', remaining; END IF;

  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND policyname='user_roles_self' AND with_check IS NULL) <> expected_remaining THEN
    RAISE EXCEPTION 'Wave 1H sanity check failed: user_roles_self should still have NULL with_check (deferred)';
  END IF;
END $$;
