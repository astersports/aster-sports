-- Ship 7.7: RLS performance optimization
-- Wraps auth.uid() in (SELECT auth.uid()) for all 52 flagged policies
-- This makes Postgres evaluate auth.uid() ONCE per query instead of once per row
-- Source: Supabase performance advisor lint 0003_auth_rls_initplan
-- Pre-state: 52 auth_rls_initplan WARN lints
-- Post-state: 0
-- All policy expressions are byte-faithful copies from pg_policies, with auth.uid() replaced
-- Applied via MCP at 2026-04-27T21:39:32 UTC

-- ============================================================================
-- TABLE: championship_scenarios
-- ============================================================================
DROP POLICY IF EXISTS scenarios_read ON public.championship_scenarios;
CREATE POLICY scenarios_read ON public.championship_scenarios
  AS PERMISSIVE FOR SELECT TO public
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id FROM user_roles
        WHERE user_roles.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS scenarios_write ON public.championship_scenarios;
CREATE POLICY scenarios_write ON public.championship_scenarios
  AS PERMISSIVE FOR ALL TO public
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id FROM user_roles
        WHERE user_roles.user_id = (SELECT auth.uid())
          AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
      )
    )
  );

-- ============================================================================
-- TABLE: check_ins
-- ============================================================================
DROP POLICY IF EXISTS "Coaches can manage check_ins" ON public.check_ins;
CREATE POLICY "Coaches can manage check_ins" ON public.check_ins
  AS PERMISSIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1
      FROM events e
      JOIN teams t ON t.id = e.team_id
      JOIN user_roles ur ON ur.organization_id = t.org_id
      WHERE e.id = check_ins.event_id
        AND ur.user_id = (SELECT auth.uid())
        AND ur.role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  );

DROP POLICY IF EXISTS "Org members can view check_ins" ON public.check_ins;
CREATE POLICY "Org members can view check_ins" ON public.check_ins
  AS PERMISSIVE FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1
      FROM events e
      JOIN teams t ON t.id = e.team_id
      JOIN user_roles ur ON ur.organization_id = t.org_id
      WHERE e.id = check_ins.event_id
        AND ur.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- TABLE: circuit_rules
-- ============================================================================
DROP POLICY IF EXISTS circuit_rules_read ON public.circuit_rules;
CREATE POLICY circuit_rules_read ON public.circuit_rules
  AS PERMISSIVE FOR SELECT TO public
  USING (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS circuit_rules_write ON public.circuit_rules;
CREATE POLICY circuit_rules_write ON public.circuit_rules
  AS PERMISSIVE FOR ALL TO public
  USING (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'admin'::text
    )
  );

-- ============================================================================
-- TABLE: coaching_assignments
-- ============================================================================
DROP POLICY IF EXISTS coaching_assignments_read ON public.coaching_assignments;
CREATE POLICY coaching_assignments_read ON public.coaching_assignments
  AS PERMISSIVE FOR SELECT TO public
  USING (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS coaching_assignments_write ON public.coaching_assignments;
CREATE POLICY coaching_assignments_write ON public.coaching_assignments
  AS PERMISSIVE FOR ALL TO public
  USING (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'admin'::text
    )
  );

-- ============================================================================
-- TABLE: event_comments
-- ============================================================================
DROP POLICY IF EXISTS event_comments_org_authenticated_read ON public.event_comments;
CREATE POLICY event_comments_org_authenticated_read ON public.event_comments
  AS PERMISSIVE FOR SELECT TO public
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND event_org_matches(event_id)
  );

-- ============================================================================
-- TABLE: event_duties
-- ============================================================================
DROP POLICY IF EXISTS event_duties_org_authenticated_read ON public.event_duties;
CREATE POLICY event_duties_org_authenticated_read ON public.event_duties
  AS PERMISSIVE FOR SELECT TO public
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND event_org_matches(event_id)
  );

-- ============================================================================
-- TABLE: event_notifications
-- ============================================================================
DROP POLICY IF EXISTS event_notifications_select ON public.event_notifications;
CREATE POLICY event_notifications_select ON public.event_notifications
  AS PERMISSIVE FOR SELECT TO public
  USING (
    recipient_id = (SELECT auth.uid())
    OR user_has_role_in_org(org_id, ARRAY['admin'::text])
  );

