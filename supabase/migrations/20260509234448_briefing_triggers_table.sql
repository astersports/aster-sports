-- L99 wave 4.1+4.2 foundation step M5: briefing_triggers — what auto-creates which drafts
-- Org-scoped, team-type-scoped. Each row says: when EVENT happens for a TEAM_TYPE, auto-draft KIND.

CREATE TABLE briefing_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_type_id uuid REFERENCES team_types(id) ON DELETE CASCADE,
  trigger_event text NOT NULL,
  briefing_kind text NOT NULL,
  template_slug text,
  lead_time_hours int,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT briefing_triggers_event_check CHECK (trigger_event = ANY (ARRAY[
    'game_completed', 'schedule_changed', 'tournament_approaching',
    'tournament_completed', 'weekly_sunday', 'rsvp_low_24h_before',
    'event_reminder_due'
  ])),
  CONSTRAINT briefing_triggers_kind_check CHECK (briefing_kind = ANY (ARRAY[
    'weekly_digest','schedule_change','game_recap','tournament_prelim',
    'tournament_recap','announcement','custom_message','rsvp_nudge',
    'academy_callup_notice'
  ]))
);

CREATE INDEX briefing_triggers_org_event_idx
  ON briefing_triggers(org_id, trigger_event) WHERE active = true;

ALTER TABLE briefing_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "briefing_triggers_read" ON briefing_triggers FOR SELECT
  USING (org_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

CREATE POLICY "briefing_triggers_write_admin" ON briefing_triggers FOR ALL
  USING (org_id IN (
    SELECT organization_id FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ))
  WITH CHECK (org_id IN (
    SELECT organization_id FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','super_admin')
  ));

WITH lh_org AS (SELECT id FROM organizations WHERE id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'),
     types AS (SELECT id, slug FROM team_types WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6')
INSERT INTO briefing_triggers (org_id, team_type_id, trigger_event, briefing_kind, lead_time_hours)
SELECT (SELECT id FROM lh_org), tt.id, e.trigger_event, e.briefing_kind, e.lead_time_hours
FROM types tt CROSS JOIN LATERAL (
  VALUES
    ('game_team', 'game_completed', 'game_recap', 0),
    ('game_team', 'schedule_changed', 'schedule_change', 0),
    ('game_team', 'weekly_sunday', 'weekly_digest', 0),
    ('game_team', 'rsvp_low_24h_before', 'rsvp_nudge', 24),
    ('tournament_team', 'tournament_approaching', 'tournament_prelim', 72),
    ('tournament_team', 'tournament_completed', 'tournament_recap', 0),
    ('tournament_team', 'schedule_changed', 'schedule_change', 0),
    ('tournament_team', 'weekly_sunday', 'weekly_digest', 0),
    ('tournament_team', 'rsvp_low_24h_before', 'rsvp_nudge', 24),
    ('hybrid_team', 'game_completed', 'game_recap', 0),
    ('hybrid_team', 'tournament_approaching', 'tournament_prelim', 72),
    ('hybrid_team', 'tournament_completed', 'tournament_recap', 0),
    ('hybrid_team', 'schedule_changed', 'schedule_change', 0),
    ('hybrid_team', 'weekly_sunday', 'weekly_digest', 0),
    ('hybrid_team', 'rsvp_low_24h_before', 'rsvp_nudge', 24),
    ('training_only', 'schedule_changed', 'schedule_change', 0),
    ('training_only', 'weekly_sunday', 'weekly_digest', 0),
    ('training_only', 'rsvp_low_24h_before', 'rsvp_nudge', 24),
    ('academy', 'schedule_changed', 'schedule_change', 0),
    ('academy', 'weekly_sunday', 'weekly_digest', 0),
    ('clinic_camp', 'schedule_changed', 'schedule_change', 0),
    ('clinic_camp', 'weekly_sunday', 'weekly_digest', 0)
) AS e(slug, trigger_event, briefing_kind, lead_time_hours)
WHERE tt.slug = e.slug;

DO $$
DECLARE trigger_count int;
BEGIN
  SELECT COUNT(*) INTO trigger_count FROM briefing_triggers
  WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6';
  IF trigger_count < 18 THEN
    RAISE EXCEPTION 'M5 fail: expected at least 18 triggers seeded, got %', trigger_count;
  END IF;
  RAISE NOTICE 'M5 verified: % triggers seeded for Legacy Hoopers', trigger_count;
END $$;
