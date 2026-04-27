-- ============================================================
-- Ship 7.2 — Schema drift fix
-- Date: April 27, 2026
-- Audit basis: audit/AUDIT_SYNTHESIS_2026_04_27.md sections H2, B1
--
-- Closes:
--   B1 (P0) — events.ride_coordination_enabled (default true) was read by
--             EventRidesTab + get_event_ride_state RPC, while events.enable_rides
--             (default false) was written by wizard/create/update. Two columns,
--             never connected. The "Enable rides" admin toggle was dead UI.
--
-- Strategy:
--   1. CREATE OR REPLACE get_event_ride_state to read enable_rides instead.
--   2. DROP unused partial index idx_events_ride_coord.
--   3. DROP column ride_coordination_enabled.
--
-- No backfill needed. Audit verified all 140 production events already have
-- correct enable_rides values (17 games true, 1 practice true with real data,
-- 88 practices false, 34 tournaments true). The wizard has been writing
-- enable_rides correctly all along — only the readers were wrong.
--
-- Code change pairs with this: src/components/event/EventRidesTab.jsx line 23
-- changes from `event?.ride_coordination_enabled !== false` to
-- `event?.enable_rides === true`. Shipped to v2 separately by CC (commit 0655083).
-- ============================================================

BEGIN;

-- SECTION 1: Replace get_event_ride_state RPC to read enable_rides

CREATE OR REPLACE FUNCTION public.get_event_ride_state(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_event RECORD;
  v_tournament RECORD;
  v_now timestamptz := now();
  v_24h_before timestamptz;
BEGIN
  SELECT
    e.id, e.event_type, e.start_at, e.end_at,
    e.tournament_id, e.enable_rides, e.status
  INTO v_event
  FROM events e
  WHERE e.id = p_event_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'is_open', false,
      'gate_reason', 'Event not found',
      'lock_timestamp', null,
      'event_start_at', null
    );
  END IF;

  -- Rides not enabled for this event (toggle off in admin Edit Event)
  IF v_event.enable_rides = false THEN
    RETURN jsonb_build_object(
      'is_open', false,
      'gate_reason', 'Ride coordination is off for this event',
      'lock_timestamp', null,
      'event_start_at', v_event.start_at
    );
  END IF;

  IF v_event.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'is_open', false,
      'gate_reason', 'Event cancelled',
      'lock_timestamp', null,
      'event_start_at', v_event.start_at
    );
  END IF;

  IF v_event.end_at IS NOT NULL AND v_now > v_event.end_at THEN
    RETURN jsonb_build_object(
      'is_open', false,
      'gate_reason', 'Event has ended',
      'lock_timestamp', null,
      'event_start_at', v_event.start_at
    );
  END IF;

  v_24h_before := v_event.start_at - interval '24 hours';

  IF v_event.event_type != 'tournament' THEN
    RETURN jsonb_build_object(
      'is_open', true,
      'gate_reason', null,
      'lock_timestamp', null,
      'event_start_at', v_event.start_at
    );
  END IF;

  IF v_event.tournament_id IS NULL THEN
    RETURN jsonb_build_object(
      'is_open', true,
      'gate_reason', null,
      'lock_timestamp', null,
      'event_start_at', v_event.start_at
    );
  END IF;

  SELECT t.roster_locked_at, t.rsvp_deadline_at
  INTO v_tournament
  FROM tournaments t
  WHERE t.id = v_event.tournament_id;

  IF v_tournament.roster_locked_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'is_open', true,
      'gate_reason', null,
      'lock_timestamp', v_tournament.roster_locked_at,
      'event_start_at', v_event.start_at
    );
  END IF;

  IF v_now >= v_24h_before THEN
    RETURN jsonb_build_object(
      'is_open', true,
      'gate_reason', null,
      'lock_timestamp', v_24h_before,
      'event_start_at', v_event.start_at
    );
  END IF;

  RETURN jsonb_build_object(
    'is_open', false,
    'gate_reason', 'Rides open after roster locks (or 24h before event)',
    'lock_timestamp', COALESCE(v_tournament.rsvp_deadline_at, v_24h_before),
    'event_start_at', v_event.start_at
  );
END;
$function$;

-- Re-apply Ship 7.1 hardening since CREATE OR REPLACE may reset grants
REVOKE EXECUTE ON FUNCTION public.get_event_ride_state(uuid) FROM PUBLIC, anon;

-- SECTION 2: Drop the dead partial index on the dying column
DROP INDEX IF EXISTS public.idx_events_ride_coord;

-- SECTION 3: Drop the column itself
ALTER TABLE public.events DROP COLUMN IF EXISTS ride_coordination_enabled;

COMMIT;