DROP POLICY IF EXISTS event_notifications_update ON public.event_notifications;
CREATE POLICY event_notifications_update ON public.event_notifications
  AS PERMISSIVE FOR UPDATE TO public
  USING (
    recipient_id = (SELECT auth.uid())
    OR user_has_role_in_org(org_id, ARRAY['admin'::text])
  );

-- ============================================================================
-- TABLE: event_ride_claims
-- ============================================================================
DROP POLICY IF EXISTS ride_claims_delete ON public.event_ride_claims;
CREATE POLICY ride_claims_delete ON public.event_ride_claims
  AS PERMISSIVE FOR DELETE TO public
  USING (
    rider_user_id = (SELECT auth.uid())
    OR user_has_role_in_org(org_id, ARRAY['admin'::text])
  );

DROP POLICY IF EXISTS ride_claims_select ON public.event_ride_claims;
CREATE POLICY ride_claims_select ON public.event_ride_claims
  AS PERMISSIVE FOR SELECT TO public
  USING (
    rider_user_id = (SELECT auth.uid())
    OR offer_id IN (
      SELECT event_ride_offers.id FROM event_ride_offers
      WHERE event_ride_offers.driver_user_id = (SELECT auth.uid())
    )
    OR user_has_role_in_org(org_id, ARRAY['admin'::text, 'coach'::text])
  );

DROP POLICY IF EXISTS ride_claims_update ON public.event_ride_claims;
CREATE POLICY ride_claims_update ON public.event_ride_claims
  AS PERMISSIVE FOR UPDATE TO public
  USING (
    rider_user_id = (SELECT auth.uid())
    OR offer_id IN (
      SELECT event_ride_offers.id FROM event_ride_offers
      WHERE event_ride_offers.driver_user_id = (SELECT auth.uid())
    )
    OR user_has_role_in_org(org_id, ARRAY['admin'::text])
  );

-- ============================================================================
-- TABLE: event_ride_offers
-- ============================================================================
DROP POLICY IF EXISTS ride_offers_delete ON public.event_ride_offers;
CREATE POLICY ride_offers_delete ON public.event_ride_offers
  AS PERMISSIVE FOR DELETE TO public
  USING (
    driver_user_id = (SELECT auth.uid())
    OR user_has_role_in_org(org_id, ARRAY['admin'::text])
  );

DROP POLICY IF EXISTS ride_offers_insert ON public.event_ride_offers;
CREATE POLICY ride_offers_insert ON public.event_ride_offers
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (
    driver_user_id = (SELECT auth.uid())
    AND org_id = current_user_org_id()
  );

DROP POLICY IF EXISTS ride_offers_update ON public.event_ride_offers;
CREATE POLICY ride_offers_update ON public.event_ride_offers
  AS PERMISSIVE FOR UPDATE TO public
  USING (
    driver_user_id = (SELECT auth.uid())
    OR user_has_role_in_org(org_id, ARRAY['admin'::text])
  );

-- ============================================================================
-- TABLE: event_rsvps
-- ============================================================================
DROP POLICY IF EXISTS event_rsvps_org_authenticated_read ON public.event_rsvps;
CREATE POLICY event_rsvps_org_authenticated_read ON public.event_rsvps
  AS PERMISSIVE FOR SELECT TO public
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND event_org_matches(event_id)
  );

-- ============================================================================
-- TABLE: game_results
-- ============================================================================
DROP POLICY IF EXISTS game_results_select_parent ON public.game_results;
CREATE POLICY game_results_select_parent ON public.game_results
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    published_at IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM events e
      JOIN team_players tp ON tp.team_id = e.team_id
      JOIN player_guardians pg ON pg.player_id = tp.player_id
      JOIN guardians g ON g.id = pg.guardian_id
      WHERE e.id = game_results.event_id
        AND g.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS game_results_select_staff ON public.game_results;
CREATE POLICY game_results_select_staff ON public.game_results
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN events e ON e.id = game_results.event_id
      JOIN teams t ON t.id = e.team_id
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.organization_id = t.org_id
        AND ur.role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  );

DROP POLICY IF EXISTS game_results_write_staff ON public.game_results;
CREATE POLICY game_results_write_staff ON public.game_results
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN events e ON e.id = game_results.event_id
      JOIN teams t ON t.id = e.team_id
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.organization_id = t.org_id
        AND ur.role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN events e ON e.id = game_results.event_id
      JOIN teams t ON t.id = e.team_id
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.organization_id = t.org_id
        AND ur.role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  );

