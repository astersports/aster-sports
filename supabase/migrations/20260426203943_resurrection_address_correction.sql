-- Mirror file backfilled 2026-05-28 from supabase_migrations.schema_migrations.statements per Wave 2.A audit #23 P0-1.
-- Original SQL applied via chat-side claude.ai MCP without same-turn mirror; this file restores the AP #21 mirror invariant.
-- Migration 036: Resurrection School address correction (per Frank's confirmed URL)
-- Real address: 946 Boston Post Road, Rye, NY 10580 (NOT 26 Highland Pl)
-- Storing google_maps_url as authoritative source so frontend can use it directly

UPDATE locations
SET
  address = '946 Boston Post Road, Rye, NY 10580',
  lat = 40.9550,
  lon = -73.6920,
  google_maps_url = 'https://maps.google.com/maps?q=946%20Boston%20Post%20Road%20Rye,%20NY%2010580',
  updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND name = 'Resurrection School - Doty Gym';
