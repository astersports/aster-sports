-- ============================================================
-- 004_schedule_extensions.sql
-- Schedule extensions: event enhancements, RSVP, rides, duties,
-- comments, change log, team colors
-- Depends on: 003_core_data_model.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Extend events table
-- ------------------------------------------------------------
alter table public.events
  add column status text not null default 'scheduled'
    check (status in ('scheduled', 'cancelled', 'postponed')),
  add column arrival_minutes_before int,
  add column jersey text check (jersey in ('home', 'away')),
  add column coach_notes text,
  add column enable_rides boolean not null default false,
  add column is_multi_day boolean not null default false,
  add column end_date date,
  add column parent_event_id uuid references public.events(id) on delete set null,
  add column attachments jsonb not null default '[]'::jsonb,
  add column indoor boolean not null default false;

create index idx_events_status on public.events(status);
create index idx_events_parent on public.events(parent_event_id);

-- ------------------------------------------------------------
-- 2. Event changes (audit log)
-- ------------------------------------------------------------
create table public.event_changes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  changed_by uuid references auth.users(id),
  field_name text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now()
);

create index idx_event_changes_event on public.event_changes(event_id);

-- ------------------------------------------------------------
-- 3. Event duties (volunteer sign-up slots)
-- ------------------------------------------------------------
create table public.event_duties (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  duty_name text not null,
  slots_needed int not null default 1,
  guardian_id uuid references public.guardians(id) on delete set null,
  claimed_by_name text,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_event_duties_event on public.event_duties(event_id);

-- ------------------------------------------------------------
-- 4. Event RSVPs (availability tracking)
-- ------------------------------------------------------------
create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  guardian_id uuid references public.guardians(id) on delete set null,
  response text not null check (response in ('going', 'not_going', 'maybe')),
  comment text,
  responded_at timestamptz not null default now(),
  unique (event_id, player_id)
);

create index idx_event_rsvps_event on public.event_rsvps(event_id);

-- ------------------------------------------------------------
-- 5. Event rides (carpool ride board)
-- ------------------------------------------------------------
create table public.event_rides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guardian_id uuid references public.guardians(id) on delete set null,
  name text not null,
  phone text,
  ride_type text not null check (ride_type in ('offering', 'requesting')),
  seats int not null default 1,
  pickup_location text,
  departure_time timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_event_rides_event on public.event_rides(event_id);

-- ------------------------------------------------------------
-- 6. Event comments (per-event discussion)
-- ------------------------------------------------------------
create table public.event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  author_name text not null,
  author_guardian_id uuid references public.guardians(id) on delete set null,
  author_user_id uuid references auth.users(id) on delete set null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_event_comments_event on public.event_comments(event_id);

-- ------------------------------------------------------------
-- 7. Add team_color to teams
-- ------------------------------------------------------------
alter table public.teams add column team_color text;

-- ------------------------------------------------------------
-- 8. RLS policies
-- ------------------------------------------------------------
alter table public.event_changes enable row level security;
alter table public.event_duties enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.event_rides enable row level security;
alter table public.event_comments enable row level security;

-- Helper: check if a given event belongs to the current user's org
-- (avoids recursion through current_user_org_id)
create or replace function public.event_org_matches(p_event_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.events e
    join public.teams t on t.id = e.team_id
    join public.user_roles ur on ur.organization_id = t.org_id
    where e.id = p_event_id
      and ur.user_id = auth.uid()
  );
$$;

-- Event changes: org-scoped read via event → team → org
create policy event_changes_org_read on public.event_changes
  for select using (public.event_org_matches(event_id));

create policy event_changes_org_write on public.event_changes
  for insert with check (public.event_org_matches(event_id));

-- Event duties: authenticated org members + public read
create policy event_duties_org_all on public.event_duties
  for all using (public.event_org_matches(event_id));

create policy event_duties_public_read on public.event_duties
  for select using (true);

-- Event RSVPs: authenticated org members + public read
create policy event_rsvps_org_all on public.event_rsvps
  for all using (public.event_org_matches(event_id));

create policy event_rsvps_public_read on public.event_rsvps
  for select using (true);

-- Event rides: authenticated org members + public read
create policy event_rides_org_all on public.event_rides
  for all using (public.event_org_matches(event_id));

create policy event_rides_public_read on public.event_rides
  for select using (true);

-- Event comments: authenticated org members + public read
create policy event_comments_org_all on public.event_comments
  for all using (public.event_org_matches(event_id));

create policy event_comments_public_read on public.event_comments
  for select using (true);

-- ------------------------------------------------------------
-- 9. Seed team colors for Legacy Hoopers
-- ------------------------------------------------------------
do $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from public.organizations where slug = 'legacy-hoopers';

  update public.teams set team_color = '#7C3AED' where org_id = v_org_id and name = '11U Girls';
  update public.teams set team_color = '#18181B' where org_id = v_org_id and name = '10U Black';
  update public.teams set team_color = '#2563EB' where org_id = v_org_id and name = '10U Blue';
  update public.teams set team_color = '#DC2626' where org_id = v_org_id and name = '9U Boys';
  update public.teams set team_color = '#EA580C' where org_id = v_org_id and name = '8U Boys';
end $$;