-- ============================================================================
-- TABLE: guardian_notification_prefs
-- ============================================================================
DROP POLICY IF EXISTS guardian_notification_prefs_self ON public.guardian_notification_prefs;
CREATE POLICY guardian_notification_prefs_self ON public.guardian_notification_prefs
  AS PERMISSIVE FOR ALL TO public
  USING (
    guardian_id IN (
      SELECT guardians.id FROM guardians
      WHERE guardians.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- TABLE: guardians
-- ============================================================================
DROP POLICY IF EXISTS guardians_select_own ON public.guardians;
CREATE POLICY guardians_select_own ON public.guardians
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS guardians_update_own ON public.guardians;
CREATE POLICY guardians_update_own ON public.guardians
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- TABLE: message_drafts
-- ============================================================================
DROP POLICY IF EXISTS message_drafts_read ON public.message_drafts;
CREATE POLICY message_drafts_read ON public.message_drafts
  AS PERMISSIVE FOR SELECT TO public
  USING (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS message_drafts_write ON public.message_drafts;
CREATE POLICY message_drafts_write ON public.message_drafts
  AS PERMISSIVE FOR ALL TO public
  USING (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  );

-- ============================================================================
-- TABLE: org_announcements
-- ============================================================================
DROP POLICY IF EXISTS org_announcements_read ON public.org_announcements;
CREATE POLICY org_announcements_read ON public.org_announcements
  AS PERMISSIVE FOR SELECT TO public
  USING (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS org_announcements_write ON public.org_announcements;
CREATE POLICY org_announcements_write ON public.org_announcements
  AS PERMISSIVE FOR ALL TO public
  USING (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'admin'::text
    )
  );

-- ============================================================================
-- TABLE: organization_settings
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage their org settings" ON public.organization_settings;
CREATE POLICY "Admins can manage their org settings" ON public.organization_settings
  AS PERMISSIVE FOR ALL TO public
  USING (
    organization_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'admin'::text
    )
  );

DROP POLICY IF EXISTS "Users can read their org settings" ON public.organization_settings;
CREATE POLICY "Users can read their org settings" ON public.organization_settings
  AS PERMISSIVE FOR SELECT TO public
  USING (
    organization_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- TABLE: organizations
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can read orgs" ON public.organizations;
CREATE POLICY "Authenticated users can read orgs" ON public.organizations
  AS PERMISSIVE FOR SELECT TO public
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- TABLE: player_tags
-- ============================================================================
DROP POLICY IF EXISTS player_tags_read ON public.player_tags;
CREATE POLICY player_tags_read ON public.player_tags
  AS PERMISSIVE FOR SELECT TO public
  USING (
    player_id IN (
      SELECT players.id FROM players
      WHERE players.org_id IN (
        SELECT user_roles.organization_id FROM user_roles
        WHERE user_roles.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS player_tags_write ON public.player_tags;
CREATE POLICY player_tags_write ON public.player_tags
  AS PERMISSIVE FOR ALL TO public
  USING (
    player_id IN (
      SELECT players.id FROM players
      WHERE players.org_id IN (
        SELECT user_roles.organization_id FROM user_roles
        WHERE user_roles.user_id = (SELECT auth.uid())
          AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
      )
    )
  );

-- ============================================================================
-- TABLE: team_achievements
-- ============================================================================
DROP POLICY IF EXISTS team_achievements_insert_coach ON public.team_achievements;
CREATE POLICY team_achievements_insert_coach ON public.team_achievements
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'coach'::text
    )
    AND is_pending_confirmation = true
    AND confirmed_at IS NULL
    AND confirmed_by IS NULL
  );

DROP POLICY IF EXISTS team_achievements_select_parent ON public.team_achievements;
CREATE POLICY team_achievements_select_parent ON public.team_achievements
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    is_pending_confirmation = false
    AND archived_at IS NULL
    AND org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'parent'::text
    )
  );

DROP POLICY IF EXISTS team_achievements_select_staff ON public.team_achievements;
CREATE POLICY team_achievements_select_staff ON public.team_achievements
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  );

DROP POLICY IF EXISTS team_achievements_write_admin ON public.team_achievements;
CREATE POLICY team_achievements_write_admin ON public.team_achievements
  AS PERMISSIVE FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'admin'::text
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'admin'::text
    )
  );

