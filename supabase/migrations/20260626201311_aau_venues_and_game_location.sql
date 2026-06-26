-- AAU tracking hub — venues + per-game location (build-bible §2.1/§2.2; C4 "every
-- game, every venue"). Adds a shared, public `venues` table and links each external
-- division_game to a venue + court so the .io hub can render venue + court + time +
-- Apple/Google/Waze directions on EVERY game (today it's only the hardcoded practice
-- gyms).
--
-- HOLD (build-bible): owner applies this migration — no agent MCP-apply. Prepared by
-- CC for owner application. Grounded against the live schema 2026-06-26:
--   • division_games ALREADY HAS `start_at` (timestamptz) + `status` (text, NOT NULL)
--     — this migration does NOT re-add them; it adds `venue_id` + `court` ONLY.
--   • `venues` does not exist yet.
-- AP #21: if applied via dashboard/CLI, keep this filename's version prefix aligned
-- with the applied version string.

-- ── 2.1  venues ─────────────────────────────────────────────────────────────
-- Shared public facility addresses. Intentionally NO org_id: a gym is the same
-- place across orgs, and venues are de-duped GLOBALLY (a director tracking teams
-- from several programs sees one "Westchester County Center", not one per org).
-- Not sensitive (facility names/addresses only — no PII, no org scoping), so reads
-- are PUBLIC: the venues_read_all policy below permits direct anon/auth SELECT, and
-- the hub's SECDEF RPCs read it too. Writes are service_role only (no anon/auth write
-- policy ⇒ denied by RLS).
create table if not exists public.venues (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  address         text,
  city            text,
  state           text,
  zip             text,
  lat             double precision,
  lng             double precision,
  tm_venue_key    text,                       -- TourneyMachine site/location id (de-dup)
  geocode_status  text not null default 'pending'
                    check (geocode_status in ('pending','ok','failed')),
  geocoded_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- de-dup: one row per real place (by TM site id when present, else by name+addr+city)
create unique index if not exists venues_tm_key_uq on public.venues (tm_venue_key)
  where tm_venue_key is not null;
create unique index if not exists venues_name_addr_uq on public.venues
  (lower(btrim(name)), lower(btrim(coalesce(address, ''))), lower(btrim(coalesce(city, ''))));
-- the geocode worker's queue (§3.3): rows still needing lat/lng
create index if not exists venues_geocode_pending on public.venues (geocode_status)
  where geocode_status = 'pending';

alter table public.venues enable row level security;
drop policy if exists venues_read_all on public.venues;
create policy venues_read_all on public.venues for select using (true);
-- No write policy ⇒ only service_role (which bypasses RLS) can insert/update venues,
-- i.e. the ingest + geocode edge functions. Reads are public by design (above).

-- ── 2.2  per-game location on the external-game store ───────────────────────
-- division_games holds EXTERNAL-vs-external games (our own games stay authoritative
-- in the app's events/game_results). start_at + status already exist; add the venue
-- link + court only.
alter table public.division_games
  add column if not exists venue_id uuid references public.venues(id),
  add column if not exists court    text;

create index if not exists division_games_venue on public.division_games (venue_id);
create index if not exists division_games_start_at on public.division_games (start_at);

comment on table public.venues is
  'Shared public tournament/practice venues (no org_id — global de-dup). Powers AAU-hub navigation (Apple/Google/Waze) + the locations map. Writes: service_role (ingest + geocode-venues) only.';
comment on column public.division_games.venue_id is
  'FK → venues. Per-game venue captured from the TourneyMachine site name during ingest (build-bible §3.2); geocoded once by geocode-venues (§3.3).';
comment on column public.division_games.court is
  'Sub-venue court/field label from TM (e.g. "Court 3"). Display only.';
