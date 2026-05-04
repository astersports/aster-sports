-- Phase 5-B: Live scoring — game_plays table for play-by-play
-- Each row is one scoring event, stat, or game action.

CREATE TABLE IF NOT EXISTS public.game_plays (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_id     uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id   uuid REFERENCES public.players(id) ON DELETE SET NULL,
  play_type   text NOT NULL CHECK (play_type IN (
    'fg2_made', 'fg2_miss', 'fg3_made', 'fg3_miss',
    'ft_made', 'ft_miss',
    'rebound', 'assist', 'steal', 'block', 'turnover', 'foul',
    'sub_in', 'sub_out', 'timeout'
  )),
  points      integer NOT NULL DEFAULT 0,
  period      integer NOT NULL DEFAULT 1,
  is_opponent  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_game_plays_event ON public.game_plays (event_id, created_at);
CREATE INDEX idx_game_plays_player ON public.game_plays (player_id) WHERE player_id IS NOT NULL;

ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY game_plays_select ON public.game_plays
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN teams t ON t.id = e.team_id
      JOIN user_roles ur ON ur.organization_id = t.org_id
      WHERE ur.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY game_plays_write ON public.game_plays
  FOR ALL TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN teams t ON t.id = e.team_id
      JOIN user_roles ur ON ur.organization_id = t.org_id
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role IN ('admin', 'coach')
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT e.id FROM events e
      JOIN teams t ON t.id = e.team_id
      JOIN user_roles ur ON ur.organization_id = t.org_id
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role IN ('admin', 'coach')
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_plays;
