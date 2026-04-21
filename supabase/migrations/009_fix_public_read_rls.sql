-- ============================================================
-- 009_fix_public_read_rls.sql
-- Closes RLS holes on event_duties, event_rsvps, event_rides,
-- event_comments. The original *_public_read policies in
-- 004_schedule_extensions.sql used `using (true)`, which let
-- anyone holding the anon key read all rows from all orgs.
--
-- Replacement: org-scoped policies that require an authenticated
-- user AND that the event belongs to the caller's org (via
-- public.event_org_matches). Defense-in-depth: each table already
-- has an *_org_all policy, so dropping the public-read policy
-- does not break authenticated reads.
--
-- Rollback: see 009_revert.sql in this directory.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- event_duties
-- ------------------------------------------------------------
drop policy if exists event_duties_public_read on public.event_duties;

create policy event_duties_org_authenticated_read on public.event_duties
  for select
  using (
    auth.uid() is not null
    and public.event_org_matches(event_id)
  );

-- ------------------------------------------------------------
-- event_rsvps
-- ------------------------------------------------------------
drop policy if exists event_rsvps_public_read on public.event_rsvps;

create policy event_rsvps_org_authenticated_read on public.event_rsvps
  for select
  using (
    auth.uid() is not null
    and public.event_org_matches(event_id)
  );

-- ------------------------------------------------------------
-- event_rides
-- ------------------------------------------------------------
drop policy if exists event_rides_public_read on public.event_rides;

create policy event_rides_org_authenticated_read on public.event_rides
  for select
  using (
    auth.uid() is not null
    and public.event_org_matches(event_id)
  );

-- ------------------------------------------------------------
-- event_comments
-- ------------------------------------------------------------
drop policy if exists event_comments_public_read on public.event_comments;

create policy event_comments_org_authenticated_read on public.event_comments
  for select
  using (
    auth.uid() is not null
    and public.event_org_matches(event_id)
  );

commit;

-- ------------------------------------------------------------
-- Tell PostgREST to pick up the new policies immediately
-- ------------------------------------------------------------
notify pgrst, 'reload schema';

-- ------------------------------------------------------------
-- Verification: every expected new policy should report OK.
-- Any MISSING row means the migration did not fully apply.
-- Also confirms the four old *_public_read policies are gone.
-- ------------------------------------------------------------
with expected_new(tbl, pol) as (
  values
    ('event_duties',   'event_duties_org_authenticated_read'),
    ('event_rsvps',    'event_rsvps_org_authenticated_read'),
    ('event_rides',    'event_rides_org_authenticated_read'),
    ('event_comments', 'event_comments_org_authenticated_read')
),
expected_gone(tbl, pol) as (
  values
    ('event_duties',   'event_duties_public_read'),
    ('event_rsvps',    'event_rsvps_public_read'),
    ('event_rides',    'event_rides_public_read'),
    ('event_comments', 'event_comments_public_read')
)
select
  e.tbl        as table_name,
  e.pol        as policy_name,
  'created'    as expected,
  case when p.policyname is not null then 'OK' else 'MISSING' end as status
from expected_new e
left join pg_policies p
  on p.schemaname = 'public'
 and p.tablename  = e.tbl
 and p.policyname = e.pol
union all
select
  g.tbl,
  g.pol,
  'removed',
  case when p.policyname is null then 'OK' else 'STILL PRESENT' end
from expected_gone g
left join pg_policies p
  on p.schemaname = 'public'
 and p.tablename  = g.tbl
 and p.policyname = g.pol
order by table_name, expected;
