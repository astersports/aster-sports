-- Fix the stale card_density default. §16.2 collapsed density to 2-state
-- (minimal|maximum); the check constraint user_preferences_card_density_valid now
-- rejects 'medium', but the column default was left at {"default":"medium"}. The
-- user_roles_create_preferences() trigger inserts user_preferences using that
-- default on every new user_role, so EVERY new-user onboarding insert fails the
-- check. Set the default to the code's canonical FALLBACK ('minimal',
-- src/hooks/useDensity.js). Surfaced 2026-06-30 while granting frank@astersports.co
-- the pilot-org admin role (the grant fired the trigger and rolled back).
ALTER TABLE public.user_preferences
  ALTER COLUMN card_density SET DEFAULT '{"default": "minimal"}'::jsonb;
