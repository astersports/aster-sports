-- Migration 032: game_result_edits audit table + coach_highlight length CHECK
-- Wave 2A — Coach Quick-Score schema
-- Per IA Map v1.2 Decisions 5, 12, 13, 22, 23

CREATE TABLE game_result_edits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_result_id  uuid NOT NULL REFERENCES game_results(id) ON DELETE CASCADE,
  editor_user_id  uuid NOT NULL REFERENCES auth.users(id),
  editor_name     text NOT NULL,
  edited_at       timestamptz NOT NULL DEFAULT now(),
  fields_changed  jsonb NOT NULL,
  prior_values    jsonb NOT NULL
);

CREATE INDEX idx_game_result_edits_game_id ON game_result_edits(game_result_id);

ALTER TABLE game_result_edits ENABLE ROW LEVEL SECURITY;

-- Public SELECT: audit rows visible to anyone who can see the underlying game_result
-- (mirrors game_results_select_public — published_at IS NOT NULL gate)
CREATE POLICY game_result_edits_select_public ON game_result_edits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_results gr
      WHERE gr.id = game_result_id
        AND gr.published_at IS NOT NULL
    )
  );

-- INSERT restricted to admin + coach for the team owning the underlying event
-- (mirrors game_results_write_staff shape — user_roles join, NOT coaching_assignments)
CREATE POLICY game_result_edits_insert_staff ON game_result_edits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN game_results gr ON gr.id = game_result_id
      JOIN events e ON e.id = gr.event_id
      JOIN teams t ON t.id = e.team_id
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.organization_id = t.org_id
        AND ur.role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  );

-- coach_highlight length enforcement at DB layer (UI-side limit is for UX only)
ALTER TABLE game_results
  ADD CONSTRAINT game_results_coach_highlight_length
  CHECK (coach_highlight IS NULL OR char_length(coach_highlight) <= 140);
