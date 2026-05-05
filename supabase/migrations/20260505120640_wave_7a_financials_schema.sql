-- 7-A: Financial dashboard — accounts, transactions, coach payouts

CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  guardian_id uuid REFERENCES public.guardians(id) ON DELETE SET NULL,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  season_fee_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  discount_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, guardian_id, season_id)
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  transaction_type text NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'adjustment', 'fee')),
  amount_cents integer NOT NULL,
  payment_method text CHECK (payment_method IN ('zelle', 'venmo', 'cash', 'check', 'stripe', 'other')),
  reference text,
  receipt_url text,
  occurred_at timestamptz NOT NULL,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_to_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coach_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  coach_user_id uuid NOT NULL REFERENCES auth.users(id),
  season_id uuid NOT NULL REFERENCES public.seasons(id),
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed')),
  payment_method text,
  reference text,
  source_assignments uuid[],
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fin_accounts_org ON public.financial_accounts (org_id, season_id);
CREATE INDEX idx_fin_transactions_account ON public.financial_transactions (account_id);
CREATE INDEX idx_coach_payouts_org ON public.coach_payouts (org_id, season_id);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_payouts ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY fin_accounts_admin ON public.financial_accounts FOR ALL TO authenticated
  USING (org_id IN (SELECT ur.organization_id FROM user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'admin'))
  WITH CHECK (org_id IN (SELECT ur.organization_id FROM user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'admin'));

-- Parent reads own account
CREATE POLICY fin_accounts_parent ON public.financial_accounts FOR SELECT TO authenticated
  USING (guardian_id IN (SELECT g.id FROM guardians g WHERE g.user_id = (SELECT auth.uid())));

CREATE POLICY fin_transactions_admin ON public.financial_transactions FOR ALL TO authenticated
  USING (org_id IN (SELECT ur.organization_id FROM user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'admin'))
  WITH CHECK (org_id IN (SELECT ur.organization_id FROM user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'admin'));

CREATE POLICY fin_transactions_parent ON public.financial_transactions FOR SELECT TO authenticated
  USING (account_id IN (SELECT fa.id FROM financial_accounts fa JOIN guardians g ON g.id = fa.guardian_id WHERE g.user_id = (SELECT auth.uid())));

CREATE POLICY coach_payouts_admin ON public.coach_payouts FOR ALL TO authenticated
  USING (org_id IN (SELECT ur.organization_id FROM user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'admin'))
  WITH CHECK (org_id IN (SELECT ur.organization_id FROM user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'admin'));

CREATE POLICY coach_payouts_coach ON public.coach_payouts FOR SELECT TO authenticated
  USING (coach_user_id = (SELECT auth.uid()));
