-- Financials full-management PR-2 — family_balances nets voided pairs.
-- A void posts a reversing entry (reverses_transaction_id → original). The
-- view now excludes BOTH the reversal entry AND the reversed original, so the
-- void removes the original's effect on the balance. Ledger stays append-only.
CREATE OR REPLACE VIEW public.family_balances
WITH (security_invoker = true) AS
SELECT fa.id AS account_id, fa.org_id, fa.guardian_id, fa.season_id,
  COALESCE(sum(CASE WHEN ft.transaction_type = 'fee' THEN ft.amount_cents ELSE 0 END), 0)::integer AS billed_cents,
  COALESCE(sum(CASE WHEN ft.transaction_type = 'payment' THEN ft.amount_cents
                    WHEN ft.transaction_type = 'refund' THEN -ft.amount_cents
                    WHEN ft.transaction_type = 'adjustment' THEN ft.amount_cents ELSE 0 END), 0) AS net_paid_cents,
  COALESCE(sum(CASE WHEN ft.transaction_type = 'payment' THEN ft.processing_fee_cents ELSE 0 END), 0) AS total_fees_cents,
  (COALESCE(sum(CASE WHEN ft.transaction_type = 'fee' THEN ft.amount_cents ELSE 0 END), 0)
   - COALESCE(sum(CASE WHEN ft.transaction_type = 'payment' THEN ft.amount_cents
                       WHEN ft.transaction_type = 'refund' THEN -ft.amount_cents
                       WHEN ft.transaction_type = 'adjustment' THEN ft.amount_cents ELSE 0 END), 0)) AS balance_cents,
  max(ft.occurred_at) FILTER (WHERE ft.transaction_type = 'payment') AS last_payment_at
FROM public.financial_accounts fa
LEFT JOIN public.financial_transactions ft ON ft.account_id = fa.id
  AND ft.reverses_transaction_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.financial_transactions r WHERE r.reverses_transaction_id = ft.id)
GROUP BY fa.id, fa.org_id, fa.guardian_id, fa.season_id;
