-- Coach-level default payout method. Pre-fills the Record-payout form and
-- shows on the coach card; the per-payout method still lives on
-- coach_payouts.payment_method. Values mirror the coach_payouts CHECK.
ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS default_payout_method text
  CHECK (default_payout_method IS NULL OR default_payout_method = ANY (ARRAY['zelle','venmo','cash','check','stripe','other']));

COMMENT ON COLUMN public.staff_profiles.default_payout_method IS
  'Coach-level default payout method (zelle/venmo/cash/check/stripe/other). Pre-fills the Record-payout form; per-payout method still stored on coach_payouts.payment_method.';
