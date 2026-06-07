-- Migration: 20260607231454_add_organizations_mailing_address
-- Applied via Supabase MCP apply_migration on 2026-06-07 (design lane). This file
-- is a verbatim mirror of the registered migration; do not edit.
-- G1 (B2 address+footer): adds organizations.mailing_address to hold the CAN-SPAM
-- physical postal address rendered in email footers. Additive, nullable.
-- NOTE: the per-org address VALUE (Legacy Hoopers: "4 Byram Brook Place, Armonk,
-- NY 10504") is production DATA set via a separate UPDATE, NOT part of this schema
-- migration. A second org sets its own address at onboarding.

ALTER TABLE organizations ADD COLUMN mailing_address text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'mailing_address'
  ) THEN
    RAISE EXCEPTION 'post-condition failed: organizations.mailing_address not created';
  END IF;
END $$;
