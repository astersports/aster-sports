-- ============================================================
-- MIGRATION: event_ride_requests — parent-initiated ride needs
-- Date: 2026-05-04
-- Companion to event_ride_offers (Migration 025) + event_ride_claims
--
-- Parents who need rides can signal that need to the team.
-- Requests are visible to all org members on the event detail page.
-- When a driver offers a ride, they can see outstanding requests.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.event_ride_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  requester_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  for_child_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  seats_needed integer NOT NULL DEFAULT 1 CHECK (seats_needed > 0 AND seats_needed <= 6),
  pickup_address text,
  notes text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'cancelled')),
  fulfilled_by_offer_id uuid REFERENCES public.event_ride_offers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ride_requests_event ON public.event_ride_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_requester ON public.event_ride_requests(requester_user_id);

ALTER TABLE public.event_ride_requests ENABLE ROW LEVEL SECURITY;

-- All org members can see ride requests for their org's events
CREATE POLICY "ride_requests_select" ON public.event_ride_requests
  FOR SELECT TO authenticated
  USING (
    org_id = (SELECT current_user_org_id())
  );

-- Authenticated users can create requests for their own events
CREATE POLICY "ride_requests_insert" ON public.event_ride_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requester_user_id = auth.uid()
    AND org_id = (SELECT current_user_org_id())
  );

-- Requesters can update/cancel their own requests; staff can update any
CREATE POLICY "ride_requests_update" ON public.event_ride_requests
  FOR UPDATE TO authenticated
  USING (
    requester_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = event_ride_requests.org_id
        AND ur.role IN ('admin', 'coach')
    )
  )
  WITH CHECK (
    requester_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = event_ride_requests.org_id
        AND ur.role IN ('admin', 'coach')
    )
  );

-- Only requester can delete their own request
CREATE POLICY "ride_requests_delete" ON public.event_ride_requests
  FOR DELETE TO authenticated
  USING (requester_user_id = auth.uid());

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_ride_requests;

COMMIT;
