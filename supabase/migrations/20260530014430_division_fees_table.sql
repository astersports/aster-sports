-- Migration #5 (EMBER_PROGRAM_SETUP_SPEC_v2 §4.5 step 5): division_fees + auto_apply_rule.
-- Line-item fees per division. fee_type native enum (mirrors program_type style). auto_apply_rule
-- JSONB holds F1.v1.2 address-based geo rules (e.g. {"type":"address_not_in_zips","zips":["10504"]} —
-- St Pats parishioner pricing, spec Q17). FK divisions→division_fees CASCADE per §4.4. RLS mirrors
-- divisions/programs. Applied via Supabase MCP 2026-05-30 (version 20260530014430).

CREATE TYPE public.division_fee_type AS ENUM ('base','add_on','discount','early_bird','prorated','family_discount');

CREATE TABLE public.division_fees (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  division_id      uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  name             text NOT NULL,
  fee_type         public.division_fee_type NOT NULL DEFAULT 'base',
  amount_cents     integer NOT NULL DEFAULT 0,   -- signed; discount-type fees may carry negative amounts (sign semantics applied at checkout)
  auto_apply_rule  jsonb,                          -- F1.v1.2 address-based geo rules; null = always applies
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_division_fees_division_id ON public.division_fees(division_id);
CREATE INDEX idx_division_fees_org_id      ON public.division_fees(org_id);

CREATE TRIGGER trg_division_fees_updated_at BEFORE UPDATE ON public.division_fees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.division_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY division_fees_select ON public.division_fees
  FOR SELECT TO authenticated USING (org_id = current_user_org_id());
CREATE POLICY division_fees_insert ON public.division_fees
  FOR INSERT WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY division_fees_update ON public.division_fees
  FOR UPDATE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]))
            WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY division_fees_delete ON public.division_fees
  FOR DELETE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.division_fees TO anon, authenticated, service_role;

-- Verify.
DO $$
BEGIN
  IF (SELECT relkind FROM pg_class WHERE oid='public.division_fees'::regclass) <> 'r' THEN
    RAISE EXCEPTION 'verify failed: division_fees is not a base table';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.division_fees'::regclass) THEN
    RAISE EXCEPTION 'verify failed: RLS not enabled on division_fees';
  END IF;
  IF (SELECT count(*) FROM pg_policy WHERE polrelid='public.division_fees'::regclass) <> 4 THEN
    RAISE EXCEPTION 'verify failed: expected 4 RLS policies, got %', (SELECT count(*) FROM pg_policy WHERE polrelid='public.division_fees'::regclass);
  END IF;
  IF (SELECT count(*) FROM pg_enum WHERE enumtypid='public.division_fee_type'::regtype) <> 6 THEN
    RAISE EXCEPTION 'verify failed: division_fee_type enum should have 6 values';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='division_fees_division_id_fkey' AND confrelid='public.divisions'::regclass AND confdeltype='c') THEN
    RAISE EXCEPTION 'verify failed: division_fees->divisions FK not CASCADE';
  END IF;
  IF (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='division_fees' AND column_name='auto_apply_rule') <> 'jsonb' THEN
    RAISE EXCEPTION 'verify failed: auto_apply_rule is not jsonb';
  END IF;
  RAISE NOTICE 'division_fees verified: base table, RLS on, 4 policies, 6-value enum, FK CASCADE to divisions, auto_apply_rule jsonb.';
END $$;
