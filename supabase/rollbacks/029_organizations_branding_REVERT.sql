-- Rollback for Migration 029
UPDATE public.organizations
SET brand_colors = jsonb_set(brand_colors, '{header}', '"#4a8fd4"'::jsonb)
WHERE id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

ALTER TABLE public.organizations
  DROP COLUMN IF EXISTS display_name,
  DROP COLUMN IF EXISTS tagline,
  DROP COLUMN IF EXISTS primary_domain;
