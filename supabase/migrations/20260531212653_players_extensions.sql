-- Migration #10 (EMBER_PROGRAM_SETUP_SPEC_v2 §4.5 step 10): players extensions.
-- Additive columns on the live players table (115 rows). All nullable → no backfill, existing reads
-- unaffected. Spec line 222-225:
--   grade_school_year INT   — school grade-year (distinct from the existing `grade` int)
--   school TEXT
--   aau_member_id TEXT NULLABLE
--   can_have_own_account BOOL (computed, age >= 13)
--
-- DEVIATION (flagged): can_have_own_account is NOT added as a stored column. Postgres 17 cannot
-- express an age-based value as a generated/stored column — `age(dob) >= 13` depends on current_date
-- (non-immutable), and PG17 has no VIRTUAL generated columns (PG18+). A stored boolean would go stale
-- daily without a cron. It has zero consumers today (kid login is Phase 3+ per spec §4.1; AP #51 =
-- don't build dead infra), so it is computed app-side when needed: `dob IS NOT NULL AND dob <=
-- (current_date - interval '13 years')`. The source column (dob) already exists. Revisit when kid
-- login actually ships. Applied via Supabase MCP 2026-05-31 (version 20260531212653).

ALTER TABLE public.players
  ADD COLUMN grade_school_year integer,
  ADD COLUMN school            text,
  ADD COLUMN aau_member_id     text;

-- Verify.
DO $$
BEGIN
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='players'
        AND column_name IN ('grade_school_year','school','aau_member_id')) <> 3 THEN
    RAISE EXCEPTION 'verify failed: expected 3 new players columns';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='players'
        AND column_name IN ('grade_school_year','school','aau_member_id') AND is_nullable <> 'YES') THEN
    RAISE EXCEPTION 'verify failed: a new column is NOT NULL (should be nullable)';
  END IF;
  IF (SELECT count(*) FROM public.players) <> 115 THEN
    RAISE EXCEPTION 'verify failed: player count changed from 115';
  END IF;
  RAISE NOTICE 'players extensions verified: 3 nullable columns added, 115 rows intact. can_have_own_account deferred (app-computed, see comment).';
END $$;
