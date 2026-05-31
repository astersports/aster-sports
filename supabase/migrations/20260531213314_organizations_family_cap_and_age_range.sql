-- Migration #11 (EMBER_PROGRAM_SETUP_SPEC_v2 §4.5 step 11): organizations.family_cap_policy +
-- acceptable_age_range. Two additive columns on organizations (1 row). Spec lines 194-195 + Q20.
--   family_cap_policy JSONB     — F4 D6 per-org family pricing cap, applied server-side at checkout.
--                                 NULL = no family cap (the checkout reads NULL as "no discount").
--   acceptable_age_range INT4RANGE — player age band cap. LH default [4,14] (Q20), St Pats [8,18].
-- Both nullable/additive → existing reads unaffected. LH's age range is seeded to [4,14] inline
-- (1 known org, documented default — avoids a follow-up data PR); family_cap_policy left NULL until a
-- policy is configured. Applied via Supabase MCP 2026-05-31 (version 20260531213314).

ALTER TABLE public.organizations
  ADD COLUMN family_cap_policy   jsonb,
  ADD COLUMN acceptable_age_range int4range;

-- Seed LH's documented age band (Q20: LH = grades 2-5, ages 4-14). int4range '[4,15)' = inclusive
-- 4..14 (upper bound exclusive in canonical int4range form).
UPDATE public.organizations
  SET acceptable_age_range = int4range(4, 15, '[)')
  WHERE id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

-- Verify.
DO $$
DECLARE v_lower int; v_upper int;
BEGIN
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations'
        AND column_name IN ('family_cap_policy','acceptable_age_range')) <> 2 THEN
    RAISE EXCEPTION 'verify failed: expected 2 new organizations columns';
  END IF;
  IF (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='family_cap_policy') <> 'jsonb' THEN
    RAISE EXCEPTION 'verify failed: family_cap_policy not jsonb';
  END IF;
  SELECT lower(acceptable_age_range), upper(acceptable_age_range) INTO v_lower, v_upper
    FROM public.organizations WHERE id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
  IF v_lower <> 4 OR v_upper <> 15 THEN
    RAISE EXCEPTION 'verify failed: LH age range is [%,%) expected [4,15)', v_lower, v_upper;
  END IF;
  RAISE NOTICE 'organizations extensions verified: family_cap_policy jsonb + acceptable_age_range int4range added; LH seeded [4,15) = ages 4-14.';
END $$;
