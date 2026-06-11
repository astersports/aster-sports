-- Fix family_balances for the B0 FUNNEL billing model. Mirror of the MCP apply
-- (AP#21); production version 20260611023342.
--
-- BUG (found during H-1 verification): the view was built for the IMPORTED model
-- (fee = season_fee_cents on the account; payments reduce it). The funnel (B0)
-- posts the fee as a 'fee' financial_transaction and leaves season_fee_cents=0,
-- so the old view mis-bucketed a funnel registration: billed_cents=0,
-- net_paid_cents went NEGATIVE (the 'fee' txn was counted as -amount in
-- net_paid), total_fees_cents=0 — only balance_cents was correct. This garbled
-- "collected"/"billed" for every funnel registration on any surface reading those
-- columns (the Home Registration lane H-1 + the Financials dashboard).
--
-- FIX: 'fee' transactions move OUT of net_paid and INTO billed. net_paid becomes
-- payments(+)/refunds(-)/adjustments(+) only — actual money in. balance_cents is
-- ALGEBRAICALLY INVARIANT (old: (sf-d) - [P-R+A-F]; new: [(sf-d)+F] - [P-R+A] —
-- identical), so no "owes" number moves anywhere. Imported accounts (no 'fee'
-- txns) are unchanged. billed_cents kept ::integer to preserve the column type
-- (CREATE OR REPLACE can't change a column type; cents << int range).
-- security_invoker preserved.
--
-- Verified live: 164 imported accounts unchanged (billed $166,910 / net_paid
-- $165,635 / due $1,275), 0 negative net_paid; rollback-txn funnel replay reads
-- billed $90 / net_paid $40 / balance $50 after a $40 payment (was 0 / -$90 / $90).
CREATE OR REPLACE VIEW public.family_balances WITH (security_invoker = true) AS
SELECT fa.id AS account_id,
  fa.org_id,
  fa.guardian_id,
  fa.season_id,
  ((fa.season_fee_cents - fa.discount_cents)
    + COALESCE(sum(CASE WHEN ft.transaction_type = 'fee' THEN ft.amount_cents ELSE 0 END), 0::bigint))::integer AS billed_cents,
  COALESCE(sum(
    CASE
      WHEN ft.transaction_type = 'payment' THEN ft.amount_cents
      WHEN ft.transaction_type = 'refund' THEN - ft.amount_cents
      WHEN ft.transaction_type = 'adjustment' THEN ft.amount_cents
      ELSE 0
    END), 0::bigint) AS net_paid_cents,
  COALESCE(sum(
    CASE
      WHEN ft.transaction_type = 'payment' THEN ft.processing_fee_cents
      ELSE 0
    END), 0::bigint) AS total_fees_cents,
  (fa.season_fee_cents - fa.discount_cents)
    + COALESCE(sum(CASE WHEN ft.transaction_type = 'fee' THEN ft.amount_cents ELSE 0 END), 0::bigint)
    - COALESCE(sum(
        CASE
          WHEN ft.transaction_type = 'payment' THEN ft.amount_cents
          WHEN ft.transaction_type = 'refund' THEN - ft.amount_cents
          WHEN ft.transaction_type = 'adjustment' THEN ft.amount_cents
          ELSE 0
        END), 0::bigint) AS balance_cents,
  max(ft.occurred_at) FILTER (WHERE ft.transaction_type = 'payment') AS last_payment_at
FROM financial_accounts fa
  LEFT JOIN financial_transactions ft ON ft.account_id = fa.id
GROUP BY fa.id, fa.org_id, fa.guardian_id, fa.season_id, fa.season_fee_cents, fa.discount_cents;
