-- AAU IA Build Pass 1 — F2 Phase 1 (held; build per BUILD SPEC v3 §3/§4/§7).
-- DR-A=A1 (one writer per concern), DR-B (RLS policy + RPC projection), B2/B3.
--
-- Additive only. NO roster/history clone (R1). HELD for owner approval (CLAUDE.md
-- §2.4 — schema + RLS). CC writes this file; prod apply is Frank's word only.
--
-- Ground-truth verified 2026-06-25 against project vrwwpsbfbnveawqwbdmj:
--   game_results cols (id, event_id, our_score, opponent_score, result,
--     point_differential, coach_highlight, published_at, ... player_of_game_id
--     [PII — never public], entered_at); NO org_id / external_game_id yet.
--   org_is_public_listed(), current_user_org_id(), organizations.public_listing_enabled,
--   game_results_select_public policy — all present.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. game_results: scraper idempotency key + direct org scoping (B2/B3)
-- ─────────────────────────────────────────────────────────────────────────
alter table public.game_results add column if not exists external_game_id text;
alter table public.game_results add column if not exists org_id uuid
  references public.organizations(id) on delete cascade;

-- Backfill org_id for existing rows via event → team → org.
update public.game_results gr
set org_id = t.org_id
from public.events e
join public.teams t on t.id = e.team_id
where gr.event_id = e.id and gr.org_id is null;

-- All current rows derive from a team-scoped event, so org_id is now complete.
alter table public.game_results alter column org_id set not null;

create index if not exists idx_game_results_org_id on public.game_results(org_id);

-- App-side idempotency for scraper ingest (B2). external_game_id is nullable;
-- Postgres treats NULLs as DISTINCT in a unique index, so the existing
-- manually-entered rows (external_game_id IS NULL) never collide. The scraper
-- path always supplies a stable external_game_id, giving it one row per game.
create unique index if not exists uq_game_results_org_external_game
  on public.game_results(org_id, external_game_id);

-- BEFORE INSERT trigger: derive org_id from the event so the ingest path (and
-- any caller) never has to supply it; NOT NULL then fails loud on an orphan event.
create or replace function public.set_game_results_org_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.org_id is null then
    select t.org_id into new.org_id
    from public.events e
    join public.teams t on t.id = e.team_id
    where e.id = new.event_id;
  end if;
  return new;
end;
$$;
revoke execute on function public.set_game_results_org_id() from public;
revoke execute on function public.set_game_results_org_id() from anon;

drop trigger if exists trg_game_results_org_id on public.game_results;
create trigger trg_game_results_org_id
  before insert on public.game_results
  for each row execute function public.set_game_results_org_id();

-- ─────────────────────────────────────────────────────────────────────────
-- 2. feed_source_mapping — org/team → external feed scope (R1, NET-NEW). NO clone.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.feed_source_mapping (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  team_id         uuid references public.teams(id) on delete set null,
  tournament_id   uuid references public.tournaments(id) on delete set null,
  source_type     text not null default 'tourney_machine'
                    check (source_type in ('tourney_machine')),
  external_feed_id text not null,
  feed_scope      text not null default 'division'
                    check (feed_scope in ('division','tournament','team_slot')),
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  unique (org_id, source_type, external_feed_id)
);
create index if not exists idx_feed_source_mapping_org on public.feed_source_mapping(org_id);

alter table public.feed_source_mapping enable row level security;

-- Org-scoped read. (auth.uid() subselect-wrapped per CLAUDE.md §5 RLS pattern.)
drop policy if exists feed_source_mapping_select_org on public.feed_source_mapping;
create policy feed_source_mapping_select_org on public.feed_source_mapping
  for select to authenticated
  using (org_id = (select public.current_user_org_id()));

-- Org-scoped write with EXPLICIT with_check (AP #20 — no NULL with_check on a
-- write policy). NOTE (held-review follow-up): tighten to org-ADMIN role once an
-- is_org_admin() helper is confirmed; the real automated writes come from the
-- service-role ingest fn (bypasses RLS), so this guards only manual UI writes.
drop policy if exists feed_source_mapping_write_org on public.feed_source_mapping;
create policy feed_source_mapping_write_org on public.feed_source_mapping
  for all to authenticated
  using (org_id = (select public.current_user_org_id()))
  with check (org_id = (select public.current_user_org_id()));

-- ─────────────────────────────────────────────────────────────────────────
-- 3. get_public_team_records — public read (DR-B: RLS-policy-gated table +
--    this RPC's display-column projection). NO PII columns. SECDEF replicates
--    the game_results_select_public row filter (published_at + org public).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.get_public_team_records(p_team_id uuid)
returns table (
  game_id            uuid,
  event_id           uuid,
  played_at          timestamptz,
  opponent           text,
  home_away          text,
  our_score          integer,
  opponent_score     integer,
  result             text,
  point_differential integer,
  coach_highlight    text,
  published_at       timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select gr.id, gr.event_id, e.start_at, e.opponent, e.home_away,
         gr.our_score, gr.opponent_score, gr.result, gr.point_differential,
         gr.coach_highlight, gr.published_at
  from public.game_results gr
  join public.events e on e.id = gr.event_id
  join public.teams  t on t.id = e.team_id
  where e.team_id = p_team_id
    and gr.published_at is not null            -- mirrors game_results_select_public
    and public.org_is_public_listed(t.org_id)  -- public-listing gate
  order by e.start_at desc;
$$;

-- Deliberately public read (the portal). REVOKE PUBLIC + anon first (clears the
-- Supabase default-privilege grant, AP #23/#57), then GRANT explicitly. The
-- privacy boundary is the display-column projection above — player_of_game_id,
-- entered_by, published_by, private_notes, org_id are NEVER selected.
revoke execute on function public.get_public_team_records(uuid) from public;
revoke execute on function public.get_public_team_records(uuid) from anon;
grant execute on function public.get_public_team_records(uuid) to anon, authenticated;

comment on function public.get_public_team_records(uuid) is
  'Public team records/results for a public-listed org (portal read). Display columns only; no PII. BUILD SPEC v3 §3 DR-B.';
