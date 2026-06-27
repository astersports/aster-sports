-- AAU live-score poll. A pg_cron job that keeps scores current during live tournaments by
-- re-invoking the idempotent aau-ingest-tournament edge function (via pg_net) for every public
-- tournament running TODAY. Reads ingest_secret server-side (never exposed). Self-gating: a no-op
-- outside ET game hours and when no public tournament is live today, so it's cheap off-event.
-- Plane A public scores/status only — no schema/RLS/money/child change. Reversible: cron.unschedule.
--
-- APPLIED to prod via MCP 2026-06-27 on Frank's explicit go ("prepare the job and implement the
-- job"); mirror per AP #21. Verified: cron.job 'aau-live-score-poll' active (*/10 * * * *); a
-- one-off invocation moved the Grand Finale from 9 → 41 final games (scores landed).

CREATE OR REPLACE FUNCTION public.poll_live_aau_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_secret text;
  v_url text := 'https://vrwwpsbfbnveawqwbdmj.supabase.co/functions/v1/aau-ingest-tournament';
  v_et_hour int := extract(hour FROM (now() AT TIME ZONE 'America/New_York'));
  r record;
BEGIN
  -- only during ET game hours (07:00–23:59 ET); overnight is a no-op
  IF v_et_hour < 7 THEN
    RETURN;
  END IF;

  SELECT value INTO v_secret FROM public.app_secrets WHERE name = 'ingest_secret';
  IF v_secret IS NULL THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT t.tm_id_tournament, t.org_id
    FROM public.tournaments t
    WHERE t.archived_at IS NULL
      AND public.org_is_public_listed(t.org_id)
      AND t.tm_id_tournament IS NOT NULL
      AND (now() AT TIME ZONE 'America/New_York')::date BETWEEN t.start_date AND t.end_date
  LOOP
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer ' || v_secret
      ),
      body := jsonb_build_object('idTournament', r.tm_id_tournament, 'orgId', r.org_id)
    );
  END LOOP;
END;
$fn$;

-- SECURITY DEFINER + reads a secret: callable only by the cron/postgres role, never by clients.
REVOKE EXECUTE ON FUNCTION public.poll_live_aau_scores() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.poll_live_aau_scores() FROM anon;
REVOKE EXECUTE ON FUNCTION public.poll_live_aau_scores() FROM authenticated;

-- Every 10 minutes (UTC); the function self-gates to ET game hours + tournaments live today.
SELECT cron.schedule('aau-live-score-poll', '*/10 * * * *', $cron$SELECT public.poll_live_aau_scores();$cron$);
