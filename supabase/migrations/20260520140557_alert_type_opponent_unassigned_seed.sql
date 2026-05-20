-- L99 v6 §5.1 B2: surface TBD-opponent events in the admin home
-- alerts lane. Frank-reported 2026-05-20 -- ~12 upcoming events
-- still have opponent NULL / '' / 'TBD' after PR #350 (which only
-- prevents NEW ones via wizard validation).
--
-- Same shape as location_unassigned (anti-pattern #43 -- reuse the
-- patterns that already work). Default warning severity, escalates
-- to critical when any event is <24h out. Audience scope: NOT
-- admin-only; coaches care about opponent prep too, so the
-- relevance filter routes through filterEventsByTeamScope (per
-- relevanceFilters.js line 25-42).

INSERT INTO public.alert_types (key, default_severity, description, is_primitive)
VALUES (
  'opponent_unassigned',
  'warning',
  'Future event missing opponent (NULL, empty string, or literal ''TBD''). Escalates to critical when event is <24h out.',
  false
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.alert_configurations (org_id, alert_type_id, instance_key, threshold_config, evaluation_order)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', id, NULL,
  '{
    "severity_warning_window_hours": 336,
    "severity_critical_window_hours": 24
  }'::jsonb, 25
FROM public.alert_types WHERE key = 'opponent_unassigned'
ON CONFLICT DO NOTHING;
