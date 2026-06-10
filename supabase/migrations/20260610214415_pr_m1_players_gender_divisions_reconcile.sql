-- M1 (programs redesign) — players.gender + divisions.gender reconcile + backfill.
-- Spec: PROGRAMS_RULINGS_RESPEC Part C. Frank GO 2026-06-10.
--
-- Unblocks B3's StepPlayer gender capture (male/female for a new player) and
-- the M2 hard-mismatch enforcement that follows capture. Mirror of the MCP
-- apply (AP#21) — version string 20260610214415 is the production version.
--
-- Pre-flight (live, 2026-06-10): players.gender absent; divisions.gender CHECK
-- was M/F over 0 rows (nullable, no default → straight swap); roster_members
-- carries (player_id, team_id); teams.gender ∈ {null, female, male}. Dry-run:
-- 63/115 players resolve to exactly one distinct non-null team gender,
-- 0 multi-gender conflicts, 52 stay null (only on the two ungendered 10U teams
-- or no team) — M2 enforcement skips null.

-- 1. players.gender (nullable; CHECK male/female). M2 enforcement (hard mismatch
--    vs the chosen division) lands after B3 capture; nullable here so the 52
--    players with no gendered team stay null and M2 skips them.
ALTER TABLE players ADD COLUMN gender text;
ALTER TABLE players ADD CONSTRAINT players_gender_check
  CHECK (gender IS NULL OR gender = ANY (ARRAY['male', 'female']));

-- 2. divisions.gender CHECK reconcile M/F -> male/female/coed. 0 rows, nullable,
--    no default -> straight drop+add.
ALTER TABLE divisions DROP CONSTRAINT divisions_gender_check;
ALTER TABLE divisions ADD CONSTRAINT divisions_gender_check
  CHECK (gender IS NULL OR gender = ANY (ARRAY['male', 'female', 'coed']));

-- 3. Backfill players.gender from the player's gendered team(s) where exactly one
--    distinct non-null team gender exists (63 players; 0 conflicts; the two
--    ungendered 10U teams leave 52 players null by design).
UPDATE players p
SET gender = sub.g
FROM (
  SELECT rm.player_id, MIN(t.gender) AS g
  FROM roster_members rm
  JOIN teams t ON t.id = rm.team_id
  WHERE t.gender IS NOT NULL
  GROUP BY rm.player_id
  HAVING COUNT(DISTINCT t.gender) = 1
) sub
WHERE p.id = sub.player_id;
