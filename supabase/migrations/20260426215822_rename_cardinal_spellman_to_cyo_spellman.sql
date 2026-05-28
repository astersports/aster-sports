-- Mirror file backfilled 2026-05-28 from supabase_migrations.schema_migrations.statements per Wave 2.A audit #23 P0-1.
-- Original SQL applied via chat-side claude.ai MCP without same-turn mirror; this file restores the AP #21 mirror invariant.
-- Migration 038: Rename Cardinal Spellman HS → CYO Spellman + add parking + $30 fee note
-- Updates BOTH locations.name AND events.location text (9 events) so ilike text match still works

-- 1. Rename venue + enrich entry_instructions
UPDATE locations
SET
  name = 'CYO Spellman',
  entry_instructions = 'Parking: Look for signs for CYO. $30 entry fee at the door. GPS: DO NOT use main seminary gate. Follow signs for CYO, or use 236 Seminary Ave, Yonkers, NY 10804 as GPS waypoint (across the street from CYO/Spellman Center parking lot).',
  updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND name = 'Cardinal Spellman HS';

-- 2. Update event.location text on all 9 affected events to match new venue name
UPDATE events e
SET location = 'CYO Spellman'
FROM teams t
WHERE e.team_id = t.id
  AND t.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND e.location = 'Cardinal Spellman HS';
