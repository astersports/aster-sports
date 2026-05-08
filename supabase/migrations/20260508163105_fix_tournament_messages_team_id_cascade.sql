-- 20260508163105_fix_tournament_messages_team_id_cascade.sql
-- Mirror of production migration applied via Supabase MCP on May 8, 2026.
-- Switches tournament_messages.team_id FK from CASCADE to SET NULL to
-- preserve the briefing audit trail when a team is deleted. CASCADE was
-- the unintended landing on the original ghost-applied team_id column;
-- SET NULL was the spec.

ALTER TABLE public.tournament_messages
  DROP CONSTRAINT tournament_messages_team_id_fkey;

ALTER TABLE public.tournament_messages
  ADD CONSTRAINT tournament_messages_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.tournament_messages.team_id IS
  'Team this briefing addresses. NULL allowed for cross-team messages '
  '(multi_team_notice, schedule_change, custom) and pre-feature historical rows. '
  'SET NULL on team delete to preserve audit trail.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tournament_messages'::regclass
      AND conname = 'tournament_messages_team_id_fkey'
      AND pg_get_constraintdef(oid) ILIKE '%ON DELETE SET NULL%'
  ) THEN
    RAISE EXCEPTION 'FK switch failed';
  END IF;
END $$;
