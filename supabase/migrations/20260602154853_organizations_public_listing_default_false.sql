-- Closes Wave 3.B #28 P0-4: `public_listing_enabled DEFAULT true` is the wrong
-- default for pilot orgs (St. Patrick's onboarding posture).
--
-- Original column shipped in 20260528140000_wave_1_public_listing_gating.sql
-- with DEFAULT true because the only tenant at the time (Legacy Hoopers) was
-- intentionally public. Future pilot tenants should opt INTO public listing
-- after content review, not opt out of it.
--
-- Existing rows are NOT touched (this only affects subsequent INSERTs that
-- omit the column). Legacy Hoopers' explicitly-set true value stays true.
ALTER TABLE public.organizations
  ALTER COLUMN public_listing_enabled SET DEFAULT false;
