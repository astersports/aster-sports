-- Phase 4 pre-work: clean up dangling RLS policies
-- org_announcements and message_drafts tables were never created;
-- their RLS policies were pre-defined in migration 20260427 audit.
-- Drop these since Phase 4 uses the new `messages` table instead.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'org_announcements') THEN
    DROP POLICY IF EXISTS org_announcements_read ON public.org_announcements;
    DROP POLICY IF EXISTS org_announcements_write ON public.org_announcements;
    DROP TABLE public.org_announcements;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_drafts') THEN
    DROP POLICY IF EXISTS message_drafts_read ON public.message_drafts;
    DROP POLICY IF EXISTS message_drafts_write ON public.message_drafts;
    DROP TABLE public.message_drafts;
  END IF;
END $$;

COMMENT ON FUNCTION current_user_org_id() IS
  'Phase 4 note: org_announcements and message_drafts replaced by messages table (20260504_messaging.sql).';
