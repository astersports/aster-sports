-- ============================================================
-- 013_coaching_assignments_rates.sql
--
-- Adds per-event-type pay rate support to coaching_assignments.
-- The existing pay_per_session_cents column stays as a fallback
-- default flat rate. New rates JSONB lets admins set differential
-- rates per coach per team per event type.
--
-- Rate lookup precedence:
--   1. coaching_assignments.rates[event_type_key] if set
--   2. coaching_assignments.pay_per_session_cents if set
--   3. 0 (unpaid / volunteer)
--
-- All values in CENTS (integer) to avoid decimal precision issues.
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- 1. Add rates JSONB column
ALTER TABLE public.coaching_assignments
  ADD COLUMN IF NOT EXISTS rates JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.coaching_assignments.rates IS
  'Per-event-type pay rates in cents. Keys match events.event_type values (practice, game, tournament, skills_lab, tryout, other). Example: {"practice": 3000, "game": 5000, "tournament_day": 10000}. When a key is present, it overrides pay_per_session_cents for that event type.';

-- 2. CHECK constraint: rates must be an object, and (if any values exist)
-- every value must be a non-negative integer.
-- Uses jsonb_path_exists (single expression, no subquery) for CHECK compatibility.
ALTER TABLE public.coaching_assignments
  DROP CONSTRAINT IF EXISTS coaching_assignments_rates_valid_structure;

ALTER TABLE public.coaching_assignments
  ADD CONSTRAINT coaching_assignments_rates_valid_structure
  CHECK (
    jsonb_typeof(rates) = 'object'
    AND NOT jsonb_path_exists(
      rates,
      '$.* ? (@.type() != "number" || @ < 0 || @ != floor(@))'
    )
  );

-- 3. Helper function: get effective rate for assignment + event type
CREATE OR REPLACE FUNCTION public.get_coach_rate_cents(
  p_assignment_id uuid,
  p_event_type text
)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (ca.rates->>p_event_type)::integer,
    ca.pay_per_session_cents,
    0
  )
  FROM public.coaching_assignments ca
  WHERE ca.id = p_assignment_id;
$$;

COMMENT ON FUNCTION public.get_coach_rate_cents IS
  'Returns the effective pay rate in cents for a coaching assignment and event type. Checks rates JSONB first, falls back to pay_per_session_cents, returns 0 if nothing configured.';

-- 4. GIN index on rates for future querying
CREATE INDEX IF NOT EXISTS idx_coaching_assignments_rates_gin
  ON public.coaching_assignments USING gin (rates);

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
