-- Migration A: financials spine — invoices, invoice tagging, settlement RPC, relic deprecation
-- DR-F1 (event-sourced settlement), DR-F5 (billing contract), DR-F4 (rate relic)
-- Applied via Supabase MCP 2026-06-13. Mirror of production version 20260613203959.

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES financial_accounts(id) ON DELETE RESTRICT,
  season_id uuid NOT NULL,
  invoice_number int NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','paid','overdue','void')),
  issued_at timestamptz,
  due_date date,
  sent_at timestamptz,
  sent_to text,
  total_cents int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, invoice_number)
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_admin ON public.invoices FOR ALL
  USING (user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));
CREATE POLICY invoices_parent_read ON public.invoices FOR SELECT
  USING (account_id IN (
    SELECT fa.id FROM financial_accounts fa
    JOIN guardians g ON g.id = fa.guardian_id
    WHERE g.user_id = auth.uid()));

ALTER TABLE public.financial_transactions
  ADD COLUMN invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION next_invoice_number(p_org uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $fn$
DECLARE n int;
BEGIN
  SELECT COALESCE(MAX(invoice_number),0)+1 INTO n
    FROM invoices WHERE org_id = p_org FOR UPDATE;
  RETURN n;
END $fn$;
GRANT EXECUTE ON FUNCTION next_invoice_number(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION pay_coach(
  p_org uuid, p_coach uuid, p_season uuid, p_session_ids uuid[],
  p_amount_cents int, p_status text, p_method text, p_paid_at timestamptz, p_notes text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $fn$
DECLARE v_payout uuid; v_bad int;
BEGIN
  IF NOT user_has_role_in_org(p_org, ARRAY['admin']) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT count(*) INTO v_bad
  FROM unnest(p_session_ids) sid
  LEFT JOIN event_coach_assignments ea ON ea.id = sid
  LEFT JOIN events e ON e.id = ea.event_id
  LEFT JOIN teams t ON t.id = e.team_id
  WHERE ea.id IS NULL OR ea.coach_user_id <> p_coach
     OR ea.pay_status <> 'owed' OR t.org_id <> p_org;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'settlement aborted: % invalid/non-owed sessions', v_bad;
  END IF;

  INSERT INTO coach_payouts (org_id, coach_user_id, season_id, amount_cents, status,
    payment_method, paid_at, source_assignments, notes)
  VALUES (p_org, p_coach, p_season, p_amount_cents, p_status, p_method, p_paid_at,
    p_session_ids, p_notes)
  RETURNING id INTO v_payout;

  UPDATE event_coach_assignments
    SET pay_status='paid', settled_by_payout_id=v_payout
    WHERE id = ANY(p_session_ids) AND pay_status='owed';
  RETURN v_payout;
END $fn$;
GRANT EXECUTE ON FUNCTION pay_coach(uuid,uuid,uuid,uuid[],int,text,text,timestamptz,text) TO authenticated;

COMMENT ON COLUMN coaching_assignments.rates IS 'DEPRECATED 2026-06-13 (DR-F4): unused. Live rate = pay_per_session_cents per assignment row.';
COMMENT ON TABLE registration_fees IS 'DEPRECATED 2026-06-13 (DR-F5): billing = fee financial_transactions stamped with registration_id.';

DO $v$
BEGIN
  IF to_regclass('public.invoices') IS NULL THEN RAISE EXCEPTION 'verify failed: invoices missing'; END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='financial_transactions' AND column_name='invoice_id') THEN RAISE EXCEPTION 'verify failed: invoice_id missing'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE proname='pay_coach') THEN RAISE EXCEPTION 'verify failed: pay_coach missing'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE proname='next_invoice_number') THEN RAISE EXCEPTION 'verify failed: next_invoice_number missing'; END IF;
END $v$;
