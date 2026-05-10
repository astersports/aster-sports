-- L99 wave 4.1+4.2 foundation step M3:
--  (a) Add team_type_id to teams (nullable for backward compat)
--  (b) Seed the 6 canonical team types for Legacy Hoopers
--  (c) Assign existing 5 teams based on actual event distribution audit:
--      10U Blue (8 games, 0 tournaments) -> game_team
--      9U Boys  (8 games, 0 tournaments) -> game_team
--      8U Boys  (0 games, 13 tournaments) -> tournament_team
--      10U Black (0 games, 13 tournaments) -> tournament_team
--      11U Girls (1 game, 11 tournaments) -> hybrid_team

ALTER TABLE teams ADD COLUMN team_type_id uuid REFERENCES team_types(id) ON DELETE SET NULL;
CREATE INDEX teams_team_type_id_idx ON teams(team_type_id);

INSERT INTO team_types (org_id, slug, display_name, description, default_briefing_kinds, default_audience_rules, sort_order) VALUES
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'game_team', 'Game Team',
   'League-play teams with weekly games (e.g. WPCYO, parish league)',
   ARRAY['weekly_digest','game_recap','schedule_change','rsvp_nudge','announcement','custom_message'],
   '{"default_audience_type":"team","include_event_types":["game","practice"]}'::jsonb, 1),

  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'tournament_team', 'Tournament Team',
   'AAU travel teams in tournament circuits (no league play)',
   ARRAY['weekly_digest','tournament_prelim','tournament_recap','schedule_change','rsvp_nudge','announcement','custom_message'],
   '{"default_audience_type":"team","include_event_types":["tournament","practice"]}'::jsonb, 2),

  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'hybrid_team', 'Hybrid Team',
   'Both league play and tournament participation',
   ARRAY['weekly_digest','game_recap','tournament_prelim','tournament_recap','schedule_change','rsvp_nudge','announcement','custom_message'],
   '{"default_audience_type":"team","include_event_types":["game","tournament","practice"]}'::jsonb, 3),

  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'training_only', 'Training-Only Team',
   'Skills development programs, no games or tournaments',
   ARRAY['weekly_digest','schedule_change','rsvp_nudge','announcement','custom_message'],
   '{"default_audience_type":"team","include_event_types":["practice","skills_lab"]}'::jsonb, 4),

  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'academy', 'Academy / Futures',
   'Development pipeline programs (Futures Academy)',
   ARRAY['weekly_digest','academy_callup_notice','schedule_change','announcement','custom_message'],
   '{"default_audience_type":"team","include_event_types":["practice","tryout","skills_lab"]}'::jsonb, 5),

  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'clinic_camp', 'Clinic / Camp',
   'Time-bounded programs (camps, weekend clinics)',
   ARRAY['weekly_digest','schedule_change','announcement','custom_message'],
   '{"default_audience_type":"team","include_event_types":["practice","other"]}'::jsonb, 6);

UPDATE teams SET team_type_id = (
  SELECT id FROM team_types
  WHERE slug='game_team' AND org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'
)
WHERE id IN (
  '13abc98d-5e88-4fe0-8929-690add6e2bdd',
  '0366db32-e9ae-454b-a43c-504bb150c77f'
);

UPDATE teams SET team_type_id = (
  SELECT id FROM team_types
  WHERE slug='tournament_team' AND org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'
)
WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND name IN ('10U Black', '8U Boys');

UPDATE teams SET team_type_id = (
  SELECT id FROM team_types
  WHERE slug='hybrid_team' AND org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'
)
WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND name='11U Girls';

DO $$
DECLARE
  unassigned_count int;
BEGIN
  SELECT COUNT(*) INTO unassigned_count
  FROM teams
  WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND team_type_id IS NULL;

  IF unassigned_count > 0 THEN
    RAISE EXCEPTION 'M3 fail: % Legacy Hoopers teams unassigned', unassigned_count;
  END IF;

  IF (SELECT COUNT(*) FROM team_types WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6') != 6 THEN
    RAISE EXCEPTION 'M3 fail: expected 6 team types seeded for Legacy Hoopers';
  END IF;

  RAISE NOTICE 'M3 verified: 6 team types seeded, 5 teams assigned';
END $$;
