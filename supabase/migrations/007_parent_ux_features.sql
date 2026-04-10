-- ============================================================
-- 007_parent_ux_features.sql
-- Parent UX additions: parking notes on locations, pre-game notes on events
-- Depends on: 006_locations_opponents.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. parking_notes on locations
--    Free-form text shown to parents under the directions button
--    when they expand an event card. e.g. "Park in the back lot,
--    enter through the side door."
-- ------------------------------------------------------------
alter table public.locations
  add column if not exists parking_notes text;

-- ------------------------------------------------------------
-- 2. pregame_notes on events
--    Parent-visible heads-up that only renders within 2 hours of
--    the event start time. Distinct from coach_notes (which is
--    admin/staff only). e.g. "Bring extra water — heat advisory."
-- ------------------------------------------------------------
alter table public.events
  add column if not exists pregame_notes text;
