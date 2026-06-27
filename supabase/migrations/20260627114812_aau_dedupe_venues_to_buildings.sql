-- Collapse per-court venue rows to ONE building per address; move the court onto the game.
-- Zero Gravity names each venue cell "<site-number> - <Building> - <Court/Gym>"; the number
-- is their internal assignment, the building is the navigable place, the court is per-game.
-- 247 rows -> 52 buildings. Order matters: set court (from the original venue) BEFORE repoint.
-- Applied to prod via MCP 2026-06-27 (owner-authorized, pre-onboarding); mirror per AP #21.

-- 1. court onto each game, read from its current (per-court) venue's name
with parsed as (
  select id, case when position(' - ' in s) > 0
    then nullif(trim(substring(s from position(' - ' in s) + 3)), '') end as court
  from (select id, regexp_replace(name, '^\s*\d{1,2}(\.\d)?\s*-?\s+', '') s from venues) z)
update division_games g set court = p.court
from parsed p where g.venue_id = p.id and p.court is not null and g.court is null;

-- 2. repoint every game to the canonical (first geocoded, else lowest-id) venue of its building
with parsed as (
  select id, lat,
    trim(regexp_replace(split_part(regexp_replace(name,'^\s*\d{1,2}(\.\d)?\s*-?\s+',''),' - ',1),'\s+',' ','g')) building
  from venues),
canon as (select id, first_value(id) over (partition by lower(building) order by (lat is null), id) canonical_id from parsed)
update division_games g set venue_id = c.canonical_id
from canon c where g.venue_id = c.id and g.venue_id <> c.canonical_id;

-- 3. rename the canonical venue to the clean building name; inherit a pin from any geocoded sibling
with parsed as (
  select id, lat, lng,
    trim(regexp_replace(split_part(regexp_replace(name,'^\s*\d{1,2}(\.\d)?\s*-?\s+',''),' - ',1),'\s+',' ','g')) building
  from venues),
canon as (select id, building,
   first_value(id) over (partition by lower(building) order by (lat is null), id) canonical_id,
   max(lat) over (partition by lower(building)) glat, max(lng) over (partition by lower(building)) glng
   from parsed)
update venues v set name = c.building,
  lat = coalesce(v.lat, c.glat), lng = coalesce(v.lng, c.glng),
  geocode_status = case when coalesce(v.lat, c.glat) is not null then 'ok' else v.geocode_status end
from canon c where v.id = c.id and c.id = c.canonical_id;

-- 4. delete the now-orphaned per-court venue rows
with parsed as (
  select id, lat, trim(regexp_replace(split_part(regexp_replace(name,'^\s*\d{1,2}(\.\d)?\s*-?\s+',''),' - ',1),'\s+',' ','g')) building
  from venues),
canon as (select id, first_value(id) over (partition by lower(building) order by (lat is null), id) canonical_id from parsed)
delete from venues v using canon c where v.id = c.id and c.id <> c.canonical_id;
