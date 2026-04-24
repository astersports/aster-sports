-- ============================================================
-- 027_event_notification_triggers_REVERT.sql
-- ============================================================

BEGIN;

DROP TRIGGER IF EXISTS trg_events_inserted_notify ON public.events;
DROP TRIGGER IF EXISTS trg_events_cancelled_notify ON public.events;
DROP TRIGGER IF EXISTS trg_events_rescheduled_notify ON public.events;
DROP TRIGGER IF EXISTS trg_events_relocated_notify ON public.events;
DROP TRIGGER IF EXISTS trg_event_comments_posted_notify ON public.event_comments;

DROP FUNCTION IF EXISTS public.trg_event_comment_posted();
DROP FUNCTION IF EXISTS public.trg_event_relocated();
DROP FUNCTION IF EXISTS public.trg_event_rescheduled();
DROP FUNCTION IF EXISTS public.trg_event_cancelled();
DROP FUNCTION IF EXISTS public.trg_event_inserted();
DROP FUNCTION IF EXISTS public.notify_team_of_event_change(uuid, uuid, uuid, text, jsonb, boolean);

ALTER TABLE public.event_notifications 
  ALTER COLUMN status SET DEFAULT 'pending';

NOTIFY pgrst, 'reload schema';

COMMIT;