-- ============================================================================
-- TABLE: tournament_message_recipients
-- ============================================================================
DROP POLICY IF EXISTS tmr_read ON public.tournament_message_recipients;
CREATE POLICY tmr_read ON public.tournament_message_recipients
  AS PERMISSIVE FOR SELECT TO public
  USING (
    message_id IN (
      SELECT tournament_messages.id FROM tournament_messages
      WHERE tournament_messages.tournament_id IN (
        SELECT tournaments.id FROM tournaments
        WHERE tournaments.org_id IN (
          SELECT user_roles.organization_id FROM user_roles
          WHERE user_roles.user_id = (SELECT auth.uid())
        )
      )
    )
  );

DROP POLICY IF EXISTS tmr_write ON public.tournament_message_recipients;
CREATE POLICY tmr_write ON public.tournament_message_recipients
  AS PERMISSIVE FOR ALL TO public
  USING (
    message_id IN (
      SELECT tournament_messages.id FROM tournament_messages
      WHERE tournament_messages.tournament_id IN (
        SELECT tournaments.id FROM tournaments
        WHERE tournaments.org_id IN (
          SELECT user_roles.organization_id FROM user_roles
          WHERE user_roles.user_id = (SELECT auth.uid())
            AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
        )
      )
    )
  );

-- ============================================================================
-- TABLE: tournament_messages
-- ============================================================================
DROP POLICY IF EXISTS tournament_messages_read ON public.tournament_messages;
CREATE POLICY tournament_messages_read ON public.tournament_messages
  AS PERMISSIVE FOR SELECT TO public
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id FROM user_roles
        WHERE user_roles.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS tournament_messages_write ON public.tournament_messages;
CREATE POLICY tournament_messages_write ON public.tournament_messages
  AS PERMISSIVE FOR ALL TO public
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id FROM user_roles
        WHERE user_roles.user_id = (SELECT auth.uid())
          AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
      )
    )
  );

-- ============================================================================
-- TABLE: tournament_rosters
-- ============================================================================
DROP POLICY IF EXISTS tournament_rosters_read ON public.tournament_rosters;
CREATE POLICY tournament_rosters_read ON public.tournament_rosters
  AS PERMISSIVE FOR SELECT TO public
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id FROM user_roles
        WHERE user_roles.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS tournament_rosters_write ON public.tournament_rosters;
CREATE POLICY tournament_rosters_write ON public.tournament_rosters
  AS PERMISSIVE FOR ALL TO public
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id FROM user_roles
        WHERE user_roles.user_id = (SELECT auth.uid())
          AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
      )
    )
  );

-- ============================================================================
-- TABLE: tournament_teams
-- ============================================================================
DROP POLICY IF EXISTS tournament_teams_read ON public.tournament_teams;
CREATE POLICY tournament_teams_read ON public.tournament_teams
  AS PERMISSIVE FOR SELECT TO public
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id FROM user_roles
        WHERE user_roles.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS tournament_teams_write ON public.tournament_teams;
CREATE POLICY tournament_teams_write ON public.tournament_teams
  AS PERMISSIVE FOR ALL TO public
  USING (
    tournament_id IN (
      SELECT tournaments.id FROM tournaments
      WHERE tournaments.org_id IN (
        SELECT user_roles.organization_id FROM user_roles
        WHERE user_roles.user_id = (SELECT auth.uid())
          AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
      )
    )
  );

-- ============================================================================
-- TABLE: tournaments
-- ============================================================================
DROP POLICY IF EXISTS tournaments_read ON public.tournaments;
CREATE POLICY tournaments_read ON public.tournaments
  AS PERMISSIVE FOR SELECT TO public
  USING (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS tournaments_write ON public.tournaments;
CREATE POLICY tournaments_write ON public.tournaments
  AS PERMISSIVE FOR ALL TO public
  USING (
    org_id IN (
      SELECT user_roles.organization_id FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  );

-- ============================================================================
-- TABLE: user_preferences
-- ============================================================================
DROP POLICY IF EXISTS user_preferences_insert_own ON public.user_preferences;
CREATE POLICY user_preferences_insert_own ON public.user_preferences
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS user_preferences_select_own ON public.user_preferences;
CREATE POLICY user_preferences_select_own ON public.user_preferences
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS user_preferences_update_own ON public.user_preferences;
CREATE POLICY user_preferences_update_own ON public.user_preferences
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- TABLE: user_roles
-- ============================================================================
DROP POLICY IF EXISTS user_roles_self ON public.user_roles;
CREATE POLICY user_roles_self ON public.user_roles
  AS PERMISSIVE FOR ALL TO public
  USING (user_id = (SELECT auth.uid()));
