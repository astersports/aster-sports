-- AP#21 repo-mirror parity. APPLIED via Supabase MCP in the same turn; this file is
-- the repo mirror — DO NOT re-apply (COMMENT ON is idempotent regardless).
--
-- The per-user per-category push prefs UI (account/NotificationPrefs.jsx) was retired:
-- the admin Channels matrix (organization_settings.notification_channels) is the single
-- source for notification categories (operator decision 2026-06-10). This column now has
-- no reader or writer. Tagged per CLAUDE.md §16.16 so grep + DB discovery surface the
-- warning. NOT dropped (data + GIN index kept inert) pending a future per-user override
-- if that is ever wired. See docs/DEPRECATIONS_REGISTRY.md.

COMMENT ON COLUMN public.user_preferences.notification_preferences IS
  'DEPRECATED 2026-06-10: per-user per-category push prefs. UI retired (NotificationPrefs.jsx); the admin Channels matrix (organization_settings.notification_channels) is the single source for notification categories. No reader/writer remains. Not dropped (inert). See docs/DEPRECATIONS_REGISTRY.md.';
