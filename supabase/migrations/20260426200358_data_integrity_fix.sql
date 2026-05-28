-- Mirror file backfilled 2026-05-28 from supabase_migrations.schema_migrations.statements per Wave 2.A audit #23 P0-1.
-- Original SQL applied via chat-side claude.ai MCP without same-turn mirror; this file restores the AP #21 mirror invariant.
-- Migration 034: Data Integrity Fix
-- Tournament schedule_status, jersey defaults (LP=Black/AAU=Both), arrival defaults
-- Idempotent: only updates NULL values

-- 1. Tournament schedule_status: ensure draft state for unconfirmed tournaments
UPDATE tournaments
SET schedule_status = 'draft'
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND start_date >= now()::date
  AND primary_venue IS NULL
  AND schedule_status IS DISTINCT FROM 'draft';

-- 2. Default jersey: League Play = Black (home), AAU = Both (bring both)
UPDATE events e
SET jersey = CASE
  WHEN t.circuit = 'league_play' THEN 'Black'
  WHEN t.circuit = 'aau' THEN 'Both'
  ELSE 'Black'
END
FROM teams t
WHERE e.team_id = t.id
  AND t.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND e.start_at >= now()
  AND e.event_type IN ('game','tournament')
  AND e.jersey IS NULL;

-- 3. Default arrival: games/tournaments = 30, practices = 15, others = 10
UPDATE events e
SET arrival_minutes_before = CASE
  WHEN e.event_type IN ('game','tournament') THEN 30
  WHEN e.event_type = 'practice' THEN 15
  ELSE 10
END
FROM teams t
WHERE e.team_id = t.id
  AND t.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND e.start_at >= now()
  AND e.arrival_minutes_before IS NULL;
