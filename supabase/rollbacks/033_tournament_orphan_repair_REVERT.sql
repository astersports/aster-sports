-- ============================================================
-- 033_tournament_orphan_repair_REVERT.sql
-- WARNING: Destroys 6 tournament records and unlinks 34 events.
-- Use only for emergency rollback.
-- ============================================================

BEGIN;

UPDATE public.events
SET tournament_id = NULL
WHERE tournament_id IN (
  SELECT id FROM tournaments
  WHERE name IN (
    'NY Metro Showdown',
    'Rumble for the Ring CT',
    '2026 Zero Gravity Girls National Finals',
    '2026 Zero Gravity Boys National Finals',
    'BBallShootout: Pre Summer Hoops Jam Classic',
    'Zero Gravity NY Hoop Festival'
  )
);

DELETE FROM tournaments
WHERE name IN (
  'NY Metro Showdown',
  'Rumble for the Ring CT',
  '2026 Zero Gravity Girls National Finals',
  '2026 Zero Gravity Boys National Finals',
  'BBallShootout: Pre Summer Hoops Jam Classic',
  'Zero Gravity NY Hoop Festival'
);

NOTIFY pgrst, 'reload schema';

COMMIT;
