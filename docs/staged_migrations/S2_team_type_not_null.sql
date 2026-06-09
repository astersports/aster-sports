-- STAGED — NOT APPLIED. S2 / FORK-TEAMTYPE-NOTNULL (Direction A).
-- Ratified by the architect 2026-06-08. Apply AFTER S1 (the rollover RPC that
-- carries team_type_id forward) so no writer can present a typeless team to the
-- new constraint. Pre-flight live: teams=7, NULL team_type_id=0 -> SET NOT NULL
-- will not fail. FK is currently ON DELETE SET NULL (confdeltype='n').

ALTER TABLE teams ALTER COLUMN team_type_id SET NOT NULL;

ALTER TABLE teams DROP CONSTRAINT teams_team_type_id_fkey;
ALTER TABLE teams ADD CONSTRAINT teams_team_type_id_fkey
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
