-- ============================================================
-- 033_tournament_orphan_repair.sql
--
-- Status: APPLIED VIA MCP April 26 2026
-- Migration 024 reseed populated events.tournament_name (text) but did not
-- FK-link events.tournament_id. 34 tournament events orphaned. Only 1 of 7
-- tournament name-groups had a matching tournaments record.
--
-- This migration: created 6 missing tournament records inferred from event data,
-- linked all 34 orphan events to their tournament_id via name match.
-- ============================================================

BEGIN;

WITH lh AS (SELECT id AS org_id FROM organizations WHERE slug = 'legacy-hoopers')
INSERT INTO public.tournaments (org_id, name, start_date, end_date, circuit, status, schedule_status)
SELECT
  lh.org_id, e.tournament_name,
  MIN(e.start_at)::date, MAX(COALESCE(e.end_at, e.start_at))::date,
  CASE
    WHEN e.tournament_name ILIKE '%Zero Gravity%' THEN 'AAU Zero Gravity'
    WHEN e.tournament_name ILIKE '%Hoop Festival%' THEN 'AAU Zero Gravity'
    WHEN e.tournament_name ILIKE '%Hoops Jam%' THEN 'AAU'
    WHEN e.tournament_name ILIKE '%Rumble%' THEN 'AAU'
    WHEN e.tournament_name ILIKE '%Showdown%' THEN 'AAU'
    ELSE NULL
  END,
  CASE
    WHEN MAX(COALESCE(e.end_at, e.start_at)) < now() THEN 'complete'
    WHEN MIN(e.start_at) <= now() AND MAX(COALESCE(e.end_at, e.start_at)) >= now() THEN 'in_progress'
    ELSE 'planned'
  END,
  CASE
    WHEN MAX(COALESCE(e.end_at, e.start_at)) < now() THEN 'final'
    WHEN MIN(e.start_at) - now() < interval '7 days' THEN 'preliminary'
    ELSE 'draft'
  END
FROM events e
CROSS JOIN lh
WHERE e.event_type = 'tournament' AND e.tournament_id IS NULL AND e.tournament_name IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tournaments t WHERE t.name = e.tournament_name AND t.org_id = lh.org_id)
GROUP BY lh.org_id, e.tournament_name;

UPDATE public.events e
SET tournament_id = t.id
FROM public.tournaments t
WHERE e.tournament_id IS NULL AND e.event_type = 'tournament' AND e.tournament_name IS NOT NULL
  AND t.name = e.tournament_name AND t.org_id IN (SELECT org_id FROM teams WHERE id = e.team_id);

NOTIFY pgrst, 'reload schema';

COMMIT;
