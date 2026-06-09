-- H-3 / Direction A — close the teams.team_type_id integrity gap. team_type_id
-- SET NOT NULL + FK SET NULL -> ON DELETE RESTRICT, so a typeless team cannot be
-- inserted (no phantom-competitive standings row) and an in-use team_type cannot
-- be deleted out from under its teams. Pre-flight clean (7 teams, 0 NULL). Gated
-- behind B-PR3 (#881): the rollover RPC carries team_type_id forward + the old
-- omitting client path was already replaced. Authored + applied by the architect
-- via MCP 2026-06-09; AP#21 mirror (verbatim). Supersedes the staged S2.
ALTER TABLE public.teams ALTER COLUMN team_type_id SET NOT NULL;
ALTER TABLE public.teams DROP CONSTRAINT teams_team_type_id_fkey;
ALTER TABLE public.teams ADD CONSTRAINT teams_team_type_id_fkey
  FOREIGN KEY (team_type_id) REFERENCES team_types(id) ON DELETE RESTRICT;

DO $$
BEGIN
  IF (SELECT is_nullable FROM information_schema.columns
        WHERE table_name='teams' AND column_name='team_type_id') <> 'NO' THEN
    RAISE EXCEPTION 'verify failed: teams.team_type_id still nullable';
  END IF;
  IF (SELECT confdeltype FROM pg_constraint
        WHERE conname='teams_team_type_id_fkey') <> 'r' THEN
    RAISE EXCEPTION 'verify failed: FK not ON DELETE RESTRICT';
  END IF;
END $$;
