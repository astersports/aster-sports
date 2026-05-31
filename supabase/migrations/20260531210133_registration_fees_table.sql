-- Migration #7 (EMBER_PROGRAM_SETUP_SPEC_v2 §4.5 step 7): registration_fees.
-- Realized fee line items per registration (the per-registration snapshot of what was actually
-- billed). Spec §4.2 base list is (registration_id, fee_id, amount_cents); §4.2 F1.v1.2 additionally
-- requires a fee_type on these rows — the family-cap discount audit trail is a registration_fees row
-- with fee_type='family_discount', computed server-side at checkout with NO source division_fee. So:
--   * fee_id NULLABLE → division_fees SET NULL: family discounts have no template; and deleting a
--     fee template must never erase realized billing history (financial record preservation).
--   * fee_type reuses the division_fee_type enum (snapshot; lets a family_discount row exist without fee_id).
-- registration_id → registrations CASCADE per §4.4 (line 258). RLS mirrors registrations/programs.
-- Applied via Supabase MCP 2026-05-31 (version 20260531210133).

CREATE TABLE public.registration_fees (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  registration_id  uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  fee_id           uuid REFERENCES public.division_fees(id) ON DELETE SET NULL,  -- nullable: family_discount rows have no source template
  fee_type         public.division_fee_type,  -- snapshot; required-by-convention for templateless rows (family_discount)
  amount_cents     integer NOT NULL DEFAULT 0,  -- realized amount actually billed (signed; discounts negative)
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_registration_fees_registration_id ON public.registration_fees(registration_id);
CREATE INDEX idx_registration_fees_fee_id          ON public.registration_fees(fee_id);
CREATE INDEX idx_registration_fees_org_id          ON public.registration_fees(org_id);

CREATE TRIGGER trg_registration_fees_updated_at BEFORE UPDATE ON public.registration_fees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.registration_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY registration_fees_select ON public.registration_fees
  FOR SELECT TO authenticated USING (org_id = current_user_org_id());
CREATE POLICY registration_fees_insert ON public.registration_fees
  FOR INSERT WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY registration_fees_update ON public.registration_fees
  FOR UPDATE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]))
            WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY registration_fees_delete ON public.registration_fees
  FOR DELETE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_fees TO anon, authenticated, service_role;

-- Verify.
DO $$
BEGIN
  IF (SELECT relkind FROM pg_class WHERE oid='public.registration_fees'::regclass) <> 'r' THEN
    RAISE EXCEPTION 'verify failed: not a base table';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.registration_fees'::regclass) THEN
    RAISE EXCEPTION 'verify failed: RLS not enabled';
  END IF;
  IF (SELECT count(*) FROM pg_policy WHERE polrelid='public.registration_fees'::regclass) <> 4 THEN
    RAISE EXCEPTION 'verify failed: expected 4 RLS policies, got %', (SELECT count(*) FROM pg_policy WHERE polrelid='public.registration_fees'::regclass);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='registration_fees_registration_id_fkey' AND confrelid='public.registrations'::regclass AND confdeltype='c') THEN
    RAISE EXCEPTION 'verify failed: registration_id FK not CASCADE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='registration_fees_fee_id_fkey' AND confrelid='public.division_fees'::regclass AND confdeltype='n') THEN
    RAISE EXCEPTION 'verify failed: fee_id FK not SET NULL to division_fees';
  END IF;
  IF (SELECT is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='registration_fees' AND column_name='fee_id') <> 'YES' THEN
    RAISE EXCEPTION 'verify failed: fee_id should be nullable';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='registration_fees'
        AND column_name IN ('registration_id','fee_id','fee_type','amount_cents')) <> 4 THEN
    RAISE EXCEPTION 'verify failed: missing expected columns';
  END IF;
  RAISE NOTICE 'registration_fees verified: base table, RLS on, 4 policies, registration_id CASCADE, fee_id SET NULL+nullable, fee_type/amount_cents present.';
END $$;
