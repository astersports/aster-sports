-- Migration B: financials elite layer — billing profile, payment plans, discounts, dunning, AR aging
-- DR-F7 (plans), DR-F8 (discounts), DR-F9 (dunning), DR-F10 (billing profile), reporting
-- Applied via Supabase MCP 2026-06-13. Mirror of production version 20260613204237.
-- NOTE: discounts scoped admin-only. org_members does not exist; discount catalog is an
-- admin artifact (parents see the applied credit via financial_transactions, not the catalog).

-- 4B.1 org billing profile (DR-F10) — admin-entered, never fabricated
ALTER TABLE public.organizations
  ADD COLUMN legal_name text,
  ADD COLUMN ein text;

-- 4B.2 payment plans (DR-F7)
CREATE TABLE public.payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES financial_accounts(id) ON DELETE RESTRICT,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  total_cents int NOT NULL,
  installment_count int NOT NULL CHECK (installment_count BETWEEN 2 AND 12),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.payment_plan_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  seq int NOT NULL,
  due_date date NOT NULL,
  amount_cents int NOT NULL CHECK (amount_cents > 0),
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','paid','overdue','waived')),
  paid_transaction_id uuid REFERENCES financial_transactions(id) ON DELETE SET NULL,
  UNIQUE (plan_id, seq)
);
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plan_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY pp_admin ON public.payment_plans FOR ALL
  USING (user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));
CREATE POLICY pp_parent_read ON public.payment_plans FOR SELECT
  USING (account_id IN (SELECT fa.id FROM financial_accounts fa
    JOIN guardians g ON g.id=fa.guardian_id WHERE g.user_id=auth.uid()));
CREATE POLICY ppi_admin ON public.payment_plan_installments FOR ALL
  USING (user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));
CREATE POLICY ppi_parent_read ON public.payment_plan_installments FOR SELECT
  USING (plan_id IN (SELECT pp.id FROM payment_plans pp
    JOIN financial_accounts fa ON fa.id=pp.account_id
    JOIN guardians g ON g.id=fa.guardian_id WHERE g.user_id=auth.uid()));

-- 4B.3 discounts / scholarships (DR-F8) — admin-only scope
CREATE TABLE public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  label text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('sibling','scholarship','early_bird','code')),
  code text,
  amount_cents int,
  percent numeric(5,2),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (amount_cents IS NOT NULL OR percent IS NOT NULL)
);
ALTER TABLE public.financial_transactions ADD COLUMN discount_id uuid REFERENCES discounts(id);
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY discounts_admin ON public.discounts FOR ALL
  USING (user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));

-- 4B.4 dunning log (DR-F9) — mirror of event_reminder_log, idempotent per stage
CREATE TABLE public.invoice_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('due_soon','due','overdue_1','overdue_2')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL DEFAULT 'email',
  UNIQUE (invoice_id, stage)
);
ALTER TABLE public.invoice_reminder_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY irl_admin ON public.invoice_reminder_log FOR ALL
  USING (user_has_role_in_org(org_id, ARRAY['admin']))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin']));

-- 4B.5 AR aging view — security_invoker respects caller RLS
CREATE OR REPLACE VIEW public.ar_aging AS
SELECT fb.org_id, fb.season_id, fb.account_id, fb.guardian_id, fb.balance_cents,
  CASE
    WHEN fb.balance_cents <= 0 THEN 'current'
    WHEN now() - COALESCE(fb.last_payment_at, now()) < interval '31 days' THEN 'd0_30'
    WHEN now() - COALESCE(fb.last_payment_at, now()) < interval '61 days' THEN 'd31_60'
    ELSE 'd60_plus'
  END AS bucket
FROM family_balances fb;
ALTER VIEW public.ar_aging SET (security_invoker = true);

DO $v$
BEGIN
  IF to_regclass('public.payment_plans') IS NULL THEN RAISE EXCEPTION 'verify: payment_plans missing'; END IF;
  IF to_regclass('public.payment_plan_installments') IS NULL THEN RAISE EXCEPTION 'verify: installments missing'; END IF;
  IF to_regclass('public.discounts') IS NULL THEN RAISE EXCEPTION 'verify: discounts missing'; END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='financial_transactions' AND column_name='discount_id') THEN RAISE EXCEPTION 'verify: discount_id missing'; END IF;
  IF to_regclass('public.invoice_reminder_log') IS NULL THEN RAISE EXCEPTION 'verify: reminder log missing'; END IF;
  IF to_regclass('public.ar_aging') IS NULL THEN RAISE EXCEPTION 'verify: ar_aging missing'; END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='ein') THEN RAISE EXCEPTION 'verify: ein missing'; END IF;
END $v$;
