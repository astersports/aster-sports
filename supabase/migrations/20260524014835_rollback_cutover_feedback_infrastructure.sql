-- §4.AI Option C followup — full rip-out of the cutover-gate feedback
-- infrastructure shipped in Cutover PR 7a (2026-05-22, migration
-- 20260522074242_cutover_pr_7a_briefing_feedback_infrastructure.sql).
--
-- Per Frank's 2026-05-24 routing: the "How was this briefing?" survey
-- block in family emails is no longer wanted. Three layers of removal:
--
--   Layer 1 (src code): resolvers stop emitting feedback_survey;
--     SECTION_RENDERERS drops it; admin chips/cards retired. Done in
--     the companion PR.
--   Layer 2 (edge function + config): feedback-token-handler dir
--     deleted; supabase/config.toml entry removed. Done in the
--     companion PR. The deployed function will continue to error on
--     invocation once verify_feedback_token is dropped below — this is
--     intentional (no inbound callers after the email block stops
--     emitting on 2026-05-24).
--   Layer 3 (this migration): DROP the 3 RPCs, the table, and the
--     app_secrets row.
--
-- Irreversible. briefing_feedback table is dropped CASCADE; if any
-- foreign-key references existed downstream, they would be removed
-- too. As of 2026-05-24, the table is the only consumer of the
-- feedback_token_secret app_secrets row, and no other table has an
-- FK pointing at briefing_feedback.id.

BEGIN;

DROP FUNCTION IF EXISTS public.apply_feedback_submission(text, smallint, text);
DROP FUNCTION IF EXISTS public.verify_feedback_token(text);
DROP FUNCTION IF EXISTS public.mint_feedback_token(uuid, text, smallint);

DROP TABLE IF EXISTS public.briefing_feedback CASCADE;

DELETE FROM public.app_secrets WHERE name = 'feedback_token_secret';

DO $$
DECLARE
  v_table_exists boolean;
  v_secret_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'briefing_feedback'
  ) INTO v_table_exists;

  SELECT EXISTS (
    SELECT 1 FROM public.app_secrets WHERE name = 'feedback_token_secret'
  ) INTO v_secret_exists;

  IF v_table_exists THEN
    RAISE EXCEPTION 'briefing_feedback table still exists after DROP';
  END IF;
  IF v_secret_exists THEN
    RAISE EXCEPTION 'feedback_token_secret still present in app_secrets after DELETE';
  END IF;

  RAISE NOTICE '§4.AI cutover-gate rollback: 3 RPCs + briefing_feedback + feedback_token_secret removed';
END $$;

COMMIT;
