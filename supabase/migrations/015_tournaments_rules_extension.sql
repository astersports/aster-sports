-- ============================================================
-- 015_tournaments_rules_extension.sql
--
-- Adds per-tournament rule overrides as JSONB on tournaments.
-- Distinct from org-level circuit_rules (which stay as defaults).
--
-- Schema (hybrid structured + freeform, documented in
-- src/lib/tournamentRules.ts when UI lands):
--   - summary: parent-facing one-liner (auto-composed when null)
--   - source_url: link to official circuit rules PDF/page
--   - game_format, overtime, timeouts, fouls, defense, mercy: typed structured fields
--   - division_overrides: per-grade variation (e.g., 5th_grade: {game_format: {minutes_per_period: 14}})
--   - misc_notes: freeform for ejections, cancellations, challenges, etc.
--
-- Value-level validation (enum correctness, number ranges) enforced
-- at app layer via TypeScript + Zod. DB constraint only enforces
-- JSONB object shape, matching the pattern from Migration 013.
--
-- RLS enforcement: inherits existing tournaments_read (org-scoped
-- read for all users) and tournaments_write (admin/coach only).
-- No policy changes needed.
--
-- Reference sources reviewed April 23, 2026:
--   - CYO Westchester/Putnam Spring League Rules 2025 (PDF)
--   - Zero Gravity Basketball rules (zerogravitybasketball.com/site/?ID=7656)
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Add rules JSONB column
-- ------------------------------------------------------------
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS rules JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.tournaments.rules IS
  'Per-tournament rule overrides. Hybrid schema: typed fields (game_format, overtime, timeouts, fouls, defense, mercy, roster) + division_overrides per-grade + misc_notes freeform. TypeScript type at src/lib/tournamentRules.ts. Example keys: summary, source_url, game_format.clock_type (stop/running_then_stop/running_with_mercy), fouls.fouling_out_at, mercy.running_clock_at_lead, division_overrides.5th_grade, misc_notes. Distinct from org-level circuit_rules.';

-- ------------------------------------------------------------
-- 2. CHECK constraint: object shape only (app layer validates values)
-- ------------------------------------------------------------
ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_rules_is_object;

ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_rules_is_object
  CHECK (jsonb_typeof(rules) = 'object');

-- ------------------------------------------------------------
-- 3. GIN index for future JSONB queries
-- (e.g., find tournaments by source_url or clock_type)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tournaments_rules_gin
  ON public.tournaments USING gin (rules);

-- ------------------------------------------------------------
-- 4. Reload PostgREST schema cache
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;
