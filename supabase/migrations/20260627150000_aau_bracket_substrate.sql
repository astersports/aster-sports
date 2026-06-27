-- §2.B bracket substrate — ADDITIVE source-native capture on division_games.
-- Architect-ratified 2026-06-27 (ARCHITECT_RULING_GAMEID_AND_2B). HELD PR: owner
-- applies. This is the LOW-RISK additive half — it adds nullable columns + a
-- backfill and changes NO upsert key and NO unique index. The identity SWAP
-- (repopulate external_game_id off source_game_id + the new unique index) is the
-- GATED §2.D change: it waits on the re-seed proof and returns for a fresh L99.
--
-- Source-neutral by design (charter first principle): TM's durable per-game id
-- (data-gameid) lands in source_game_id, paired with the `source` discriminator,
-- so the first non-TM adapter writes its own native id into the SAME shape — no
-- TM-named identity column. The positional P#/B#/G# slot label is demoted to the
-- mutable attribute game_code. bracket_slots is populated by the ingest at
-- runtime (no DDL here); its unique index already exists.

alter table public.division_games
  add column if not exists source                text,
  add column if not exists game_code             text,
  add column if not exists source_game_id        text,
  add column if not exists home_source_team_ref  text,
  add column if not exists away_source_team_ref  text,
  add column if not exists source_facility_ref   text;

-- Backfill existing rows: every current division_games row is TourneyMachine, and
-- external_game_id currently holds the slot label — mirror it into game_code so the
-- mutable attribute is populated ahead of the §2.D swap. source_game_id stays NULL
-- on historical rows (the durable data-gameid is only captured on the next ingest).
update public.division_games
   set source = 'tourneymachine',
       game_code = coalesce(game_code, external_game_id)
 where source is null;

comment on column public.division_games.source is
  'Source-system discriminator (e.g. tourneymachine). Pairs with source_game_id so a non-TM adapter fits the same identity shape (§2.B, 2026-06-27).';
comment on column public.division_games.source_game_id is
  'Durable source-native game id (TM data-gameid = h<created-ts><hex>). §2.D Layer-1 identity: external_game_id will be repopulated from this behind a new unique index, after the re-seed proof + L99. Slot label demoted to game_code.';
comment on column public.division_games.game_code is
  'Mutable bracket/pool slot label (P#/B#/G#) — the demoted positional value, an ATTRIBUTE not an identity (§2.B).';
comment on column public.division_games.home_source_team_ref is
  'Source-native team id for the home side (TM data-teamid); empty/NULL for an unresolved seed. Capture-only in §2.B; linkage decided in §2.D.';
comment on column public.division_games.away_source_team_ref is
  'Source-native team id for the away side (TM data-teamid); capture-only in §2.B.';
comment on column public.division_games.source_facility_ref is
  'Source-native venue id (TM data-facilityid). Venue is currently name-matched; §2.D may harden linkage onto this. Capture-only in §2.B.';
