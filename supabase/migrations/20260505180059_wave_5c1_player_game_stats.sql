-- Wave 5-C.1: player_game_stats snapshot table
-- Applied: 2026-05-05 18:00:59 UTC via Supabase MCP apply_migration
-- Project: vrwwpsbfbnveawqwbdmj (Legacy Hoopers / Ember / Ember)
--
-- Per-game per-player stat line, populated by either:
--   (Path A) Aggregating game_plays via finalizePlayerStats on coach "End game" tap
--   (Path B) Importing GameChanger PDF box scores (future)
--   (Path C) Manual admin entry (escape hatch)
--
-- quarter_scores remains in game_results.quarter_scores JSONB (existing column).
-- No separate quarter_scores table is created — the JSONB is sufficient for
-- the read-mostly per-game data and avoids unnecessary table proliferation.
--
-- Schema decisions:
--   - jersey_at_time text snapshot from team_players.jersey_number at finalize
--     (jersey can change mid-season but historic games keep the original)
--   - source enum tracks data origin for trust/debugging
--   - Append-conscious but NOT append-only: stats are corrective during/after games
--   - reb is denormalized (= orb + drb), enforced by CHECK
--   - 3PT made/att are subset of FG made/att (made 3 = made FG)
--   - RLS: parents see own children only via current_user_player_ids()

CREATE TABLE public.player_game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  jersey_at_time text,

  pts integer NOT NULL DEFAULT 0 CHECK (pts >= 0),
  pf integer NOT NULL DEFAULT 0 CHECK (pf >= 0),
  fg_made integer NOT NULL DEFAULT 0 CHECK (fg_made >= 0),
  fg_att integer NOT NULL DEFAULT 0 CHECK (fg_att >= 0),
  three_made integer NOT NULL DEFAULT 0 CHECK (three_made >= 0),
  three_att integer NOT NULL DEFAULT 0 CHECK (three_att >= 0),
  ft_made integer NOT NULL DEFAULT 0 CHECK (ft_made >= 0),
  ft_att integer NOT NULL DEFAULT 0 CHECK (ft_att >= 0),
  to_count integer NOT NULL DEFAULT 0 CHECK (to_count >= 0),
  orb integer NOT NULL DEFAULT 0 CHECK (orb >= 0),
  drb integer NOT NULL DEFAULT 0 CHECK (drb >= 0),
  reb integer NOT NULL DEFAULT 0 CHECK (reb >= 0),
  ast integer NOT NULL DEFAULT 0 CHECK (ast >= 0),
  stl integer NOT NULL DEFAULT 0 CHECK (stl >= 0),
  blk integer NOT NULL DEFAULT 0 CHECK (blk >= 0),
  plus_minus integer NOT NULL DEFAULT 0,

  source text NOT NULL CHECK (source IN ('ember_live','gamechanger_pdf','manual')),
  source_ref text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, player_id),

  CONSTRAINT pgs_fg_consistency CHECK (fg_made <= fg_att),
  CONSTRAINT pgs_three_consistency CHECK (three_made <= three_att),
  CONSTRAINT pgs_ft_consistency CHECK (ft_made <= ft_att),
  CONSTRAINT pgs_reb_consistency CHECK (reb = orb + drb),
  CONSTRAINT pgs_three_subset_fg CHECK (three_made <= fg_made AND three_att <= fg_att)
);

CREATE INDEX idx_pgs_event ON public.player_game_stats (event_id);
CREATE INDEX idx_pgs_player_team ON public.player_game_stats (player_id, team_id);
CREATE INDEX idx_pgs_team_event ON public.player_game_stats (team_id, event_id);

ALTER TABLE public.game_results
  ADD COLUMN has_player_stats boolean NOT NULL DEFAULT false;

ALTER TABLE public.teams
  ADD COLUMN gamechanger_team_alias text;

CREATE INDEX idx_teams_gc_alias ON public.teams (gamechanger_team_alias) WHERE gamechanger_team_alias IS NOT NULL;

ALTER TABLE public.player_game_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY pgs_parent_read ON public.player_game_stats
  FOR SELECT TO authenticated
  USING (player_id = ANY (current_user_player_ids()));

CREATE POLICY pgs_staff_all ON public.player_game_stats
  FOR ALL TO authenticated
  USING (user_has_role_in_org(org_id, ARRAY['admin','coach']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin','coach']));

CREATE OR REPLACE FUNCTION public.tg_player_game_stats_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER player_game_stats_updated_at
  BEFORE UPDATE ON public.player_game_stats
  FOR EACH ROW EXECUTE FUNCTION public.tg_player_game_stats_updated_at();

DO $$
DECLARE
  rls_enabled boolean;
  policy_count int;
BEGIN
  SELECT relrowsecurity INTO rls_enabled FROM pg_class
    WHERE oid = 'public.player_game_stats'::regclass;
  IF NOT rls_enabled THEN RAISE EXCEPTION 'RLS not enabled on player_game_stats'; END IF;

  SELECT COUNT(*) INTO policy_count FROM pg_policies
    WHERE schemaname='public' AND tablename='player_game_stats';
  IF policy_count <> 2 THEN RAISE EXCEPTION 'Expected 2 policies, got %', policy_count; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='game_results' AND column_name='has_player_stats')
  THEN RAISE EXCEPTION 'has_player_stats column missing'; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='teams' AND column_name='gamechanger_team_alias')
  THEN RAISE EXCEPTION 'gamechanger_team_alias column missing'; END IF;
END $$;
