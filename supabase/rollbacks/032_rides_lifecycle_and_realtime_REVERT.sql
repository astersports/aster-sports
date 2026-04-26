-- ============================================================
-- 032_rides_lifecycle_and_realtime_REVERT.sql
-- Reverts Migration 032. Run only for emergency rollback.
-- ============================================================

BEGIN;

DROP TRIGGER IF EXISTS trg_ride_claims_status ON public.event_ride_claims;
DROP FUNCTION IF EXISTS public.trg_ride_claim_status_change();
DROP FUNCTION IF EXISTS public.promote_next_waitlist_claim(uuid);
DROP FUNCTION IF EXISTS public.get_event_ride_state(uuid);

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.event_ride_offers;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.event_ride_claims;

NOTIFY pgrst, 'reload schema';

COMMIT;
