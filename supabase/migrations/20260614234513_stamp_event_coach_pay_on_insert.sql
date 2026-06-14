-- PR-4a: stamp event_coach_assignments.pay_cents from the coach's active rate at INSERT.
-- Go-forward only (BEFORE INSERT, new rows only; existing rows never touched — no backfill).
-- Scope (D1): all_events → any type; games_only → game/tournament (scrimmages ride as game);
-- practices_only → practice. Edge types (skills_lab/tryout/other) paid ONLY under all_events.
-- Tiebreak: highest rate, then created_at, then id. Out-of-scope / NULL-rate / no assignment
-- (D2) → pay_cents=0 + pay_status='excluded'. Robust to future event_type additions.
-- Applied via Supabase MCP 2026-06-14. Mirror of production version 20260614234513.
CREATE OR REPLACE FUNCTION public.stamp_event_coach_pay() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_type text; v_team uuid; v_rate int;
BEGIN
  -- Only stamp the unset default; respect an explicitly supplied amount.
  IF NEW.pay_cents IS NOT NULL THEN RETURN NEW; END IF;
  SELECT e.event_type, e.team_id INTO v_type, v_team FROM events e WHERE e.id = NEW.event_id;
  SELECT ca.pay_per_session_cents INTO v_rate
  FROM coaching_assignments ca
  WHERE ca.user_id = NEW.coach_user_id AND ca.team_id = v_team AND ca.active
    AND ca.pay_per_session_cents IS NOT NULL
    AND ( ca.scope = 'all_events'
       OR (ca.scope = 'games_only' AND v_type IN ('game','tournament'))
       OR (ca.scope = 'practices_only' AND v_type = 'practice') )
  ORDER BY ca.pay_per_session_cents DESC, ca.created_at, ca.id
  LIMIT 1;
  IF v_rate IS NULL THEN
    NEW.pay_cents := 0; NEW.pay_status := 'excluded';
  ELSE
    NEW.pay_cents := v_rate;  -- pay_status stays the 'owed' column default
  END IF;
  RETURN NEW;
END $fn$;
REVOKE EXECUTE ON FUNCTION public.stamp_event_coach_pay() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stamp_event_coach_pay() FROM anon;

CREATE TRIGGER stamp_event_coach_pay_before_insert
  BEFORE INSERT ON public.event_coach_assignments
  FOR EACH ROW EXECUTE FUNCTION public.stamp_event_coach_pay();
