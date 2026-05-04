-- Wave 1H: RLS hygiene — add WITH CHECK to all FOR ALL policies
-- Per CLAUDE.md anti-pattern #20: cmd='ALL' policies must always have
-- explicit with_check. Without it, any column values that pass the
-- USING qual are writable with zero constraint on the data.
--
-- Pattern: WITH CHECK mirrors the existing USING clause exactly.
-- This is the minimum-risk fix — it doesn't change who can write,
-- it ensures writes are constrained to the same scope as reads.

-- 1. championship_scenarios
DROP POLICY IF EXISTS scenarios_write ON public.championship_scenarios;
CREATE POLICY scenarios_write ON public.championship_scenarios
  FOR ALL TO authenticated
  USING (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      WHERE t.org_id IN (
        SELECT ur.organization_id FROM user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role IN ('admin', 'coach')
      )
    )
  )
  WITH CHECK (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      WHERE t.org_id IN (
        SELECT ur.organization_id FROM user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role IN ('admin', 'coach')
      )
    )
  );

-- 2. check_ins
DROP POLICY IF EXISTS "Coaches can manage check_ins" ON public.check_ins;
CREATE POLICY "Coaches can manage check_ins" ON public.check_ins
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN teams t ON t.id = e.team_id
      JOIN user_roles ur ON ur.organization_id = t.org_id
      WHERE e.id = check_ins.event_id
        AND ur.user_id = (SELECT auth.uid())
        AND ur.role IN ('admin', 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN teams t ON t.id = e.team_id
      JOIN user_roles ur ON ur.organization_id = t.org_id
      WHERE e.id = check_ins.event_id
        AND ur.user_id = (SELECT auth.uid())
        AND ur.role IN ('admin', 'coach')
    )
  );

-- 3. circuit_rules
DROP POLICY IF EXISTS circuit_rules_write ON public.circuit_rules;
CREATE POLICY circuit_rules_write ON public.circuit_rules
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'admin'
    )
  );

-- 4. coaching_assignments
DROP POLICY IF EXISTS coaching_assignments_write ON public.coaching_assignments;
CREATE POLICY coaching_assignments_write ON public.coaching_assignments
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'admin'
    )
  );

-- 5. guardian_notification_prefs
DROP POLICY IF EXISTS guardian_notification_prefs_self ON public.guardian_notification_prefs;
CREATE POLICY guardian_notification_prefs_self ON public.guardian_notification_prefs
  FOR ALL TO authenticated
  USING (
    guardian_id IN (
      SELECT g.id FROM guardians g
      WHERE g.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    guardian_id IN (
      SELECT g.id FROM guardians g
      WHERE g.user_id = (SELECT auth.uid())
    )
  );

-- 6. organization_settings
DROP POLICY IF EXISTS "Admins can manage their org settings" ON public.organization_settings;
CREATE POLICY "Admins can manage their org settings" ON public.organization_settings
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'admin'
    )
  );

-- 7. player_tags
DROP POLICY IF EXISTS player_tags_write ON public.player_tags;
CREATE POLICY player_tags_write ON public.player_tags
  FOR ALL TO authenticated
  USING (
    player_id IN (
      SELECT p.id FROM players p
      WHERE p.org_id IN (
        SELECT ur.organization_id FROM user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role IN ('admin', 'coach')
      )
    )
  )
  WITH CHECK (
    player_id IN (
      SELECT p.id FROM players p
      WHERE p.org_id IN (
        SELECT ur.organization_id FROM user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role IN ('admin', 'coach')
      )
    )
  );

-- 8. tournament_message_recipients
DROP POLICY IF EXISTS tmr_write ON public.tournament_message_recipients;
CREATE POLICY tmr_write ON public.tournament_message_recipients
  FOR ALL TO authenticated
  USING (
    message_id IN (
      SELECT tm.id FROM tournament_messages tm
      WHERE tm.tournament_id IN (
        SELECT t.id FROM tournaments t
        WHERE t.org_id IN (
          SELECT ur.organization_id FROM user_roles ur
          WHERE ur.user_id = (SELECT auth.uid())
            AND ur.role IN ('admin', 'coach')
        )
      )
    )
  )
  WITH CHECK (
    message_id IN (
      SELECT tm.id FROM tournament_messages tm
      WHERE tm.tournament_id IN (
        SELECT t.id FROM tournaments t
        WHERE t.org_id IN (
          SELECT ur.organization_id FROM user_roles ur
          WHERE ur.user_id = (SELECT auth.uid())
            AND ur.role IN ('admin', 'coach')
        )
      )
    )
  );

-- 9. tournament_messages
DROP POLICY IF EXISTS tournament_messages_write ON public.tournament_messages;
CREATE POLICY tournament_messages_write ON public.tournament_messages
  FOR ALL TO authenticated
  USING (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      WHERE t.org_id IN (
        SELECT ur.organization_id FROM user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role IN ('admin', 'coach')
      )
    )
  )
  WITH CHECK (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      WHERE t.org_id IN (
        SELECT ur.organization_id FROM user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role IN ('admin', 'coach')
      )
    )
  );

-- 10. tournament_rosters
DROP POLICY IF EXISTS tournament_rosters_write ON public.tournament_rosters;
CREATE POLICY tournament_rosters_write ON public.tournament_rosters
  FOR ALL TO authenticated
  USING (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      WHERE t.org_id IN (
        SELECT ur.organization_id FROM user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role IN ('admin', 'coach')
      )
    )
  )
  WITH CHECK (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      WHERE t.org_id IN (
        SELECT ur.organization_id FROM user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role IN ('admin', 'coach')
      )
    )
  );

-- 11. tournament_teams
DROP POLICY IF EXISTS tournament_teams_write ON public.tournament_teams;
CREATE POLICY tournament_teams_write ON public.tournament_teams
  FOR ALL TO authenticated
  USING (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      WHERE t.org_id IN (
        SELECT ur.organization_id FROM user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role IN ('admin', 'coach')
      )
    )
  )
  WITH CHECK (
    tournament_id IN (
      SELECT t.id FROM tournaments t
      WHERE t.org_id IN (
        SELECT ur.organization_id FROM user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role IN ('admin', 'coach')
      )
    )
  );

-- 12. tournaments
DROP POLICY IF EXISTS tournaments_write ON public.tournaments;
CREATE POLICY tournaments_write ON public.tournaments
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role IN ('admin', 'coach')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role IN ('admin', 'coach')
    )
  );

-- 13. user_roles (self-manage)
DROP POLICY IF EXISTS user_roles_self ON public.user_roles;
CREATE POLICY user_roles_self ON public.user_roles
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 14. opponents (from 011_tournaments.sql)
DROP POLICY IF EXISTS opponents_org_isolation ON public.opponents;
CREATE POLICY opponents_org_isolation ON public.opponents
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT ur.organization_id FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
    )
  );

NOTIFY pgrst, 'reload schema';
