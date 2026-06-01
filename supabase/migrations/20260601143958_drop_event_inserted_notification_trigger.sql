-- Per Frank 2026-06-01: only REAL schedule changes (reschedule / relocate / cancel) should
-- notify the team. Adding or bulk-importing an event should NOT spawn a notification. This
-- drops the AFTER INSERT trigger + its function — the source of the 'event_added'
-- queued→cancelled stubs (one per imported event) that cluttered the admin Recent
-- Notifications. The reschedule/relocate/cancelled change-triggers remain untouched.
-- Applied via Supabase MCP 2026-06-01 (version 20260601143958).

DROP TRIGGER IF EXISTS trg_events_inserted_notify ON public.events;
DROP FUNCTION IF EXISTS public.trg_event_inserted();

DO $$
DECLARE v_inserted int; v_remaining int;
BEGIN
  SELECT count(*) INTO v_inserted FROM pg_trigger
   WHERE tgrelid='public.events'::regclass AND tgname='trg_events_inserted_notify' AND NOT tgisinternal;
  IF v_inserted <> 0 THEN RAISE EXCEPTION 'verify failed: inserted-notify trigger still present'; END IF;

  SELECT count(*) INTO v_remaining FROM pg_trigger
   WHERE tgrelid='public.events'::regclass AND NOT tgisinternal
     AND tgname IN ('trg_events_rescheduled_notify','trg_events_relocated_notify','trg_events_cancelled_notify');
  IF v_remaining <> 3 THEN RAISE EXCEPTION 'verify failed: expected 3 change-notify triggers, got %', v_remaining; END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='trg_event_inserted') THEN
    RAISE EXCEPTION 'verify failed: trg_event_inserted() function still present';
  END IF;
  RAISE NOTICE 'event_added notify path removed; 3 real-change triggers intact.';
END $$;
