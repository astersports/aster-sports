-- Wave 3.17 follow-up: register the pg_cron tick that pings the
-- briefing-cron-dispatch edge function every minute.
--
-- Frank sets app.settings.cron_secret via:
--   ALTER DATABASE postgres SET app.settings.cron_secret = '<secret>';
-- and the matching CRON_SECRET env var on the edge function. Until
-- the secret is set, ticks pass an empty Bearer and the edge function
-- returns 401 — harmless, will heal once the secret is set.

GRANT USAGE ON SCHEMA net TO postgres;

SELECT cron.schedule(
  'briefing-dispatch-tick',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vrwwpsbfbnveawqwbdmj.supabase.co/functions/v1/briefing-cron-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.cron_secret', true), '')
    ),
    body := '{}'::jsonb
  );
  $$
);

DO $$
DECLARE
  cron_count integer;
BEGIN
  SELECT COUNT(*) INTO cron_count
  FROM cron.job WHERE jobname='briefing-dispatch-tick';
  IF cron_count != 1 THEN RAISE EXCEPTION 'briefing-dispatch-tick cron job not registered'; END IF;
END $$;
