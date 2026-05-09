-- ============================================================
-- BRIEFING QUEUE — allow archived tournaments in past/all tabs
--
-- Wave 3.5 §C1 follow-up: ZG NY Metro Showdown (Apr 18-19) was set
-- archived_at='2026-04-27' nine days after it ended. The previous
-- briefing_queue_tab_filter migration still excluded archived rows
-- across all tabs, so the past tab couldn't see it either.
--
-- Active tab keeps `archived_at IS NULL` to avoid surfacing admin-
-- archived rows in forward-looking views. Past + All tabs allow
-- archived so historical briefing audits work.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_briefing_queue(
  p_org_id uuid,
  p_tab text DEFAULT 'active'
)
RETURNS TABLE (
  tournament_id uuid, tournament_name text,
  tournament_start_date date, tournament_end_date date,
  tournament_status text,
  team_id uuid, team_name text, team_age_group text,
  team_color text, team_sort_order integer,
  event_count bigint, sent_history jsonb
)
LANGUAGE sql STABLE
SET search_path = public, pg_catalog
AS $$
  WITH pairs AS (
    SELECT
      t.id AS tournament_id, t.name AS tournament_name,
      t.start_date AS tournament_start_date, t.end_date AS tournament_end_date,
      t.status AS tournament_status,
      tm.id AS team_id, tm.name AS team_name,
      tm.age_group AS team_age_group, tm.team_color AS team_color,
      tm.sort_order AS team_sort_order, COUNT(e.id) AS event_count
    FROM public.tournaments t
    JOIN public.events e ON e.tournament_id = t.id
    JOIN public.teams tm ON tm.id = e.team_id
    WHERE t.org_id = p_org_id AND tm.org_id = p_org_id
      AND e.status != 'cancelled'
      AND e.publish_status = 'published'
      AND (
        (p_tab = 'active'
          AND t.archived_at IS NULL
          AND (COALESCE(t.end_date, t.start_date) >= CURRENT_DATE OR t.status = 'active')
          AND t.start_date <= CURRENT_DATE + INTERVAL '90 days'
        )
        OR (p_tab = 'past'
          AND (COALESCE(t.end_date, t.start_date) < CURRENT_DATE OR t.status = 'complete')
          AND COALESCE(t.end_date, t.start_date) >= CURRENT_DATE - INTERVAL '365 days'
        )
        OR (p_tab = 'all'
          AND COALESCE(t.end_date, t.start_date) >= CURRENT_DATE - INTERVAL '365 days'
          AND t.start_date <= CURRENT_DATE + INTERVAL '365 days'
        )
      )
    GROUP BY t.id, t.name, t.start_date, t.end_date, t.status,
             tm.id, tm.name, tm.age_group, tm.team_color, tm.sort_order
  ),
  history AS (
    SELECT
      cm.tournament_id, cm.team_id,
      jsonb_agg(jsonb_build_object('kind', cm.kind, 'sent_at', cm.sent_at)
                ORDER BY cm.sent_at DESC) AS sent_history
    FROM public.comms_messages cm
    WHERE cm.org_id = p_org_id
      AND cm.team_id IS NOT NULL
      AND cm.sent_at IS NOT NULL
      AND cm.sent_at > NOW() - INTERVAL '365 days'
    GROUP BY cm.tournament_id, cm.team_id
  )
  SELECT
    p.tournament_id, p.tournament_name, p.tournament_start_date,
    p.tournament_end_date, p.tournament_status,
    p.team_id, p.team_name,
    p.team_age_group, p.team_color, p.team_sort_order,
    p.event_count, COALESCE(h.sent_history, '[]'::jsonb) AS sent_history
  FROM pairs p
  LEFT JOIN history h ON h.tournament_id = p.tournament_id AND h.team_id = p.team_id
  ORDER BY p.tournament_start_date ASC, p.team_sort_order DESC NULLS LAST;
$$;

DO $$
DECLARE past_count int;
BEGIN
  SELECT COUNT(DISTINCT tournament_id) INTO past_count
  FROM public.get_briefing_queue('e3e95e21-3571-4e9a-985a-d5d01480d4a6'::uuid, 'past');
  IF past_count < 2 THEN
    RAISE EXCEPTION 'past tab returned % tournaments — expected ≥ 2 (ZG Chase + ZG NY Metro Showdown)', past_count;
  END IF;
END $$;
