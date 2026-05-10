-- Wave 4.3-A: register the second pg_cron job that pings the new
-- briefing-auto-draft-tick edge function every minute. Separate job
-- from briefing-dispatch-tick (wave 3.17) by design — see
-- supabase/functions/briefing-auto-draft-tick/index.ts header.
--
-- Shares the same CRON_SECRET via app.settings.cron_secret. Frank
-- coordinates the secret value externally per docs/CRON_SECRET_SETUP.md.
-- Until the secret is set, ticks pass empty Bearer and the function
-- 401s — fail-loud and harmless.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='briefing-auto-draft-tick') THEN
    PERFORM cron.unschedule('briefing-auto-draft-tick');
  END IF;
END $$;

SELECT cron.schedule(
  'briefing-auto-draft-tick',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://vrwwpsbfbnveawqwbdmj.supabase.co/functions/v1/briefing-auto-draft-tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.cron_secret', true), '')
    ),
    body := '{}'::jsonb
  );
  $cron$
);

DO $$
DECLARE
  cron_count integer;
BEGIN
  SELECT COUNT(*) INTO cron_count
  FROM cron.job WHERE jobname='briefing-auto-draft-tick';
  IF cron_count != 1 THEN RAISE EXCEPTION 'briefing-auto-draft-tick cron job not registered'; END IF;
END $$;
