-- Persist the TourneyMachine IDTournament on each tournament so a re-ingest is always
-- reproducible (the id was previously only kept on self-serve submission rows). Nullable;
-- backfilled for known tournaments and set by the ingest going forward.
alter table public.tournaments add column if not exists tm_id_tournament text;
comment on column public.tournaments.tm_id_tournament is
  'TourneyMachine IDTournament (from the public Tournament.aspx URL) — the reproducible re-ingest key for AAU tournaments.';
create unique index if not exists tournaments_tm_id_tournament_uq
  on public.tournaments (tm_id_tournament) where tm_id_tournament is not null;
