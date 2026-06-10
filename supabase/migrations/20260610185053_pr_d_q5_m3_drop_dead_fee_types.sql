-- 20260610185053_pr_d_q5_m3_drop_dead_fee_types.sql
--
-- MIRROR (AP#21) of the migration applied via the GO-gated MCP lane on 2026-06-10
-- (version 20260610185053). Source-tree record of what is LIVE; NOT re-applied here.
--
-- D-Q5 M3 (Frank GO): drop the dead division_fee_type values
-- (discount/early_bird/prorated) + the dead auto_apply_rule jsonb, and align the
-- registration_fees.fee_type NOT NULL drift. Safe + cheap: division_fees +
-- registration_fees both empty (0 rows), no function binds the type. Only 'base'
-- (create) + 'add_on' (B0/RPC) + 'family_discount' (RPC) are ever written.
--
-- NOTE: division_fees.fee_type carries DEFAULT 'base' — dropped before the type
-- swap and restored after (a default referencing the old type can't auto-cast).

ALTER TABLE public.division_fees ALTER COLUMN fee_type DROP DEFAULT;

ALTER TYPE public.division_fee_type RENAME TO division_fee_type_old;
CREATE TYPE public.division_fee_type AS ENUM ('base', 'add_on', 'family_discount');

ALTER TABLE public.division_fees
  ALTER COLUMN fee_type TYPE public.division_fee_type
  USING fee_type::text::public.division_fee_type;
ALTER TABLE public.registration_fees
  ALTER COLUMN fee_type TYPE public.division_fee_type
  USING fee_type::text::public.division_fee_type;

DROP TYPE public.division_fee_type_old;

ALTER TABLE public.division_fees ALTER COLUMN fee_type SET DEFAULT 'base'::public.division_fee_type;
ALTER TABLE public.registration_fees ALTER COLUMN fee_type SET NOT NULL;
ALTER TABLE public.division_fees DROP COLUMN auto_apply_rule;

-- verify: enum has exactly the 3 live values, registration_fees.fee_type NOT NULL,
-- division_fees.fee_type DEFAULT restored, auto_apply_rule gone.
DO $$
DECLARE v_vals text; v_nn text; v_col int; v_def text;
BEGIN
  SELECT string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) INTO v_vals
    FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='division_fee_type';
  IF v_vals <> 'base,add_on,family_discount' THEN RAISE EXCEPTION 'M3 verify: enum = %', v_vals; END IF;
  SELECT is_nullable INTO v_nn FROM information_schema.columns
    WHERE table_name='registration_fees' AND column_name='fee_type';
  IF v_nn <> 'NO' THEN RAISE EXCEPTION 'M3 verify: registration_fees.fee_type nullable=%', v_nn; END IF;
  SELECT column_default INTO v_def FROM information_schema.columns
    WHERE table_name='division_fees' AND column_name='fee_type';
  IF v_def IS NULL OR v_def NOT LIKE '%base%' THEN RAISE EXCEPTION 'M3 verify: division_fees default = %', v_def; END IF;
  SELECT count(*) INTO v_col FROM information_schema.columns
    WHERE table_name='division_fees' AND column_name='auto_apply_rule';
  IF v_col <> 0 THEN RAISE EXCEPTION 'M3 verify: auto_apply_rule still present'; END IF;
END $$;
