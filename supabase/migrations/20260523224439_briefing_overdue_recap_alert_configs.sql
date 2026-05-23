-- §4.AI Option C PR B — seed 2 new alert_configurations rows for the
-- briefing_overdue alert_type:
--   * briefing_overdue:game_recap         — fires when a past game has
--     no game_recap briefing sent.
--   * briefing_overdue:tournament_recap   — fires when a past tournament
--     has no tournament_recap briefing sent.
--
-- The alert_type 'briefing_overdue' already exists from PR 1 (see
-- 20260517182019_tier3_pr1_schema_alert_framework.sql); only new
-- instance_key rows are added here. The evaluators live in
-- src/lib/alerts/briefingOverdueEvaluators.js and dispatch through
-- the EVALUATORS map in src/lib/alerts/evaluator.js.
--
-- LEGACY ORG_ID: e3e95e21-3571-4e9a-985a-d5d01480d4a6 (CLAUDE.md §1)
--
-- The schedule_change_followup sub-key flagged in the §4.AI audit doc
-- is intentionally NOT seeded here — the event_change_audit row's
-- dispatch_email_id IS NULL state conflates "admin chose to skip" and
-- "dispatch failed silently", so the alert would be noisy. Deferred
-- until the audit table records intent explicitly.

INSERT INTO public.alert_configurations (org_id, alert_type_id, instance_key, threshold_config, evaluation_order)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', id, 'game_recap',
  '{
    "severity": "warning",
    "since_hours": 24,
    "applies_to": "past_games",
    "briefing_kind": "game_recap",
    "queued_counts_as_sent": true
  }'::jsonb, 32
FROM public.alert_types WHERE key = 'briefing_overdue';

INSERT INTO public.alert_configurations (org_id, alert_type_id, instance_key, threshold_config, evaluation_order)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', id, 'tournament_recap',
  '{
    "severity": "warning",
    "since_days": 2,
    "applies_to": "past_tournaments",
    "briefing_kind": "tournament_recap",
    "queued_counts_as_sent": true
  }'::jsonb, 33
FROM public.alert_types WHERE key = 'briefing_overdue';

-- Smoke test: confirm the 2 new rows landed.
DO $$
DECLARE
  v_recap_configs int;
BEGIN
  SELECT count(*) INTO v_recap_configs
  FROM public.alert_configurations c
  JOIN public.alert_types t ON t.id = c.alert_type_id
  WHERE c.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND t.key = 'briefing_overdue'
    AND c.instance_key IN ('game_recap', 'tournament_recap');

  IF v_recap_configs != 2 THEN
    RAISE EXCEPTION 'Expected 2 briefing_overdue recap configs for Legacy, got %', v_recap_configs;
  END IF;

  RAISE NOTICE '§4.AI Option C PR B: 2 briefing_overdue recap configs seeded for Legacy';
END $$;
