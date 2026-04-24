-- ============================================================
-- 025_rides_redesign_REVERT.sql
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS public.event_ride_claims CASCADE;
DROP TABLE IF EXISTS public.event_ride_offers CASCADE;

DROP FUNCTION IF EXISTS public.cancel_ride_claim(uuid, text);
DROP FUNCTION IF EXISTS public.claim_ride_offer(uuid, uuid, integer, text, text, boolean);

DROP INDEX IF EXISTS public.idx_events_ride_coord;
ALTER TABLE public.events DROP COLUMN IF EXISTS ride_coordination_enabled;

CREATE TABLE IF NOT EXISTS public.event_rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guardian_id uuid REFERENCES public.guardians(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  ride_type text NOT NULL,
  seats integer NOT NULL,
  pickup_location text,
  pickup_lat double precision,
  pickup_lon double precision,
  departure_time timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_rides_event ON public.event_rides(event_id);

ALTER TABLE public.event_rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_rides_org_all" ON public.event_rides
  FOR ALL USING (event_org_matches(event_id));

NOTIFY pgrst, 'reload schema';

COMMIT;
