-- venues hardening (Copilot review #1109): standard updated_at trigger + an atomic
-- geocode claim so concurrent geocode-venues runs never double-process/double-bill.

-- 1) standard updated_at trigger (matches set_updated_at() used across the schema)
drop trigger if exists trg_venues_updated_at on public.venues;
create trigger trg_venues_updated_at before update on public.venues
  for each row execute function public.set_updated_at();

-- 2) interim 'processing' state for the claim
alter table public.venues drop constraint if exists venues_geocode_status_check;
alter table public.venues add constraint venues_geocode_status_check
  check (geocode_status in ('pending', 'processing', 'ok', 'failed'));

-- 3) claim_pending_venues — atomically flip a batch pending→processing via
-- FOR UPDATE SKIP LOCKED so two concurrent runs never grab the same row (makes the
-- "billed once" guarantee real). Also reclaims rows stuck in 'processing' longer than
-- p_stale_minutes, so a crash mid-run self-heals on the next invocation. service_role only.
create or replace function public.claim_pending_venues(p_batch int default 25, p_stale_minutes int default 10)
returns setof public.venues
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.venues v
     set geocode_status = 'processing'
   where v.id in (
     select id from public.venues
      where geocode_status = 'pending'
         or (geocode_status = 'processing' and updated_at < now() - make_interval(mins => p_stale_minutes))
      order by created_at
      limit greatest(1, least(100, p_batch))
      for update skip locked
   )
   returning v.*;
end
$$;

revoke execute on function public.claim_pending_venues(int, int) from public;
revoke execute on function public.claim_pending_venues(int, int) from anon;
grant  execute on function public.claim_pending_venues(int, int) to service_role;
