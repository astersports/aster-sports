-- STEP 2 / F-3: UNIFY the billing model onto the ledger (architect RULING_UNIFY
-- + RULINGS_FINANCIALS_F2F5 D2 = adjustment-credit representation). Imported
-- accounts carried their fee on financial_accounts.season_fee_cents (minus
-- discount_cents); funnel accounts carry it as a 'fee' transaction. This
-- backfills the 164 imported accounts to the funnel shape so billed lives ONLY
-- in transactions, then zeroes (not drops) the raw columns. ONE atomic migration;
-- balance-preserving + fail-loud (the DO block asserts every account's balance is
-- byte-identical pre/post and RAISEs/rolls back on any diff). Frank GO 2026-06-11.
-- The 'fee'>0 CHECK (fin_tx_fee_positive) already exists; not re-added.

-- 0) pre-snapshot under the OLD view (billed = season_fee - discount + SUM('fee')).
CREATE TEMP TABLE _unify_pre ON COMMIT DROP AS
  SELECT account_id, balance_cents FROM public.family_balances;

-- 1) imported fee -> a positive 'fee' transaction (amount = season_fee_cents).
INSERT INTO public.financial_transactions
  (account_id, org_id, transaction_type, amount_cents, occurred_at, notes)
SELECT fa.id, fa.org_id, 'fee', fa.season_fee_cents, fa.created_at,
       'Unify backfill 2026-06-11: imported season fee -> fee txn'
FROM public.financial_accounts fa
WHERE fa.season_fee_cents > 0;

-- 2) imported discount -> a positive 'adjustment' credit (amount = discount_cents).
--    The view buckets adjustment into net_paid (collected); a credit reduces the
--    balance, preserving (season_fee - discount) - payments. Zero such rows today;
--    the branch keeps unify discount-complete (architect D2). 'fee'>0 CHECK intact.
INSERT INTO public.financial_transactions
  (account_id, org_id, transaction_type, amount_cents, occurred_at, notes)
SELECT fa.id, fa.org_id, 'adjustment', fa.discount_cents, fa.created_at,
       'Unify backfill 2026-06-11: imported discount -> adjustment credit'
FROM public.financial_accounts fa
WHERE fa.discount_cents > 0;

-- 3) view computes billed from 'fee' transactions ONLY (no raw columns). Preserves
--    security_invoker + the exact column names/types/order (CREATE OR REPLACE rule).
CREATE OR REPLACE VIEW public.family_balances
  WITH (security_invoker = true) AS
SELECT fa.id AS account_id,
    fa.org_id,
    fa.guardian_id,
    fa.season_id,
    COALESCE(sum(CASE WHEN ft.transaction_type = 'fee' THEN ft.amount_cents ELSE 0 END), 0::bigint)::integer AS billed_cents,
    COALESCE(sum(
        CASE
            WHEN ft.transaction_type = 'payment' THEN ft.amount_cents
            WHEN ft.transaction_type = 'refund' THEN - ft.amount_cents
            WHEN ft.transaction_type = 'adjustment' THEN ft.amount_cents
            ELSE 0
        END), 0::bigint) AS net_paid_cents,
    COALESCE(sum(CASE WHEN ft.transaction_type = 'payment' THEN ft.processing_fee_cents ELSE 0 END), 0::bigint) AS total_fees_cents,
    COALESCE(sum(CASE WHEN ft.transaction_type = 'fee' THEN ft.amount_cents ELSE 0 END), 0::bigint)
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
  GROUP BY fa.id, fa.org_id, fa.guardian_id, fa.season_id;

-- 4) zero (not drop) the raw columns; one release as audit trail + reversibility.
UPDATE public.financial_accounts
SET season_fee_cents = 0, discount_cents = 0, updated_at = now()
WHERE season_fee_cents <> 0 OR discount_cents <> 0;

-- 5) VERIFICATION (Rule 19): every account's balance_cents byte-identical pre vs
--    post; RAISE (roll back the whole migration) on any diff.
DO $$
DECLARE n_total integer; n_mismatch integer;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE pre.balance_cents <> nv.balance_cents)
    INTO n_total, n_mismatch
  FROM _unify_pre pre
  JOIN public.family_balances nv USING (account_id);
  IF n_mismatch <> 0 THEN
    RAISE EXCEPTION 'UNIFY balance check FAILED: % of % accounts changed balance — rolling back', n_mismatch, n_total;
  END IF;
  RAISE NOTICE 'UNIFY balance check OK: % accounts, 0 balance changes', n_total;
END $$;
