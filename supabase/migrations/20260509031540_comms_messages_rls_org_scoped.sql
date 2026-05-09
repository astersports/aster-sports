-- ============================================================
-- COMMS MESSAGES RLS — org-scoped policies
--
-- Bug surfaced when wave 3 weekly_digest tried to INSERT with
-- tournament_id = NULL. Old policies scoped through tournament_id IN
-- (...) which evaluates to NULL for non-tournament kinds, blocking
-- INSERT and SELECT for digest, multi_team_notice, custom kinds.
--
-- New policies scope directly through org_id (column exists since
-- before foundation, all rows populated). NOT NULL constraint added
-- defensively so future code without org_id fails fast at INSERT.
-- ============================================================

-- 1. Make org_id NOT NULL (defensive — verified all existing rows have it)
ALTER TABLE public.comms_messages
  ALTER COLUMN org_id SET NOT NULL;

-- 2. Drop old tournament-scoped policies
DROP POLICY IF EXISTS comms_messages_read ON public.comms_messages;
DROP POLICY IF EXISTS comms_messages_write ON public.comms_messages;
DROP POLICY IF EXISTS cmr_read ON public.comms_message_recipients;
DROP POLICY IF EXISTS cmr_write ON public.comms_message_recipients;

-- 3. New org-scoped read on comms_messages
CREATE POLICY comms_messages_read ON public.comms_messages
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- 4. New org-scoped write on comms_messages (admin/coach only)
CREATE POLICY comms_messages_write ON public.comms_messages
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = ANY (ARRAY['admin'::text, 'coach'::text])
    )
  );

-- 5. New scoped read on comms_message_recipients (via parent message's org_id)
CREATE POLICY cmr_read ON public.comms_message_recipients
  FOR SELECT TO authenticated
  USING (
    message_id IN (
      SELECT id FROM public.comms_messages
      WHERE org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = (SELECT auth.uid())
      )
    )
  );

-- 6. New scoped write on comms_message_recipients (admin/coach only via parent)
CREATE POLICY cmr_write ON public.comms_message_recipients
  FOR ALL TO authenticated
  USING (
    message_id IN (
      SELECT id FROM public.comms_messages
      WHERE org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = (SELECT auth.uid())
          AND role = ANY (ARRAY['admin'::text, 'coach'::text])
      )
    )
  )
  WITH CHECK (
    message_id IN (
      SELECT id FROM public.comms_messages
      WHERE org_id IN (
        SELECT organization_id FROM public.user_roles
        WHERE user_id = (SELECT auth.uid())
          AND role = ANY (ARRAY['admin'::text, 'coach'::text])
      )
    )
  );

-- 7. Verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='comms_messages'
      AND policyname='comms_messages_write'
      AND with_check ILIKE '%org_id%'
  ) THEN
    RAISE EXCEPTION 'comms_messages_write policy did not register with org_id check';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='comms_messages'
      AND column_name='org_id' AND is_nullable='NO'
  ) THEN
    RAISE EXCEPTION 'comms_messages.org_id is not NOT NULL';
  END IF;
END $$;
