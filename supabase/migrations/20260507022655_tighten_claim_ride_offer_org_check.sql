CREATE OR REPLACE FUNCTION public.claim_ride_offer(
  p_offer_id uuid,
  p_for_child_id uuid DEFAULT NULL::uuid,
  p_seats_requested integer DEFAULT 1,
  p_pickup_address text DEFAULT NULL::text,
  p_pickup_notes text DEFAULT NULL::text,
  p_return_needed boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offer record;
  v_active_seats int;
  v_claim_id uuid;
  v_status text;
  v_waitlist_pos int;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_offer FROM public.event_ride_offers
  WHERE id = p_offer_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found or no longer active';
  END IF;

  IF NOT public.user_has_role_in_org(v_offer.org_id, ARRAY['admin', 'coach', 'parent']) THEN
    RAISE EXCEPTION 'Not authorized to claim rides in this organization';
  END IF;

  SELECT COALESCE(SUM(seats_requested), 0) INTO v_active_seats
  FROM public.event_ride_claims
  WHERE offer_id = p_offer_id
    AND status IN ('pending', 'confirmed');

  IF v_active_seats + p_seats_requested <= v_offer.seats_offered THEN
    v_status := 'pending';
    v_waitlist_pos := NULL;
  ELSE
    v_status := 'waitlisted';
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_waitlist_pos
    FROM public.event_ride_claims
    WHERE offer_id = p_offer_id AND status = 'waitlisted';
  END IF;

  INSERT INTO public.event_ride_claims (
    offer_id, event_id, org_id, rider_user_id, for_child_id,
    seats_requested, pickup_address, pickup_notes, return_needed,
    status, waitlist_position
  ) VALUES (
    p_offer_id, v_offer.event_id, v_offer.org_id, v_user_id, p_for_child_id,
    p_seats_requested, p_pickup_address, p_pickup_notes, p_return_needed,
    v_status, v_waitlist_pos
  )
  RETURNING id INTO v_claim_id;

  RETURN v_claim_id;
END;
$function$;
