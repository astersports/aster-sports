-- get_or_create_venue — service-role de-dup helper for AAU ingest (build-bible §3.2).
-- venues.venues_name_addr_uq is an EXPRESSION unique index (lower/btrim), which
-- PostgREST .upsert(onConflict) cannot target (AP #25). This SECDEF centralizes the
-- match-or-create: by tm_venue_key first, else by normalized name (address/city null
-- at capture time). Idempotent + race-safe (unique_violation → re-select).
create or replace function public.get_or_create_venue(p_name text, p_tm_key text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid;
  v_name text := btrim(p_name);
begin
  if v_name is null or v_name = '' then
    return null;
  end if;

  if p_tm_key is not null and p_tm_key <> '' then
    select id into v_id from venues where tm_venue_key = p_tm_key limit 1;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  select id into v_id from venues
   where lower(btrim(name)) = lower(v_name)
     and coalesce(address, '') = '' and coalesce(city, '') = ''
   limit 1;
  if v_id is not null then
    if p_tm_key is not null and p_tm_key <> '' then
      update venues set tm_venue_key = p_tm_key, updated_at = now()
       where id = v_id and tm_venue_key is null;
    end if;
    return v_id;
  end if;

  insert into venues (name, tm_venue_key) values (v_name, nullif(p_tm_key, ''))
    returning id into v_id;
  return v_id;
exception when unique_violation then
  select id into v_id from venues
   where (p_tm_key is not null and p_tm_key <> '' and tm_venue_key = p_tm_key)
      or (lower(btrim(name)) = lower(v_name) and coalesce(address, '') = '' and coalesce(city, '') = '')
   limit 1;
  return v_id;
end
$$;

revoke execute on function public.get_or_create_venue(text, text) from public;
revoke execute on function public.get_or_create_venue(text, text) from anon;
grant  execute on function public.get_or_create_venue(text, text) to service_role;
