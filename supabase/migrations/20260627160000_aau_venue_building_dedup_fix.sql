-- INCIDENT FIX (2026-06-27): new-tournament ingest landed teams but 0 GAMES.
-- Root cause (grounded via the ingest's per-division error response + venue rows):
--   • get_or_create_venue keyed on the FULL per-court name ("X - Court 3") AND required
--     address='' to match, so once a venue was enriched it no longer matched → a re-ingest
--     minted ANOTHER row. Per-court + re-ingest = venue proliferation.
--   • enrich_venue_address set tm_venue_key (a BUILDING-level TM place id) onto each
--     PER-COURT venue row; the 2nd court of a building violated venues_tm_key_uq and THREW,
--     and because venue enrich runs before the games upsert in the per-division try/catch,
--     the whole division's GAMES were dropped (teams had already committed).
-- The 247→52 dedup (20260627114812) was a one-time backfill; the ingest path still minted
-- per-court rows. This makes building-dedup permanent in the resolver + collision-safe in
-- enrich, then re-collapses the per-court rows created since.
-- Applied to prod via MCP 2026-06-27 (owner-authorized incident fix, pre-onboarding); mirror AP #21.

-- 1. get_or_create_venue: canonicalize to the BUILDING (strip leading ordinal + trailing
--    "- Court X"), match by building name regardless of address (so an enriched venue still
--    matches — no re-mint), insert the clean building name when absent. Court lives on the game.
create or replace function public.get_or_create_venue(p_name text, p_tm_key text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare
  v_id uuid;
  v_name text := btrim(p_name);
  v_building text;
begin
  if v_name is null or v_name = '' then return null; end if;
  -- building = strip a leading "<n> - "/"<n> " ordinal, then take the part before " - "
  v_building := btrim(regexp_replace(
    split_part(regexp_replace(v_name, '^\s*\d{1,2}(\.\d)?\s*-?\s+', ''), ' - ', 1),
    '\s+', ' ', 'g'));
  if v_building is null or v_building = '' then v_building := v_name; end if;

  if p_tm_key is not null and p_tm_key <> '' then
    select id into v_id from venues where tm_venue_key = p_tm_key limit 1;
    if v_id is not null then return v_id; end if;
  end if;

  select id into v_id from venues where lower(btrim(name)) = lower(v_building) limit 1;
  if v_id is not null then
    if p_tm_key is not null and p_tm_key <> '' then
      update venues set tm_venue_key = p_tm_key, updated_at = now()
       where id = v_id and tm_venue_key is null
         and not exists (select 1 from venues v2 where v2.tm_venue_key = p_tm_key and v2.id <> v_id);
    end if;
    return v_id;
  end if;

  insert into venues (name, tm_venue_key) values (v_building, nullif(p_tm_key, ''))
    returning id into v_id;
  return v_id;
exception when unique_violation then
  select id into v_id from venues
   where (p_tm_key is not null and p_tm_key <> '' and tm_venue_key = p_tm_key)
      or lower(btrim(name)) = lower(v_building)
   limit 1;
  return v_id;
end
$function$;

-- 2. enrich_venue_address: never throw on a tm_venue_key collision. Always write the address
--    fields; set tm_venue_key ONLY when it is free (not held by another venue). Splitting the
--    two updates means a key already taken by a sibling court can't abort the address write.
create or replace function public.enrich_venue_address(p_venue_id uuid, p_address text, p_city text, p_state text, p_zip text, p_tm_key text default null)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare
  v_addr text := nullif(btrim(coalesce(p_address, '')), '');
  v_key  text := nullif(btrim(coalesce(p_tm_key, '')), '');
begin
  if p_venue_id is null or v_addr is null then return; end if;
  update venues set
    address = v_addr,
    city  = nullif(btrim(coalesce(p_city,  '')), ''),
    state = nullif(btrim(coalesce(p_state, '')), ''),
    zip   = nullif(btrim(coalesce(p_zip,   '')), ''),
    geocode_status = case when address is distinct from v_addr then 'pending' else geocode_status end,
    lat         = case when address is distinct from v_addr then null else lat end,
    lng         = case when address is distinct from v_addr then null else lng end,
    geocoded_at = case when address is distinct from v_addr then null else geocoded_at end,
    updated_at  = now()
  where id = p_venue_id;
  -- tm_venue_key only when free (collision-safe; building-dedup makes this the common path)
  if v_key is not null then
    update venues set tm_venue_key = v_key, updated_at = now()
     where id = p_venue_id and tm_venue_key is null
       and not exists (select 1 from venues v2 where v2.tm_venue_key = v_key and v2.id <> p_venue_id);
  end if;
end
$function$;

-- 3. Re-collapse the per-court rows created since the one-time dedup (same shape as
--    20260627114812). Set court on any game from its current per-court venue, repoint games
--    to the canonical building venue, rename canonical to the clean building, delete orphans.
with parsed as (
  select id, case when position(' - ' in s) > 0
    then nullif(trim(substring(s from position(' - ' in s) + 3)), '') end as court
  from (select id, regexp_replace(name, '^\s*\d{1,2}(\.\d)?\s*-?\s+', '') s from venues) z)
update division_games g set court = p.court
from parsed p where g.venue_id = p.id and p.court is not null and g.court is null;

with parsed as (
  select id, lat,
    btrim(regexp_replace(split_part(regexp_replace(name,'^\s*\d{1,2}(\.\d)?\s*-?\s+',''),' - ',1),'\s+',' ','g')) building
  from venues),
canon as (select id, first_value(id) over (partition by lower(building) order by (lat is null), id) canonical_id from parsed)
update division_games g set venue_id = c.canonical_id
from canon c where g.venue_id = c.id and g.venue_id <> c.canonical_id;

-- NB: do NOT move tm_venue_key onto the canonical here — a per-court sibling may still hold
-- it (deleted in the next statement), which would re-trip venues_tm_key_uq. enrich_venue_address
-- re-sets the building's key on the next ingest (now collision-safe), so losing it here is benign.
with parsed as (
  select id, lat, lng,
    btrim(regexp_replace(split_part(regexp_replace(name,'^\s*\d{1,2}(\.\d)?\s*-?\s+',''),' - ',1),'\s+',' ','g')) building
  from venues),
canon as (select id, building,
   first_value(id) over (partition by lower(building) order by (lat is null), id) canonical_id,
   max(lat) over (partition by lower(building)) glat, max(lng) over (partition by lower(building)) glng
   from parsed)
update venues v set name = c.building,
  lat = coalesce(v.lat, c.glat), lng = coalesce(v.lng, c.glng),
  geocode_status = case when coalesce(v.lat, c.glat) is not null then 'ok' else v.geocode_status end
from canon c where v.id = c.id and c.id = c.canonical_id;

with parsed as (
  select id, lat, btrim(regexp_replace(split_part(regexp_replace(name,'^\s*\d{1,2}(\.\d)?\s*-?\s+',''),' - ',1),'\s+',' ','g')) building
  from venues),
canon as (select id, first_value(id) over (partition by lower(building) order by (lat is null), id) canonical_id from parsed)
delete from venues v using canon c where v.id = c.id and c.id <> c.canonical_id;
