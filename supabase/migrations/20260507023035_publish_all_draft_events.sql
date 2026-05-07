DO $$
DECLARE
  v_before int;
BEGIN
  SELECT COUNT(*) INTO v_before FROM public.events WHERE publish_status <> 'published';
  RAISE NOTICE 'PRE: % events not published', v_before;
  IF v_before <> 140 THEN
    RAISE EXCEPTION 'Expected 140 unpublished, got % — schema/data drifted, abort', v_before;
  END IF;
END $$;

UPDATE public.events
SET publish_status = 'published',
    updated_at = NOW()
WHERE publish_status <> 'published';
