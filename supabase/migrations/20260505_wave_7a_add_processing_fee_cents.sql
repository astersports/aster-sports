-- Wave 7-A: add processing_fee_cents to financial_transactions
-- Tracks payment processor fees (LeagueApps ~5.4%) so dashboard shows net-to-bank

ALTER TABLE public.financial_transactions
  ADD COLUMN processing_fee_cents integer NOT NULL DEFAULT 0
    CHECK (processing_fee_cents >= 0);

COMMENT ON COLUMN public.financial_transactions.processing_fee_cents IS
  'Payment processor fee deducted from amount_cents. Net cash to org = amount_cents - processing_fee_cents. Stored as positive integer; 0 for non-payment transactions.';

CREATE INDEX idx_fin_tx_org_with_fees ON public.financial_transactions (org_id, occurred_at DESC)
  WHERE processing_fee_cents > 0;

-- family_balances view: expose net-of-fees in addition to gross
DROP VIEW IF EXISTS public.family_balances;
CREATE VIEW public.family_balances WITH (security_invoker = true) AS
SELECT
  fa.id AS account_id,
  fa.org_id,
  fa.guardian_id,
  fa.season_id,
  (fa.season_fee_cents - fa.discount_cents) AS billed_cents,
  COALESCE(SUM(
    CASE
      WHEN ft.transaction_type = 'payment' THEN ft.amount_cents
      WHEN ft.transaction_type = 'refund'  THEN -ft.amount_cents
      WHEN ft.transaction_type = 'adjustment' THEN ft.amount_cents
      WHEN ft.transaction_type = 'fee' THEN -ft.amount_cents
      ELSE 0
    END
  ), 0) AS net_paid_cents,
  COALESCE(SUM(
    CASE WHEN ft.transaction_type = 'payment' THEN ft.processing_fee_cents ELSE 0 END
  ), 0) AS total_fees_cents,
  (fa.season_fee_cents - fa.discount_cents) - COALESCE(SUM(
    CASE
      WHEN ft.transaction_type = 'payment' THEN ft.amount_cents
      WHEN ft.transaction_type = 'refund'  THEN -ft.amount_cents
      WHEN ft.transaction_type = 'adjustment' THEN ft.amount_cents
      WHEN ft.transaction_type = 'fee' THEN -ft.amount_cents
      ELSE 0
    END
  ), 0) AS balance_cents,
  MAX(ft.occurred_at) FILTER (WHERE ft.transaction_type = 'payment') AS last_payment_at
FROM public.financial_accounts fa
LEFT JOIN public.financial_transactions ft ON ft.account_id = fa.id
GROUP BY fa.id, fa.org_id, fa.guardian_id, fa.season_id, fa.season_fee_cents, fa.discount_cents;

-- Verify
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='financial_transactions' AND column_name='processing_fee_cents')
  THEN RAISE EXCEPTION 'processing_fee_cents column missing'; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='family_balances' AND column_name='total_fees_cents')
  THEN RAISE EXCEPTION 'family_balances view missing total_fees_cents'; END IF;
END $$;
