-- Harden get_or_create_venue: align the blank address/city check to the unique
-- index normalization. venues_name_addr_uq uses lower(btrim(coalesce(...,''))), but
-- the prior function used bare coalesce(x,'')='' — a whitespace-only address would
-- pass the lookup, hit the unique index on INSERT, and the re-select would also miss
-- it (Copilot review #1108). Unreachable today (this function only inserts
-- address=NULL), closed proactively. Behavior unchanged for the NULL/empty case.
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
     and btrim(coalesce(address, '')) = '' and btrim(coalesce(city, '')) = ''
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
      or (lower(btrim(name)) = lower(v_name) and btrim(coalesce(address, '')) = '' and btrim(coalesce(city, '')) = '')
   limit 1;
  return v_id;
end
$$;

revoke execute on function public.get_or_create_venue(text, text) from public;
revoke execute on function public.get_or_create_venue(text, text) from anon;
grant  execute on function public.get_or_create_venue(text, text) to service_role;
