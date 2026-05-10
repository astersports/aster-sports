-- Wave 4.3-E: delete 3 zombie briefing drafts created by BriefingComposer
-- autosave (intentional behavior) during pre-hotfix admin testing of
-- weekly_digest team-scoped wizard mode. All have NULL subject, NULL
-- period_start, recipient_count=0. Defensive criteria check inside DO $$
-- aborts if anyone touched them since 4.3-E was scoped.

DO $$
DECLARE
  v_deleted_count int;
  v_unexpected_count int;
BEGIN
  SELECT COUNT(*) INTO v_unexpected_count
  FROM comms_messages
  WHERE id IN (
    '9218f14f-f5b4-4982-9635-51bc2c42375a',
    'c4e85879-076a-4c5f-ab46-ed1360eb760a',
    'f3ff0abc-3d18-42be-95de-3c015e2a2613'
  )
  AND NOT (
    status = 'draft'
    AND subject IS NULL
    AND period_start IS NULL
    AND recipient_count = 0
  );

  IF v_unexpected_count > 0 THEN
    RAISE EXCEPTION 'Wave 4.3-E zombie cleanup: % row(s) no longer match zombie criteria. Aborting.', v_unexpected_count;
  END IF;

  DELETE FROM comms_messages
  WHERE id IN (
    '9218f14f-f5b4-4982-9635-51bc2c42375a',
    'c4e85879-076a-4c5f-ab46-ed1360eb760a',
    'f3ff0abc-3d18-42be-95de-3c015e2a2613'
  );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count != 3 THEN
    RAISE EXCEPTION 'Wave 4.3-E zombie cleanup: expected 3 deletions, got %. Aborting.', v_deleted_count;
  END IF;

  RAISE NOTICE 'Wave 4.3-E: deleted 3 zombie drafts.';
END $$;
