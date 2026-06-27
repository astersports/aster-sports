-- Enrich a venue with the street address parsed from TM's Complexes/places panel.
-- Idempotent: only forces a re-geocode (status->pending, clear lat/lng) when the
-- street address actually CHANGES, so repeated ingests don't churn good pins.
-- Service-role only (the ingest edge function); locked down per AP #23/#57.
create or replace function public.enrich_venue_address(
  p_venue_id uuid,
  p_address  text,
  p_city     text,
  p_state    text,
  p_zip      text,
  p_tm_key   text default null
) returns void
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_addr text := nullif(btrim(coalesce(p_address, '')), '');
begin
  if p_venue_id is null or v_addr is null then
    return;
  end if;
  update venues set
    address      = v_addr,
    city         = nullif(btrim(coalesce(p_city,  '')), ''),
    state        = nullif(btrim(coalesce(p_state, '')), ''),
    zip          = nullif(btrim(coalesce(p_zip,   '')), ''),
    tm_venue_key = coalesce(nullif(btrim(coalesce(p_tm_key, '')), ''), tm_venue_key),
    -- column refs in SET read the OLD row, so this compares stored vs incoming
    geocode_status = case when address is distinct from v_addr then 'pending' else geocode_status end,
    lat            = case when address is distinct from v_addr then null       else lat end,
    lng            = case when address is distinct from v_addr then null       else lng end,
    geocoded_at    = case when address is distinct from v_addr then null       else geocoded_at end,
    updated_at   = now()
  where id = p_venue_id;
end
$$;

revoke execute on function public.enrich_venue_address(uuid,text,text,text,text,text) from public;
revoke execute on function public.enrich_venue_address(uuid,text,text,text,text,text) from anon;
revoke execute on function public.enrich_venue_address(uuid,text,text,text,text,text) from authenticated;
grant  execute on function public.enrich_venue_address(uuid,text,text,text,text,text) to service_role;
