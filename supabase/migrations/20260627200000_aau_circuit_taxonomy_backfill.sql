-- §2.C circuit taxonomy backfill — collapse the AAU directory `circuit` column to three operator-
-- ruled buckets: {AAU Tournament, League Play, Other} (Frank, 2026-06-27).
--
-- ░░ PREPARED — NOT APPLIED ░░  Owner applies on Frank's explicit L99 go. This mirrors the division
-- taxonomy backfill 20260627122920 (owner-authorized + architect-ratified): a one-time, deterministic,
-- name-DERIVED reclassification of a STRUCTURED column. The "no name-parsing" rule binds the CLIENT/
-- render — the §2.C/L99 backfill lane is exactly where a name-derived column fix is sanctioned (spec
-- §R3 note). The durable fix is to classify `circuit` at INGEST (flagged below), so new scrapes land
-- correctly without a re-backfill.
--
-- Grounded 2026-06-27 (public-listed AAU tournaments, archived_at IS NULL): circuit was
--   7 × NULL  · 5 × 'AAU Zero Gravity' · 1 × 'League Play'
-- with Zero Gravity events scattered between 'AAU Zero Gravity' and NULL→"Other" in the UI.
--
-- Classification (deterministic, order matters):
--   1. League Play   := name ~* '\mleague\M'   (WPCYO Spring League; ZG Tri-State Winter League)
--   2. AAU Tournament:= Zero Gravity brand events OR prior 'AAU Zero Gravity', minus leagues
--   3. Other         := whatever remains NULL (e.g. BBallshootout Pre Summer Hoops Jam) — named, not null
--
-- Expected result (13 public tournaments): 10 AAU Tournament · 2 League Play · 1 Other.
-- Reversible: this only rewrites a display/grouping label; no schema/RLS/money/child-data change.
-- Scoped to public-listed orgs so nothing non-surfaced is touched.

begin;

-- 1) League Play first — a "Winter League" Zero Gravity event is League Play, not a tournament.
update public.tournaments t
set circuit = 'League Play'
where t.archived_at is null
  and public.org_is_public_listed(t.org_id)
  and t.name ~* '\mleague\M';

-- 2) AAU Tournament — Zero Gravity brand events + the existing 'AAU Zero Gravity' rows (not leagues).
update public.tournaments t
set circuit = 'AAU Tournament'
where t.archived_at is null
  and public.org_is_public_listed(t.org_id)
  and t.name !~* '\mleague\M'
  and (t.name ~* 'zero\s*gravity' or t.circuit = 'AAU Zero Gravity');

-- 3) Everything still NULL that is neither AAU-brand nor a league → explicit 'Other' (named bucket).
update public.tournaments t
set circuit = 'Other'
where t.archived_at is null
  and public.org_is_public_listed(t.org_id)
  and t.circuit is null;

commit;

-- Post-apply verification (run after):
--   SELECT circuit, count(*) FROM public.tournaments
--   WHERE archived_at IS NULL AND public.org_is_public_listed(org_id) GROUP BY circuit ORDER BY 2 DESC;
--   -- expect: AAU Tournament 10 · League Play 2 · Other 1
--
-- DURABLE FOLLOW-UP (separate, not here): apply the same classification at INGEST in the
-- aau-ingest-tournament edge function so new scrapes land with a correct `circuit` and this
-- backfill never has to run again. Tracked in docs/AAU_CIRCUIT_TAXONOMY_DECISION_2026-06-27.txt.
