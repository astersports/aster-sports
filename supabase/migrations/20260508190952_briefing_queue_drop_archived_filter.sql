-- 20260508190952_briefing_queue_drop_archived_filter.sql
-- Mirror of production migration applied via Supabase MCP on May 8, 2026.
-- Drops the `t.archived_at IS NULL` filter from get_briefing_queue.
-- The archive flag is intended to control public rendering (parent-facing
-- schedule, records page) — not to hide tournaments from the operator's
-- own briefings inbox. With the active-season scope already in place
-- (PR #19), the archive filter was redundant and actively harmful: it
-- hid recap-eligible tournaments like ZG NY Metro Showdown (Apr 18-19,
-- archived after completion) from the operator's queue.

CREATE OR REPLACE FUNCTION public.get_briefing_queue(p_org_id uuid)
 RETURNS TABLE(tournament_id uuid, tournament_name text, tournament_start_date date, tournament_end_date date, team_id uuid, team_name text, team_age_group text, team_color text, team_sort_order integer, event_count bigint, sent_history jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  WITH active_season AS (
    SELECT start_date, end_date
    FROM public.seasons
    WHERE org_id = p_org_id AND status = 'active'
    LIMIT 1
  ),
  pairs AS (
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
    JOIN active_season s ON true
    WHERE t.org_id = p_org_id
      AND tm.org_id = p_org_id
      AND t.start_date >= s.start_date
      AND t.start_date <= s.end_date
      AND e.status != 'cancelled'
      AND e.publish_status = 'published'
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
  'Powers /admin/briefings inbox. Returns (tournament, team) pairs for tournaments in the org''s active season plus jsonb sent history (full season, not capped). Includes archived tournaments — archive flag controls public rendering, not operator visibility. SECURITY INVOKER; org scoping via underlying RLS. Empty when no active season exists.';
