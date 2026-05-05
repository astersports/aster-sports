-- Phase 5-B: Live scoring — game_plays table for play-by-play
-- team_id dropped (derive from event). points dropped (derive from play_type).
-- is_voided for soft-delete corrections.

CREATE TABLE IF NOT EXISTS public.game_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  play_type text NOT NULL CHECK (play_type IN (
    'fg2_made','fg2_miss','fg3_made','fg3_miss','ft_made','ft_miss',
    'rebound','assist','steal','block','turnover','foul',
    'sub_in','sub_out','timeout'
  )),
  period integer NOT NULL DEFAULT 1 CHECK (period BETWEEN 1 AND 8),
  is_opponent boolean NOT NULL DEFAULT false,
  is_voided boolean NOT NULL DEFAULT false,
  voided_at timestamptz,
  voided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT game_plays_opponent_no_player CHECK (NOT (is_opponent AND player_id IS NOT NULL))
);

CREATE INDEX idx_game_plays_event ON public.game_plays (event_id, created_at);
CREATE INDEX idx_game_plays_player ON public.game_plays (player_id) WHERE player_id IS NOT NULL;
CREATE INDEX idx_game_plays_active ON public.game_plays (event_id) WHERE is_voided = false;

ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY game_plays_select ON public.game_plays
  FOR SELECT TO authenticated
  USING (event_id IN (
    SELECT e.id FROM events e
    JOIN teams t ON t.id = e.team_id
    JOIN user_roles ur ON ur.organization_id = t.org_id
    WHERE ur.user_id = (SELECT auth.uid())
  ));

CREATE POLICY game_plays_write ON public.game_plays
  FOR ALL TO authenticated
  USING (event_id IN (
    SELECT e.id FROM events e
    JOIN teams t ON t.id = e.team_id
    JOIN user_roles ur ON ur.organization_id = t.org_id
    WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = ANY (ARRAY['admin','coach'])
  ))
  WITH CHECK (event_id IN (
    SELECT e.id FROM events e
    JOIN teams t ON t.id = e.team_id
    JOIN user_roles ur ON ur.organization_id = t.org_id
    WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = ANY (ARRAY['admin','coach'])
  ));

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_plays;
