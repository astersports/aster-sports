-- 20260508172042_get_briefing_queue_rpc.sql
-- Mirror of production RPC applied via Supabase MCP on May 8, 2026.
-- Powers /admin/briefings inbox. Returns (tournament, team) pairs with
-- active events in window plus jsonb sent history. SECURITY INVOKER;
-- relies on tournaments/events/teams/tournament_messages RLS for org scoping.

CREATE OR REPLACE FUNCTION public.get_briefing_queue(p_org_id uuid)
 RETURNS TABLE(tournament_id uuid, tournament_name text, tournament_start_date date, tournament_end_date date, team_id uuid, team_name text, team_age_group text, team_color text, team_sort_order integer, event_count bigint, sent_history jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  WITH pairs AS (
    SELECT
      t.id AS tournament_id,
      t.name AS tournament_name,
      t.start_date AS tournament_start_date,
      t.end_date AS tournament_end_date,
      tm.id AS team_id,
      tm.name AS team_name,
      tm.age_group AS team_age_group,
      tm.team_color AS team_color,
      tm.sort_order AS team_sort_order,
      COUNT(e.id) AS event_count
    FROM public.tournaments t
    JOIN public.events e ON e.tournament_id = t.id
    JOIN public.teams tm ON tm.id = e.team_id
    WHERE t.org_id = p_org_id
      AND tm.org_id = p_org_id
      AND t.start_date >= CURRENT_DATE - INTERVAL '14 days'
      AND t.start_date <= CURRENT_DATE + INTERVAL '90 days'
      AND e.status != 'cancelled'
      AND e.publish_status = 'published'
      AND t.archived_at IS NULL
    GROUP BY t.id, t.name, t.start_date, t.end_date,
             tm.id, tm.name, tm.age_group, tm.team_color, tm.sort_order
  ),
  history AS (
    SELECT
      tmsg.tournament_id,
      tmsg.team_id,
      jsonb_agg(
        jsonb_build_object(
          'message_type', tmsg.message_type,
          'sent_at', tmsg.sent_at
        ) ORDER BY tmsg.sent_at DESC
      ) AS sent_history
    FROM public.tournament_messages tmsg
    WHERE tmsg.org_id = p_org_id
      AND tmsg.team_id IS NOT NULL
      AND tmsg.sent_at IS NOT NULL
      AND tmsg.sent_at > NOW() - INTERVAL '60 days'
    GROUP BY tmsg.tournament_id, tmsg.team_id
  )
  SELECT
    p.tournament_id,
    p.tournament_name,
    p.tournament_start_date,
    p.tournament_end_date,
    p.team_id,
    p.team_name,
    p.team_age_group,
    p.team_color,
    p.team_sort_order,
    p.event_count,
    COALESCE(h.sent_history, '[]'::jsonb) AS sent_history
  FROM pairs p
  LEFT JOIN history h
    ON h.tournament_id = p.tournament_id AND h.team_id = p.team_id
  ORDER BY p.tournament_start_date ASC, p.team_sort_order DESC NULLS LAST;
$function$;

COMMENT ON FUNCTION public.get_briefing_queue(uuid) IS
  'Powers /admin/briefings inbox. Returns (tournament, team) pairs with active events in window plus jsonb sent history. SECURITY INVOKER; relies on tournaments/events/teams/tournament_messages RLS for org scoping.';

-- EXECUTE granted to PUBLIC by Postgres default for CREATE FUNCTION.
-- All Supabase roles (anon, authenticated, service_role) inherit.
-- Org scoping is enforced by RLS on the underlying tables, not by
-- function-level grants. SECURITY INVOKER means the function runs
-- as the calling user, so RLS applies to the calling user's row visibility.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_briefing_queue'
  ) THEN
    RAISE EXCEPTION 'get_briefing_queue function not created';
  END IF;
END $$;
