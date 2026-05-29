-- Migration #2 (EMBER_PROGRAM_SETUP_SPEC_v2 build, PR 2): backfill programs from seasons.
-- Spec §4.5 step 2. One program row per existing season, program_type='season', sport_id =
-- the org's Basketball sport (seeded in migration #1a). PRESERVES seasons.id AS programs.id so
-- existing FKs that reference season ids stay valid after PR 3 swaps seasons → a compat view.
-- Idempotent: ON CONFLICT (id) DO NOTHING (id is the PK) — safe to re-run. Additive: the
-- seasons table is untouched (PR 3 converts it). Applied via Supabase MCP 2026-05-29 (version 20260529160011).

INSERT INTO public.programs
  (id, org_id, sport_id, program_type, name, start_date, end_date, status,
   parent_program_id, rolled_over_at, created_at, updated_at)
SELECT
  s.id,
  s.org_id,
  (SELECT sp.id FROM public.sports sp WHERE sp.org_id = s.org_id AND sp.name = 'Basketball'),
  'season'::public.program_type,
  s.name, s.start_date, s.end_date, s.status, s.parent_season_id, s.rolled_over_at,
  s.created_at, s.updated_at
FROM public.seasons s
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE v_seasons int; v_programs int; v_missing int; v_no_sport int;
BEGIN
  SELECT count(*) INTO v_seasons FROM public.seasons;
  SELECT count(*) INTO v_programs FROM public.programs WHERE program_type='season';
  IF v_programs <> v_seasons THEN
    RAISE EXCEPTION 'verify failed: season-programs (%) != seasons (%)', v_programs, v_seasons;
  END IF;
  SELECT count(*) INTO v_missing FROM public.seasons s
    WHERE NOT EXISTS (SELECT 1 FROM public.programs p WHERE p.id = s.id);
  IF v_missing <> 0 THEN
    RAISE EXCEPTION 'verify failed: % season ids not mirrored into programs', v_missing;
  END IF;
  SELECT count(*) INTO v_no_sport FROM public.programs WHERE program_type='season' AND sport_id IS NULL;
  IF v_no_sport <> 0 THEN
    RAISE EXCEPTION 'verify failed: % backfilled programs have null sport_id', v_no_sport;
  END IF;
  RAISE NOTICE 'programs backfill verified: % season rows, all ids mapped, all sport_id set.', v_programs;
END $$;
