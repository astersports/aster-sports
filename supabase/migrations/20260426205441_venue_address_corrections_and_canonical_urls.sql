-- Mirror file backfilled 2026-05-28 from supabase_migrations.schema_migrations.statements per Wave 2.A audit #23 P0-1.
-- Original SQL applied via chat-side claude.ai MCP without same-turn mirror; this file restores the AP #21 mirror invariant.
-- Migration 037: Venue address corrections + canonical Google Maps URLs from gym-locations-v4
-- Strategy: prefer google_maps_url as primary nav source. Null out approximate lat/lon for venues
-- where addresses just changed (forces frontend to use the URL or fall back to clean address text).

-- =========================================================
-- 1. Cardinal Spellman HS: WRONG address fix
-- Was: 1 Cardinal Spellman Pl, Bronx, NY 10466 (Spellman HS in Bronx)
-- Should be: 674 Mile Square Road, Yonkers, NY 10704 (CYO Spellman Rec at Dunwoodie Seminary)
-- =========================================================
UPDATE locations SET
  address = '674 Mile Square Road, Yonkers, NY 10704',
  google_maps_url = 'http://maps.google.com/maps?q=674%20Mile%20Square%20Road%20Yonkers,%20NY%2010704',
  entry_instructions = 'GPS: DO NOT use main seminary gate. Follow signs for CYO, or use 236 Seminary Ave, Yonkers, NY 10804 (across the street from CYO/Spellman Center parking lot).',
  lat = NULL,
  lon = NULL,
  updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND name = 'Cardinal Spellman HS';

-- =========================================================
-- 2. St Joseph-Bronxville: WRONG address fix
-- Was: 15 Cedar St, Bronxville, NY 10708
-- Should be: 30 Meadow Avenue, Bronxville, NY 10708
-- =========================================================
UPDATE locations SET
  address = '30 Meadow Avenue, Bronxville, NY 10708',
  google_maps_url = 'http://maps.google.com/maps?q=30%20Meadow%20Avenue%20Bronxville,%20NY%2010708',
  lat = NULL,
  lon = NULL,
  updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND name = 'St. Joseph-Bronxville';

-- =========================================================
-- 3. Immaculate Conception-Tuckahoe: house number off-by-one fix
-- Was: 53 Winter Hill Rd, Tuckahoe, NY 10707
-- Should be: 52 Winter Hill Road, Tuckahoe, NY 10707
-- =========================================================
UPDATE locations SET
  address = '52 Winter Hill Road, Tuckahoe, NY 10707',
  google_maps_url = 'http://maps.google.com/maps?q=52%20WINTER%20HILL%20ROAD%20Tuckahoe,%20NY%2010707',
  lat = NULL,
  lon = NULL,
  updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND name = 'Immaculate Conception-Tuckahoe';

-- =========================================================
-- 4. OLPH/St Catharine-Pelham: WRONG address fix
-- Was: 30 Carleton Ave, Pelham, NY 10803
-- Should be: 575 Fowler Avenue, Pelham, NY 10803
-- =========================================================
UPDATE locations SET
  address = '575 Fowler Avenue, Pelham, NY 10803',
  google_maps_url = 'http://maps.google.com/maps?q=575%20Fowler%20Avenue%20Pelham,%20NY%2010803',
  lat = NULL,
  lon = NULL,
  updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND name = 'OLPH/St Catharine-Pelham';

-- =========================================================
-- 5. Resurrection School - Doty Gym: null approximate lat/lon (use URL only)
-- Address kept from prior migration (Frank verified)
-- =========================================================
UPDATE locations SET
  lat = NULL,
  lon = NULL,
  updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND name = 'Resurrection School - Doty Gym';

-- =========================================================
-- 6. Set canonical Google Maps short links for venues from gym-locations-v4.html
-- These are Frank's verified pins
-- =========================================================
UPDATE locations SET google_maps_url = 'https://maps.app.goo.gl/4mmdfPTpRdBp3kpJ6', updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'East Coast Sports & Fitness';

UPDATE locations SET google_maps_url = 'https://maps.app.goo.gl/ym1WxYJ2dNZdGNru5', updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'The Hackley School';

UPDATE locations SET google_maps_url = 'https://maps.app.goo.gl/NxidYn1j683Xonzp7', updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'The Harvey School';

UPDATE locations SET google_maps_url = 'https://maps.app.goo.gl/ZwAdZRAz5VSmd6xN8', updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'House of Sports';

UPDATE locations SET google_maps_url = 'https://maps.app.goo.gl/CGHy3EgcoHUXfmNJ8', updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'The Leffell School';

UPDATE locations SET google_maps_url = 'https://maps.app.goo.gl/4fdvn1Mnourc1UXN8', updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Maria Regina High School';

UPDATE locations SET
  google_maps_url = 'https://maps.app.goo.gl/sKz13y4bh4Cv9zky7',
  entry_instructions = 'Enter via Clinton Road gate only. Arrive no earlier than 5 min before session.',
  updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Rippowam Cisqua School';

UPDATE locations SET
  google_maps_url = 'https://maps.app.goo.gl/udiiCd7HiDLmwLSZ6',
  address = 'Campbell Sports Center, 2 Wilgarth Rd, Yonkers, NY 10708',
  updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Sarah Lawrence College';

UPDATE locations SET
  google_maps_url = 'https://maps.app.goo.gl/roEeSM85cRqtTFJw5',
  entry_instructions = 'Enter St. Francis Hall. Arrive no earlier than 5 min before session.',
  updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'St. Patrick''s';

UPDATE locations SET
  google_maps_url = 'https://maps.app.goo.gl/VgNCv8PKLPZjw5mW7',
  entry_instructions = 'Navigate to Lots 8, 9 & 10 (adjacent to Viking Gym). Arrive no earlier than 5 min before session.',
  updated_at = now()
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Westchester Community College';

-- =========================================================
-- 7. INSERT new venues from gym-locations-v4 not currently in DB
-- For future event assignments
-- =========================================================
INSERT INTO locations (org_id, name, address, google_maps_url, created_at, updated_at)
VALUES
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6',
   'Msgr. Scanlon HS (Gallagher Gym)',
   '915 Hutchinson River Pkwy, Bronx, NY 10465',
   'https://maps.app.goo.gl/9Nkkuhm76rcBSMrf6',
   now(), now()),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6',
   'Msgr. Scanlon HS (Silverberg Gym)',
   '915 Hutchinson River Pkwy, Bronx, NY 10465',
   'https://maps.app.goo.gl/1Y3X7rpnwmy3vSfo8',
   now(), now()),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6',
   'Stevenson High School',
   '1980 Lafayette Ave, Bronx, NY 10473',
   'https://maps.app.goo.gl/VuiQqfsrcTmjqRpz5',
   now(), now())
ON CONFLICT DO NOTHING;
