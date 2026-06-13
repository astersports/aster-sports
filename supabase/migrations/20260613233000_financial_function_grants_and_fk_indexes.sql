-- Audit hardening: lock down the two SECDEF money functions (AP#23/#57) + add
-- the missing admin auth check to next_invoice_number (was anon-callable cross-
-- tenant info leak) + FK covering indexes on the new financial tables.
-- Applied via Supabase MCP 2026-06-13. Mirror of production version 20260613233000.

-- next_invoice_number: add admin gate; drop the no-op FOR UPDATE-on-aggregate
-- (UNIQUE(org_id,invoice_number) + caller retry-on-23505 is the concurrency
-- contract for PR-5). CREATE first, then REVOKE, so the re-create can't re-grant anon.
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_org uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $fn$
DECLARE n int;
BEGIN
  IF NOT user_has_role_in_org(p_org, ARRAY['admin']) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT COALESCE(MAX(invoice_number),0)+1 INTO n FROM invoices WHERE org_id = p_org;
  RETURN n;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.next_invoice_number(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_invoice_number(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.next_invoice_number(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.pay_coach(uuid,uuid,uuid,uuid[],int,text,text,timestamptz,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pay_coach(uuid,uuid,uuid,uuid[],int,text,text,timestamptz,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.pay_coach(uuid,uuid,uuid,uuid[],int,text,text,timestamptz,text) TO authenticated;

-- FK covering indexes (audit P2): admin/parent read paths + cascade checks.
CREATE INDEX IF NOT EXISTS idx_invoices_account_id ON public.invoices (account_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_account_id ON public.payment_plans (account_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_invoice_id ON public.payment_plans (invoice_id);
CREATE INDEX IF NOT EXISTS idx_ppi_paid_transaction_id ON public.payment_plan_installments (paid_transaction_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_invoice_id ON public.financial_transactions (invoice_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_discount_id ON public.financial_transactions (discount_id);

DO $v$
BEGIN
  IF has_function_privilege('anon', 'public.next_invoice_number(uuid)', 'EXECUTE') THEN RAISE EXCEPTION 'verify: anon still has next_invoice_number'; END IF;
  IF has_function_privilege('anon', 'public.pay_coach(uuid,uuid,uuid,uuid[],int,text,text,timestamptz,text)', 'EXECUTE') THEN RAISE EXCEPTION 'verify: anon still has pay_coach'; END IF;
  IF NOT has_function_privilege('authenticated', 'public.pay_coach(uuid,uuid,uuid,uuid[],int,text,text,timestamptz,text)', 'EXECUTE') THEN RAISE EXCEPTION 'verify: authenticated lost pay_coach'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE proname='next_invoice_number' AND pg_get_functiondef(oid) ILIKE '%not authorized%') THEN RAISE EXCEPTION 'verify: next_invoice_number auth missing'; END IF;
END $v$;
