-- Phase D.2 Ship 1: cascade cancel offer to claims
-- When a ride offer flips status='cancelled', mark all linked active claims
-- as cancelled too, preventing ghost claims pointing at dead offers.
-- Also patches the existing claim-status-change trigger to skip waitlist
-- promotion when the parent offer is no longer active (avoids reviving
-- a waitlisted claim onto a cancelled offer).

-- 1) New cascade trigger function on offers
CREATE OR REPLACE FUNCTION public.trg_ride_offer_cancelled_cascade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status <> 'cancelled' AND NEW.status = 'cancelled' THEN
    UPDATE public.event_ride_claims
    SET status = 'cancelled',
        cancelled_at = now(),
        cancelled_by = 'system',
        updated_at = now()
    WHERE offer_id = NEW.id
      AND status IN ('pending', 'confirmed', 'waitlisted');
  END IF;
  RETURN NEW;
END;
$function$;

-- 2) Drop + recreate the trigger (idempotent)
DROP TRIGGER IF EXISTS trg_ride_offer_cancelled ON public.event_ride_offers;

CREATE TRIGGER trg_ride_offer_cancelled
AFTER UPDATE ON public.event_ride_offers
FOR EACH ROW
EXECUTE FUNCTION public.trg_ride_offer_cancelled_cascade();

-- 3) Patch the existing claim-status-change trigger to gate waitlist
--    promotion on offer.status = 'active'. Avoids reviving waitlist
--    claims onto a cancelled offer.
CREATE OR REPLACE FUNCTION public.trg_ride_claim_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offer_active boolean;
BEGIN
  -- Only react to status changes on existing rows
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Promote waitlist only if confirmed→cancelled/declined AND offer still active
  IF TG_OP = 'UPDATE'
     AND OLD.status = 'confirmed'
     AND NEW.status IN ('cancelled', 'declined') THEN
    SELECT (status = 'active') INTO v_offer_active
    FROM public.event_ride_offers
    WHERE id = NEW.offer_id;
    IF COALESCE(v_offer_active, false) THEN
      PERFORM public.promote_next_waitlist_claim(NEW.offer_id);
    END IF;
  END IF;

  -- Enqueue notification for status change (dispatcher Phase 6+)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status <> NEW.status) THEN
    INSERT INTO event_notifications (
      org_id, event_id, notification_type, recipient_type, recipient_id,
      payload, status, channels, triggered_by_user_id
    ) VALUES (
      NEW.org_id,
      NEW.event_id,
      'ride_request',
      'user',
      NEW.rider_user_id,
      jsonb_build_object(
        'claim_id', NEW.id,
        'offer_id', NEW.offer_id,
        'old_status', COALESCE(OLD.status, 'new'),
        'new_status', NEW.status,
        'waitlist_position', NEW.waitlist_position
      ),
      'queued',
      '["push", "email"]'::jsonb,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$function$;
