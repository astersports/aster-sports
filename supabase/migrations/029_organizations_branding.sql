-- Migration 029: Organizations branding fields
-- Purpose: Extend organizations table to support per-org branding in the
-- Slack/Notion-style multi-tenant model. Enables Ember pre-auth branding
-- (Phoenix + gold) and org post-auth branding (Knight + cobalt for LH).
--
-- Per Ember tenancy architecture doc v3 sections 3 + 5.
-- Idempotent: safe to re-run. Additive only. Zero RLS changes.
-- Already applied to production via MCP on April 25, 2026.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS primary_domain text;

UPDATE public.organizations
SET display_name = COALESCE(display_name, name)
WHERE display_name IS NULL;

ALTER TABLE public.organizations
  ALTER COLUMN display_name SET NOT NULL;

UPDATE public.organizations
SET
  display_name = 'Legacy Hoopers',
  primary_domain = 'legacyhoopers' || '.org'
WHERE id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

UPDATE public.organizations
SET brand_colors = jsonb_set(brand_colors, '{header}', '"#1e3a5f"'::jsonb)
WHERE id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
