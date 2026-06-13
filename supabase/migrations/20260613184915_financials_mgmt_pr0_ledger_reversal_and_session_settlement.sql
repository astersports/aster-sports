-- Financials full-management PR-0 — schema foundation (design v2).
--
-- Schema-1: traceable ledger corrections. A "void" is a reversing entry that
-- references the original; the original is never edited/deleted (audit
-- integrity). family_balances nets the pair.
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS reverses_transaction_id uuid REFERENCES public.financial_transactions(id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reverses
  ON public.financial_transactions(reverses_transaction_id) WHERE reverses_transaction_id IS NOT NULL;
COMMENT ON COLUMN public.financial_transactions.reverses_transaction_id IS
  'When set, this row reverses (voids) the referenced transaction. Ledger stays append-only; corrections are traceable. family_balances nets the pair.';

-- Schema-2: per-session coach settlement. Each event_coach_assignment becomes a
-- payable line item with its own (editable) amount, paid/owed state, and the
-- payout that settled it.
ALTER TABLE public.event_coach_assignments
  ADD COLUMN IF NOT EXISTS pay_cents integer,
  ADD COLUMN IF NOT EXISTS pay_status text NOT NULL DEFAULT 'owed'
    CHECK (pay_status IN ('owed','paid','excluded')),
  ADD COLUMN IF NOT EXISTS settled_by_payout_id uuid
    REFERENCES public.coach_payouts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_eca_settled_payout
  ON public.event_coach_assignments(settled_by_payout_id) WHERE settled_by_payout_id IS NOT NULL;
COMMENT ON COLUMN public.event_coach_assignments.pay_cents IS
  'Amount owed for THIS session. Seeded from the coaching_assignment rate × scope; editable per session.';

-- Backfill pay_cents from the coach's per-team rate, honoring scope
-- (games_only counts only game/tournament events). LATERAL picks one active
-- assignment per (coach, team) deterministically.
UPDATE public.event_coach_assignments eca
SET pay_cents = sub.cents
FROM (
  SELECT e2.id AS eca_id,
    CASE WHEN ca.scope = 'games_only' AND ev.event_type NOT IN ('game','tournament') THEN 0
         ELSE COALESCE(ca.pay_per_session_cents, 0) END AS cents
  FROM public.event_coach_assignments e2
  JOIN public.events ev ON ev.id = e2.event_id
  LEFT JOIN LATERAL (
    SELECT pay_per_session_cents, scope FROM public.coaching_assignments
    WHERE user_id = e2.coach_user_id AND team_id = ev.team_id AND active = true
    ORDER BY pay_per_session_cents DESC NULLS LAST LIMIT 1
  ) ca ON true
  WHERE e2.pay_cents IS NULL
) sub
WHERE eca.id = sub.eca_id;

UPDATE public.event_coach_assignments SET pay_cents = 0 WHERE pay_cents IS NULL;
