-- ============================================================
-- 003_core_data_model.sql
-- Core data model: seasons, teams, players, guardians, staff, events
-- Depends on: 002_skyfire_foundation.sql (organizations, user_roles)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Seasons
-- ------------------------------------------------------------
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,                        -- e.g. 'Spring 2026'
  start_date date not null,
  end_date date not null,
  status text not null default 'active'      -- active | archived
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_seasons_org on public.seasons(org_id);

-- ------------------------------------------------------------
-- 2. Teams
-- ------------------------------------------------------------
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  name text not null,                        -- e.g. '10U Black'
  age_group text not null,                   -- e.g. '10U', '11U', '8U'
  division text,                             -- e.g. 'Black', 'Blue' (nullable for single-division age groups)
  circuit text not null default 'aau'        -- aau | league_play
    check (circuit in ('aau', 'league_play')),
  sort_order int not null default 0,         -- enforce oldest-to-youngest display order
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_teams_org on public.teams(org_id);
create index idx_teams_season on public.teams(season_id);

-- ------------------------------------------------------------
-- 3. Players (org-scoped, persist across seasons)
-- ------------------------------------------------------------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  dob date,
  grade int,                                 -- current grade (2-5 for Spring 2026)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_players_org on public.players(org_id);

-- ------------------------------------------------------------
-- 4. Team-player join (roster assignments per team/season)
-- ------------------------------------------------------------
create table public.team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  roster_type text not null default 'rostered' -- rostered | futures
    check (roster_type in ('rostered', 'futures')),
  jersey_number text,                        -- text to allow '00', '07', etc.
  status text not null default 'active'      -- active | inactive
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (team_id, player_id)
);

create index idx_team_players_team on public.team_players(team_id);
create index idx_team_players_player on public.team_players(player_id);

-- ------------------------------------------------------------
-- 5. Guardians (parent/guardian contact records, org-scoped)
-- ------------------------------------------------------------
create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_guardians_org on public.guardians(org_id);

-- ------------------------------------------------------------
-- 6. Player-guardian join
-- ------------------------------------------------------------
create table public.player_guardians (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  relationship text not null default 'parent' -- parent | guardian | emergency_contact
    check (relationship in ('parent', 'guardian', 'emergency_contact')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (player_id, guardian_id)
);

create index idx_player_guardians_player on public.player_guardians(player_id);
create index idx_player_guardians_guardian on public.player_guardians(guardian_id);

-- ------------------------------------------------------------
-- 7. Team staff assignments (coaches per team)
-- ------------------------------------------------------------
create table public.team_staff (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'assistant_coach' -- head_coach | assistant_coach | manager
    check (role in ('head_coach', 'assistant_coach', 'manager')),
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index idx_team_staff_team on public.team_staff(team_id);
create index idx_team_staff_user on public.team_staff(user_id);

-- ------------------------------------------------------------
-- 8. Events (practices, games, tournaments)
-- ------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  event_type text not null default 'practice' -- practice | game | tournament | other
    check (event_type in ('practice', 'game', 'tournament', 'other')),
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  location_address text,                     -- full address for maps/directions
  opponent text,                             -- for games
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_events_team on public.events(team_id);
create index idx_events_start on public.events(start_at);
create index idx_events_type on public.events(event_type);

-- ------------------------------------------------------------
-- 9. RLS policies (org-scoped isolation)
-- ------------------------------------------------------------
alter table public.seasons enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.team_players enable row level security;
alter table public.guardians enable row level security;
alter table public.player_guardians enable row level security;
alter table public.team_staff enable row level security;
alter table public.events enable row level security;

-- Helper: get current user's org_id from user_roles
create or replace function public.current_user_org_id()
returns uuid
language sql
stable
security definer
as $$
  select organization_id from public.user_roles
  where user_id = auth.uid()
  limit 1;
$$;

-- Seasons: users see only their org's seasons
create policy seasons_org_isolation on public.seasons
  for all using (org_id = public.current_user_org_id());

-- Teams: users see only their org's teams
create policy teams_org_isolation on public.teams
  for all using (org_id = public.current_user_org_id());

-- Players: users see only their org's players
create policy players_org_isolation on public.players
  for all using (org_id = public.current_user_org_id());

-- Team players: visible if the team belongs to user's org
create policy team_players_org_isolation on public.team_players
  for all using (
    team_id in (select id from public.teams where org_id = public.current_user_org_id())
  );

-- Guardians: users see only their org's guardians
create policy guardians_org_isolation on public.guardians
  for all using (org_id = public.current_user_org_id());

-- Player guardians: visible if the player belongs to user's org
create policy player_guardians_org_isolation on public.player_guardians
  for all using (
    player_id in (select id from public.players where org_id = public.current_user_org_id())
  );

-- Team staff: visible if the team belongs to user's org
create policy team_staff_org_isolation on public.team_staff
  for all using (
    team_id in (select id from public.teams where org_id = public.current_user_org_id())
  );

-- Events: visible if the team belongs to user's org
create policy events_org_isolation on public.events
  for all using (
    team_id in (select id from public.teams where org_id = public.current_user_org_id())
  );

-- ------------------------------------------------------------
-- 10. Seed data: Legacy Hoopers Spring 2026
-- ------------------------------------------------------------
do $$
declare
  v_org_id uuid;
  v_season_id uuid;
begin
  -- Get Legacy Hoopers org (seeded in 002)
  select id into v_org_id from public.organizations where slug = 'legacy-hoopers';

  -- Create Spring 2026 season
  insert into public.seasons (org_id, name, start_date, end_date, status)
  values (v_org_id, 'Spring 2026', '2026-03-23', '2026-06-14', 'active')
  returning id into v_season_id;

  -- Create teams (sort_order: oldest to youngest)
  insert into public.teams (org_id, season_id, name, age_group, division, circuit, sort_order) values
    (v_org_id, v_season_id, '11U Girls',  '11U', null,    'aau',         1),
    (v_org_id, v_season_id, '10U Black',  '10U', 'Black', 'aau',         2),
    (v_org_id, v_season_id, '10U Blue',   '10U', 'Blue',  'league_play', 3),
    (v_org_id, v_season_id, '9U Boys',    '9U',  null,    'league_play', 4),
    (v_org_id, v_season_id, '8U Boys',    '8U',  null,    'aau',         5);
end $$;

-- ------------------------------------------------------------
-- 11. Updated_at triggers
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_seasons_updated_at before update on public.seasons
  for each row execute function public.set_updated_at();

create trigger trg_teams_updated_at before update on public.teams
  for each row execute function public.set_updated_at();

create trigger trg_players_updated_at before update on public.players
  for each row execute function public.set_updated_at();

create trigger trg_guardians_updated_at before update on public.guardians
  for each row execute function public.set_updated_at();

create trigger trg_events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
