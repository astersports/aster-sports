-- Wave 4.3-F: move cron secret from Deno.env to app_secrets.
-- Server-side secret generation keeps the value out of tool args
-- and migration logs. Cron commands rewritten to read from
-- app_secrets at tick time. Edge functions refactored in same PR.

DO $$
DECLARE
  v_existing text;
BEGIN
  -- Idempotent: don't regenerate if already provisioned.
  SELECT value INTO v_existing FROM public.app_secrets WHERE name = 'cron_secret';
  IF v_existing IS NULL THEN
    INSERT INTO public.app_secrets (name, value)
    VALUES ('cron_secret', encode(extensions.gen_random_bytes(32), 'hex'));
  END IF;
END $$;

-- Rewrite both cron jobs to read Bearer from app_secrets, not the GUC.
SELECT cron.unschedule('briefing-dispatch-tick');
SELECT cron.schedule(
  'briefing-dispatch-tick',
  '* * * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://vrwwpsbfbnveawqwbdmj.supabase.co/functions/v1/briefing-cron-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM public.app_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cmd$
);

SELECT cron.unschedule('briefing-auto-draft-tick');
SELECT cron.schedule(
  'briefing-auto-draft-tick',
  '* * * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://vrwwpsbfbnveawqwbdmj.supabase.co/functions/v1/briefing-auto-draft-tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM public.app_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cmd$
);

-- Verification: confirm secret provisioned + cron commands rewritten.
-- Uses length() to avoid printing the value.
DO $$
DECLARE
  v_secret_len int;
  v_cmd_dispatch text;
  v_cmd_auto text;
BEGIN
  SELECT length(value) INTO v_secret_len FROM public.app_secrets WHERE name = 'cron_secret';
  IF v_secret_len IS NULL OR v_secret_len != 64 THEN
    RAISE EXCEPTION 'cron_secret missing or wrong length: %', v_secret_len;
  END IF;

  SELECT command INTO v_cmd_dispatch FROM cron.job WHERE jobname = 'briefing-dispatch-tick';
  SELECT command INTO v_cmd_auto FROM cron.job WHERE jobname = 'briefing-auto-draft-tick';

  IF v_cmd_dispatch NOT LIKE '%app_secrets%' THEN
    RAISE EXCEPTION 'briefing-dispatch-tick command does not reference app_secrets';
  END IF;
  IF v_cmd_auto NOT LIKE '%app_secrets%' THEN
    RAISE EXCEPTION 'briefing-auto-draft-tick command does not reference app_secrets';
  END IF;

  RAISE NOTICE 'Wave 4.3-F: cron_secret provisioned (len=%), both cron commands rewritten.', v_secret_len;
END $$;
