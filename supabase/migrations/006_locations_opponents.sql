-- ============================================================
-- 006_locations_opponents.sql
-- Locations and opponents management tables
-- Depends on: 003_core_data_model.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Locations (reusable venues per org)
-- ------------------------------------------------------------
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  sub_locations text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_locations_org on public.locations(org_id);

alter table public.locations enable row level security;

create policy locations_org_isolation on public.locations
  for all using (org_id = public.current_user_org_id());

-- ------------------------------------------------------------
-- 2. Opponents (reusable opponent names per org)
-- ------------------------------------------------------------
create table public.opponents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_opponents_org on public.opponents(org_id);

alter table public.opponents enable row level security;

create policy opponents_org_isolation on public.opponents
  for all using (org_id = public.current_user_org_id());

-- ------------------------------------------------------------
-- 3. Seed Legacy Hoopers locations
-- ------------------------------------------------------------
do $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from public.organizations where slug = 'legacy-hoopers';

  insert into public.locations (org_id, name, address, sub_locations) values
    (v_org_id, 'St. Patrick''s Gym', '29 Cox Ave, Armonk, NY 10504', '{"Court 1","Court 2","Full Gym"}'),
    (v_org_id, 'WCC Gym', null, '{}'),
    (v_org_id, 'Rippowam Gym', null, '{}'),
    (v_org_id, 'Westchester County Center', null, '{}');
end $$;
