-- Account-synced tracked teams for the AAU hub (Phase A4). One row per (user, team);
-- the team_key is the tournament_division_teams id (the trackingStore key). Owner-only
-- RLS so a signed-in parent reads/writes ONLY their own tracked set; anon has no access
-- (tracking is account-gated — public browse stays anon via the get_public_* RPCs).
create table if not exists public.tracked_teams (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  team_key        text not null,
  name            text not null,
  program         text,
  pool            text,
  tournament_id   text,
  tournament_name text,
  division_id     text,
  division_name   text,
  kid             text,
  created_at      timestamptz not null default now(),
  unique (user_id, team_key)
);

alter table public.tracked_teams enable row level security;

-- subselect-wrapped auth.uid() (initplan-safe, platform RLS pattern)
create policy tracked_teams_select on public.tracked_teams
  for select to authenticated using (user_id = (select auth.uid()));
create policy tracked_teams_insert on public.tracked_teams
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy tracked_teams_update on public.tracked_teams
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy tracked_teams_delete on public.tracked_teams
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.tracked_teams from public, anon;
grant select, insert, update, delete on public.tracked_teams to authenticated;
