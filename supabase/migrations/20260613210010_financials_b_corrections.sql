-- Migration C: financials B corrections + audit money-safety folds
-- B-2 (AR aging never-paid), B-3 (initplan), P1-1 (double-void), P1-7 (append-only trigger)
-- Applied via Supabase MCP 2026-06-13. Mirror of production version 20260613210010.
-- Forward correction of Migration B (20260613204237); B is left as-applied, not rewritten.

-- B-2: age never-paid debt from the billing date, not now()
CREATE OR REPLACE VIEW public.ar_aging AS
SELECT fb.org_id, fb.season_id, fb.account_id, fb.guardian_id, fb.balance_cents,
  CASE
    WHEN fb.balance_cents <= 0 THEN 'current'
    WHEN now() - COALESCE(fb.last_payment_at, fa.created_at, now()) < interval '31 days' THEN 'd0_30'
    WHEN now() - COALESCE(fb.last_payment_at, fa.created_at, now()) < interval '61 days' THEN 'd31_60'
    ELSE 'd60_plus'
  END AS bucket
FROM family_balances fb
LEFT JOIN financial_accounts fa ON fa.id = fb.account_id;
ALTER VIEW public.ar_aging SET (security_invoker = true);

-- B-3: conform the 3 parent-read policies to the initplan form
DROP POLICY invoices_parent_read ON public.invoices;
CREATE POLICY invoices_parent_read ON public.invoices FOR SELECT
  USING (account_id IN (SELECT fa.id FROM financial_accounts fa
    JOIN guardians g ON g.id=fa.guardian_id WHERE g.user_id=(SELECT auth.uid())));
DROP POLICY pp_parent_read ON public.payment_plans;
CREATE POLICY pp_parent_read ON public.payment_plans FOR SELECT
  USING (account_id IN (SELECT fa.id FROM financial_accounts fa
    JOIN guardians g ON g.id=fa.guardian_id WHERE g.user_id=(SELECT auth.uid())));
DROP POLICY ppi_parent_read ON public.payment_plan_installments;
CREATE POLICY ppi_parent_read ON public.payment_plan_installments FOR SELECT
  USING (plan_id IN (SELECT pp.id FROM payment_plans pp
    JOIN financial_accounts fa ON fa.id=pp.account_id
    JOIN guardians g ON g.id=fa.guardian_id WHERE g.user_id=(SELECT auth.uid())));

-- P1-1: prevent double-void at the DB
CREATE UNIQUE INDEX uq_fin_tx_reverses ON public.financial_transactions (reverses_transaction_id)
  WHERE reverses_transaction_id IS NOT NULL;

-- P1-7: append-only beyond RLS (verified: nothing mutates this table)
CREATE OR REPLACE FUNCTION fin_tx_append_only() RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  RAISE EXCEPTION 'financial_transactions is append-only; reverse via an offsetting entry (reverses_transaction_id), never UPDATE/DELETE';
END $fn$;
CREATE TRIGGER fin_tx_no_mutate BEFORE UPDATE OR DELETE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION fin_tx_append_only();

DO $v$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='uq_fin_tx_reverses') THEN RAISE EXCEPTION 'verify: reverses index missing'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='fin_tx_no_mutate') THEN RAISE EXCEPTION 'verify: append-only trigger missing'; END IF;
  IF (SELECT count(*) FROM pg_policies WHERE policyname IN ('invoices_parent_read','pp_parent_read','ppi_parent_read')) <> 3 THEN RAISE EXCEPTION 'verify: parent policy count <> 3'; END IF;
END $v$;
