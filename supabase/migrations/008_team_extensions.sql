-- 008_team_extensions.sql
-- Adds team fields driven by the AdminTeamsPage form: gender, circuit name
-- (the free-text league/tournament name like "Zero Gravity"), and practice
-- schedule. Also widens the circuit enum so tournament-only teams are a
-- first-class classification.

begin;

-- ------------------------------------------------------------
-- 1. Drop old circuit check, add wider check
-- ------------------------------------------------------------
alter table public.teams drop constraint if exists teams_circuit_check;

alter table public.teams
  add constraint teams_circuit_check
    check (circuit in ('aau', 'league_play', 'tournament'));

-- ------------------------------------------------------------
-- 2. New columns (all nullable so existing rows survive)
-- ------------------------------------------------------------
alter table public.teams
  add column if not exists gender text
    check (gender in ('male', 'female', 'coed')),
  add column if not exists circuit_name text,         -- e.g. 'Zero Gravity'
  add column if not exists practice_day text          -- mon..sun
    check (practice_day in ('mon','tue','wed','thu','fri','sat','sun')),
  add column if not exists practice_time time,
  add column if not exists practice_location text;

-- ------------------------------------------------------------
-- 3. Backfill genders and circuit_name for Legacy Hoopers seed teams
-- ------------------------------------------------------------
do $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from public.organizations
    where slug = 'legacy-hoopers' limit 1;
  if v_org_id is null then return; end if;

  update public.teams set gender = 'female', circuit_name = 'Zero Gravity'
    where org_id = v_org_id and name = '11U Girls';
  update public.teams set gender = 'male', circuit_name = 'Zero Gravity'
    where org_id = v_org_id and name = '10U Black';
  update public.teams set gender = 'male'
    where org_id = v_org_id and name = '10U Blue';
  update public.teams set gender = 'male'
    where org_id = v_org_id and name = '9U Boys';
  update public.teams set gender = 'male', circuit_name = 'Zero Gravity'
    where org_id = v_org_id and name = '8U Boys';
end $$;

commit;
