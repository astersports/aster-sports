-- ============================================================
-- ORG SETTINGS — reply_to_email column
--
-- Wave 3.6 §D6: edge function v8 hardcodes reply_to='info@legacyhoopers.org'.
-- Multi-tenant cleanup: store the org's reply-to email in
-- organization_settings so St. Patrick's CYO Armonk and other future
-- orgs configure their own reply destination without code change.
--
-- Edge function v9 reads this column with backward-compat fallback to
-- 'info@legacyhoopers.org' when the row or column is null.
-- ============================================================

ALTER TABLE public.organization_settings
  ADD COLUMN reply_to_email text;

UPDATE public.organization_settings
  SET reply_to_email = 'info@legacyhoopers.org'
  WHERE organization_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='organization_settings'
      AND column_name='reply_to_email'
  ) THEN
    RAISE EXCEPTION 'reply_to_email column missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_settings
    WHERE organization_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
      AND reply_to_email = 'info@legacyhoopers.org'
  ) THEN
    RAISE EXCEPTION 'Legacy Hoopers reply_to_email not set';
  END IF;
END $$;
