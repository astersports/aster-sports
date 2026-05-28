-- Mirror file backfilled 2026-05-28 from supabase_migrations.schema_migrations.statements per Wave 2.A audit #23 P0-1.
-- Original SQL applied via chat-side claude.ai MCP without same-turn mirror; this file restores the AP #21 mirror invariant.
-- Migration 035: Data corrections
-- 1. Resurrection School address + coords (was Staten Island data, should be Rye)
-- 2. AAU jersey rule: 'Both' → 'Black' (Frank: black is our neutral default)

-- 1. Fix Resurrection School address + coords
-- Real Resurrection School in Rye is at: 26 Highland Pl, Rye, NY 10580
-- Lat 41.0029, Lon -73.6862 (verified Westchester County)
UPDATE locations
SET
  address = '26 Highland Pl, Rye, NY 10580',
  lat = 41.0029,
  lon = -73.6862,
  updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND name = 'Resurrection School - Doty Gym';

-- 2. AAU jersey: change all upcoming AAU game/tournament events from 'Both' to 'Black'
UPDATE events e
SET jersey = 'Black'
FROM teams t
WHERE e.team_id = t.id
  AND t.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND t.circuit = 'aau'
  AND e.start_at >= now()
  AND e.event_type IN ('game','tournament')
  AND e.jersey = 'Both';
