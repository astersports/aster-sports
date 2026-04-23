-- ============================================================
-- 009_revert.sql
-- EMERGENCY ROLLBACK for 009_fix_public_read_rls.sql.
--
-- This file is committed to the repo but is NOT run as part of
-- the normal migration chain. Paste into Supabase SQL Editor
-- ONLY if the smoke test or manual persona check fails after
-- applying 009_fix_public_read_rls.sql.
--
-- Restores the original *_public_read policies with
-- `using (true)` exactly as defined in 004_schedule_extensions.sql
-- (lines 152, 159, 166, 173).
-- ============================================================

begin;

-- ------------------------------------------------------------
-- Drop the new org-scoped authenticated-read policies
-- ------------------------------------------------------------
drop policy if exists event_duties_org_authenticated_read   on public.event_duties;
drop policy if exists event_rsvps_org_authenticated_read    on public.event_rsvps;
drop policy if exists event_rides_org_authenticated_read    on public.event_rides;
drop policy if exists event_comments_org_authenticated_read on public.event_comments;

-- ------------------------------------------------------------
-- Recreate the original public-read policies verbatim
-- ------------------------------------------------------------
create policy event_duties_public_read on public.event_duties
  for select using (true);

create policy event_rsvps_public_read on public.event_rsvps
  for select using (true);

create policy event_rides_public_read on public.event_rides
  for select using (true);

create policy event_comments_public_read on public.event_comments
  for select using (true);

commit;

notify pgrst, 'reload schema';

-- ------------------------------------------------------------
-- Verification: the four original *_public_read policies should
-- all report OK (present) after rollback.
-- ------------------------------------------------------------
with expected_restored(tbl, pol) as (
  values
    ('event_duties',   'event_duties_public_read'),
    ('event_rsvps',    'event_rsvps_public_read'),
    ('event_rides',    'event_rides_public_read'),
    ('event_comments', 'event_comments_public_read')
)
select
  e.tbl     as table_name,
  e.pol     as policy_name,
  case when p.policyname is not null then 'OK' else 'MISSING' end as status
from expected_restored e
left join pg_policies p
  on p.schemaname = 'public'
 and p.tablename  = e.tbl
 and p.policyname = e.pol
order by table_name;
