-- 5-C.1: Player game stats + quarter scores schema
-- Supports both Ember-native live scoring aggregation and GameChanger PDF import

CREATE TABLE IF NOT EXISTS public.player_game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  jersey_at_time text,
  pts integer NOT NULL DEFAULT 0,
  pf integer NOT NULL DEFAULT 0,
  fg_made integer NOT NULL DEFAULT 0,
  fg_att integer NOT NULL DEFAULT 0,
  three_made integer NOT NULL DEFAULT 0,
  three_att integer NOT NULL DEFAULT 0,
  ft_made integer NOT NULL DEFAULT 0,
  ft_att integer NOT NULL DEFAULT 0,
  to_count integer NOT NULL DEFAULT 0,
  orb integer NOT NULL DEFAULT 0,
  drb integer NOT NULL DEFAULT 0,
  reb integer NOT NULL DEFAULT 0,
  ast integer NOT NULL DEFAULT 0,
  stl integer NOT NULL DEFAULT 0,
  blk integer NOT NULL DEFAULT 0,
  plus_minus integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'ember_live' CHECK (source IN ('ember_live', 'gamechanger_pdf', 'manual')),
  source_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.quarter_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_side text NOT NULL CHECK (team_side IN ('us', 'opponent')),
  quarter integer NOT NULL CHECK (quarter BETWEEN 1 AND 8),
  points integer NOT NULL DEFAULT 0,
  team_fouls integer NOT NULL DEFAULT 0,
  UNIQUE (event_id, team_side, quarter)
);

ALTER TABLE public.game_results
  ADD COLUMN IF NOT EXISTS has_player_stats boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_quarter_scores boolean NOT NULL DEFAULT false;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS gamechanger_team_alias text;

CREATE INDEX idx_pgs_event ON public.player_game_stats (event_id);
CREATE INDEX idx_pgs_player ON public.player_game_stats (player_id);
CREATE INDEX idx_pgs_team_season ON public.player_game_stats (team_id, org_id);
CREATE INDEX idx_quarter_scores_event ON public.quarter_scores (event_id);

ALTER TABLE public.player_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarter_scores ENABLE ROW LEVEL SECURITY;

-- Admin/coach full access
CREATE POLICY pgs_staff ON public.player_game_stats FOR ALL TO authenticated
  USING (org_id IN (SELECT ur.organization_id FROM user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = ANY(ARRAY['admin','coach'])))
  WITH CHECK (org_id IN (SELECT ur.organization_id FROM user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = ANY(ARRAY['admin','coach'])));

-- Parent reads own children's stats
CREATE POLICY pgs_parent ON public.player_game_stats FOR SELECT TO authenticated
  USING (player_id IN (
    SELECT pg.player_id FROM player_guardians pg
    JOIN guardians g ON g.id = pg.guardian_id
    WHERE g.user_id = (SELECT auth.uid())
  ));

CREATE POLICY qs_staff ON public.quarter_scores FOR ALL TO authenticated
  USING (event_id IN (
    SELECT e.id FROM events e JOIN teams t ON t.id = e.team_id
    JOIN user_roles ur ON ur.organization_id = t.org_id
    WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = ANY(ARRAY['admin','coach'])
  ))
  WITH CHECK (event_id IN (
    SELECT e.id FROM events e JOIN teams t ON t.id = e.team_id
    JOIN user_roles ur ON ur.organization_id = t.org_id
    WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = ANY(ARRAY['admin','coach'])
  ));

CREATE POLICY qs_parent ON public.quarter_scores FOR SELECT TO authenticated
  USING (event_id IN (
    SELECT e.id FROM events e JOIN teams t ON t.id = e.team_id
    JOIN user_roles ur ON ur.organization_id = t.org_id
    WHERE ur.user_id = (SELECT auth.uid())
  ));
