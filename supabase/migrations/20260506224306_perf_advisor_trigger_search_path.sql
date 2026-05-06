-- ============================================================================
-- Lock search_path on 3 trigger functions (security advisor: function_search_path_mutable)
-- Date: 2026-05-06
-- ============================================================================
-- These are SECURITY INVOKER triggers (so the lint is defensive hygiene, not a vulnerability),
-- but explicit SET search_path closes the lint and prevents accidental drift if the
-- functions are ever changed to SECURITY DEFINER in the future.
-- ============================================================================

ALTER FUNCTION public.tg_event_arrivals_updated_at()    SET search_path = pg_catalog, public;
ALTER FUNCTION public.tg_financial_updated_at()         SET search_path = pg_catalog, public;
ALTER FUNCTION public.tg_player_game_stats_updated_at() SET search_path = pg_catalog, public;
