-- AP#21 repo-mirror parity. APPLIED via Supabase MCP in the same turn; this file is the
-- repo mirror — DO NOT re-apply (COMMENT ON is idempotent regardless).
--
-- Settings honesty cleanup (operator decision 2026-06-10): retired the UI controls that
-- no surface/send-path reads (Quiet Hours card + the admin Registration/Features/Custom-
-- domain rows). Tag the now-orphaned columns per CLAUDE.md §16.16 so grep + DB discovery
-- surface the warning. NOT dropped (inert; recoverable). See docs/DEPRECATIONS_REGISTRY.md.

COMMENT ON COLUMN public.user_preferences.quiet_hours IS
  'DEPRECATED 2026-06-10: per-user quiet hours. UI (QuietHoursCard) retired — the reminder send path uses a FIXED ET window (isQuietHoursET), never this column. No reader/writer remains. Not dropped (inert). Un-park = wire per-user quiet hours into the send path. See docs/DEPRECATIONS_REGISTRY.md.';

COMMENT ON COLUMN public.organization_settings.registration_open IS
  'DEPRECATED 2026-06-10: vestigial org-wide registration toggle. UI row retired. Registration is PER-PROGRAM (programs.reg_opens_at/reg_closes_at + status=active + is_published; get_public_program enforces it). This column drives nothing. Not dropped. Un-park = a deliberate org-wide registration freeze feature (would AND into get_public_program). See docs/DEPRECATIONS_REGISTRY.md.';

COMMENT ON COLUMN public.organization_settings.futures_academy_enabled IS
  'DEPRECATED 2026-06-10: cosmetic. UI row retired. Zero consumers — Futures Academy is roster_type-driven, not gated by this flag. Not dropped. See docs/DEPRECATIONS_REGISTRY.md.';

COMMENT ON COLUMN public.organization_settings.carpool_enabled IS
  'DEPRECATED 2026-06-10: cosmetic. UI row retired. Zero consumers — the ride board renders regardless. Not dropped. See docs/DEPRECATIONS_REGISTRY.md.';

COMMENT ON COLUMN public.organization_settings.custom_domain IS
  'DEPRECATED 2026-06-10: cosmetic. UI row retired. Zero consumers — email links use the app_config base url. Not dropped. Un-park = a real custom-email-domain feature (multi-tenant). See docs/DEPRECATIONS_REGISTRY.md.';
