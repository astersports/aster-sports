-- ============================================================
-- ADD from_name + from_email TO organization_settings
--
-- Pattern matches wave 3.6 reply_to_email column. All three
-- email-header values (FROM display, FROM address, Reply-To)
-- now configurable per-org.
--
-- Edge function reads these dynamically; future tenants
-- (St. Patrick's CYO Armonk in 2027-28) get their own values
-- via UPDATE, no code change.
-- ============================================================

ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS from_name text,
  ADD COLUMN IF NOT EXISTS from_email text;

-- Seed values for Legacy Hoopers
UPDATE public.organization_settings
SET
  from_name = 'Legacy Hoopers Weekly Digest',
  from_email = 'admin@legacyhoopers.org'
WHERE organization_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

-- Verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='organization_settings'
      AND column_name='from_name'
  ) THEN RAISE EXCEPTION 'from_name column missing'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='organization_settings'
      AND column_name='from_email'
  ) THEN RAISE EXCEPTION 'from_email column missing'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.organization_settings
    WHERE organization_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
      AND from_name = 'Legacy Hoopers Weekly Digest'
      AND from_email = 'admin@legacyhoopers.org'
  ) THEN RAISE EXCEPTION 'seed values not populated'; END IF;
END $$;
