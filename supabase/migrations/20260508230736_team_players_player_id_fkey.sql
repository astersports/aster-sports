-- 20260508230736_team_players_player_id_fkey.sql
-- Mirror of production migration applied via Supabase MCP on May 8, 2026.
-- Adds the missing FK constraint from team_players.player_id to
-- players(id) — surfaced when useTeamRecipients started returning 0
-- guardians for 11U Girls in production despite the data being intact.
--
-- Root cause: PostgREST resolves embedded selects like
-- `team_players.select('*, players!inner(...)')` via FK metadata. The
-- player_id column existed on team_players but had no FK constraint,
-- so the embed silently returned empty rows. Adding the FK restores
-- the embed.
--
-- Verified pre-apply: 0 orphan team_players rows (every player_id
-- already matches a real players.id). Constraint adds cleanly.
--
-- ON DELETE CASCADE: deleting a player removes their team membership
-- rows. Matches existing semantics.

ALTER TABLE public.team_players
  ADD CONSTRAINT team_players_player_id_fkey
  FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.team_players'::regclass
      AND conname = 'team_players_player_id_fkey'
  ) THEN
    RAISE EXCEPTION 'FK team_players_player_id_fkey not created';
  END IF;
END $$;
