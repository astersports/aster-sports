-- ============================================================
-- 032_rides_lifecycle_and_realtime.sql
--
-- Status: APPLIED VIA MCP April 26 2026
-- Phase 1 home rebuild — rides backend.
-- Adds lifecycle gate, atomic waitlist promotion, Realtime publication,
-- and notification triggers for ride status changes.
--
-- Per Frank L99 spec:
--   - Dual-trigger ride unlock: roster_locked_at IS NOT NULL OR now() >= start_at - 24h
--   - Hook splits into useRideState (reads) + useRideActions (writes)
--   - Notifications enqueue to event_notifications (dispatcher Phase 6+)
-- ============================================================

BEGIN;

-- SECTION 1: get_event_ride_state(event_id) - lifecycle gate
CREATE OR REPLACE FUNCTION public.get_event_ride_state(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_tournament RECORD;
  v_now timestamptz := now();
  v_24h_before timestamptz;
BEGIN
  SELECT
    e.id, e.event_type, e.start_at, e.end_at,
    e.tournament_id, e.ride_coordination_enabled, e.status
  INTO v_event
  FROM events e
  WHERE e.id = p_event_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('is_open', false, 'gate_reason', 'Event not found', 'lock_timestamp', null, 'event_start_at', null);
  END IF;

  IF v_event.ride_coordination_enabled = false THEN
    RETURN jsonb_build_object('is_open', false, 'gate_reason', 'Ride coordination disabled for this event', 'lock_timestamp', null, 'event_start_at', v_event.start_at);
  END IF;

  IF v_event.status = 'cancelled' THEN
    RETURN jsonb_build_object('is_open', false, 'gate_reason', 'Event cancelled', 'lock_timestamp', null, 'event_start_at', v_event.start_at);
  END IF;

  IF v_event.end_at IS NOT NULL AND v_now > v_event.end_at THEN
    RETURN jsonb_build_object('is_open', false, 'gate_reason', 'Event has ended', 'lock_timestamp', null, 'event_start_at', v_event.start_at);
  END IF;

  v_24h_before := v_event.start_at - interval '24 hours';

  IF v_event.event_type != 'tournament' THEN
    RETURN jsonb_build_object('is_open', true, 'gate_reason', null, 'lock_timestamp', null, 'event_start_at', v_event.start_at);
  END IF;

  IF v_event.tournament_id IS NULL THEN
    RETURN jsonb_build_object('is_open', true, 'gate_reason', null, 'lock_timestamp', null, 'event_start_at', v_event.start_at);
  END IF;

  SELECT t.roster_locked_at, t.rsvp_deadline_at INTO v_tournament FROM tournaments t WHERE t.id = v_event.tournament_id;

  IF v_tournament.roster_locked_at IS NOT NULL THEN
    RETURN jsonb_build_object('is_open', true, 'gate_reason', null, 'lock_timestamp', v_tournament.roster_locked_at, 'event_start_at', v_event.start_at);
  END IF;

  IF v_now >= v_24h_before THEN
    RETURN jsonb_build_object('is_open', true, 'gate_reason', null, 'lock_timestamp', v_24h_before, 'event_start_at', v_event.start_at);
  END IF;

  RETURN jsonb_build_object('is_open', false, 'gate_reason', 'Rides open after roster locks (or 24h before event)', 'lock_timestamp', COALESCE(v_tournament.rsvp_deadline_at, v_24h_before), 'event_start_at', v_event.start_at);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_ride_state(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_event_ride_state IS
  'Returns ride lifecycle state for an event. Per Migration 032 dual-trigger spec: tournament rides unlock when admin sets roster_locked_at OR auto-fallback at start_at - 24h, whichever comes first.';

-- SECTION 2: promote_next_waitlist_claim
CREATE OR REPLACE FUNCTION public.promote_next_waitlist_claim(p_offer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer RECORD;
  v_seats_available integer;
  v_next_claim RECORD;
BEGIN
  SELECT id, seats_offered INTO v_offer FROM event_ride_offers WHERE id = p_offer_id AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT v_offer.seats_offered - COALESCE(SUM(seats_requested), 0) INTO v_seats_available
  FROM event_ride_claims WHERE offer_id = p_offer_id AND status = 'confirmed';

  IF v_seats_available <= 0 THEN RETURN NULL; END IF;

  SELECT id, seats_requested, waitlist_position INTO v_next_claim
  FROM event_ride_claims
  WHERE offer_id = p_offer_id AND status = 'waitlisted' AND seats_requested <= v_seats_available
  ORDER BY waitlist_position ASC NULLS LAST, created_at ASC
  LIMIT 1 FOR UPDATE;

  IF NOT FOUND THEN RETURN NULL; END IF;

  UPDATE event_ride_claims
  SET status = 'confirmed', confirmed_at = now(), waitlist_position = NULL, updated_at = now()
  WHERE id = v_next_claim.id;

  UPDATE event_ride_claims
  SET waitlist_position = waitlist_position - 1
  WHERE offer_id = p_offer_id AND status = 'waitlisted' AND waitlist_position > v_next_claim.waitlist_position;

  RETURN v_next_claim.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.promote_next_waitlist_claim(uuid) TO authenticated;

COMMENT ON FUNCTION public.promote_next_waitlist_claim IS
  'Atomically promotes the next eligible waitlisted claim when capacity opens.';

-- SECTION 3: trigger
CREATE OR REPLACE FUNCTION public.trg_ride_claim_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status IN ('cancelled', 'declined') THEN
    PERFORM public.promote_next_waitlist_claim(NEW.offer_id);
  END IF;

  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO event_notifications (
      org_id, event_id, notification_type, recipient_type, recipient_id,
      payload, status, channels, triggered_by_user_id
    ) VALUES (
      NEW.org_id, NEW.event_id, 'ride_request', 'user', NEW.rider_user_id,
      jsonb_build_object('claim_id', NEW.id, 'offer_id', NEW.offer_id, 'old_status', COALESCE(OLD.status, 'new'), 'new_status', NEW.status, 'waitlist_position', NEW.waitlist_position),
      'queued', '["push", "email"]'::jsonb, auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ride_claims_status ON public.event_ride_claims;
CREATE TRIGGER trg_ride_claims_status AFTER INSERT OR UPDATE ON public.event_ride_claims FOR EACH ROW EXECUTE FUNCTION public.trg_ride_claim_status_change();

-- SECTION 4: Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='event_ride_offers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_ride_offers;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='event_ride_claims') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_ride_claims;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
