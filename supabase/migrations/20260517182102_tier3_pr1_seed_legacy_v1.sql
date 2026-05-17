-- Tier 3 v1 PR 1 — Migration B+C: alert_types catalog + Legacy seed
--
-- INSERTs into the 4 tables created by Migration A. Combined per Gap 4
-- sequencing decision.
--
-- LEGACY ORG_ID: e3e95e21-3571-4e9a-985a-d5d01480d4a6 (per CLAUDE.md §1)
--
-- SEEDS:
--   alert_types: 5 catalog rows (2 primitives + 3 functional specifics).
--     Deferred: weather_travel_alert (v2), travel_time_excess (v2),
--     coach_unassigned (post-PR-6). No catalog rows for these in v1.
--   alert_configurations: 8 rows for Legacy
--     (3 rsvp_shortfall instances + 2 briefing_overdue instances
--      + 3 functional specifics)
--   quick_actions_config: 6 rows for Legacy (per Q4 lock)
--   dashboard_section_visibility: 7 rows for Legacy (per Q5 enumeration)
--
-- THRESHOLD_CONFIG SHAPES are locked per Gap 3 / Tier 3 P0 resolution
-- 2026-05-17. JSONB validation deferred to v2 (Gap 4 / Q9).
--
-- Reading 1 lock for Gap 3.2 (Q1 = derived threshold via age_group
-- + circuit lookup): all 5 Legacy teams currently resolve to
-- yes_count_threshold=5. Derivation logic lives in PR 2's evaluator
-- code; the seed value captures Legacy's current state.

-- ─────────────────────────────────────────────────────────────────
-- alert_types catalog (5 rows, org-agnostic)
-- ─────────────────────────────────────────────────────────────────

INSERT INTO public.alert_types (key, default_severity, description, is_primitive) VALUES
  ('rsvp_shortfall', 'warning', 'RSVP response count below threshold for an event. Multiple instances per org by checkpoint timing.', true),
  ('briefing_overdue', 'warning', 'Briefing not sent within expected window. Multiple instances per org by briefing_kind.', true),
  ('location_unassigned', 'warning', 'Event missing location_id with escalation by hours-to-event.', false),
  ('payment_overdue', 'warning', 'Family balance outstanding > N days. Rolled-up single alert per evaluation.', false),
  ('data_integrity_event_location_missing', 'info', 'Future event has broken location data. Rolled-up single alert.', false);

-- ─────────────────────────────────────────────────────────────────
-- alert_configurations for Legacy (8 rows)
-- ─────────────────────────────────────────────────────────────────

-- 3.1 rsvp_shortfall — Friday noon checkpoint
INSERT INTO public.alert_configurations (org_id, alert_type_id, instance_key, threshold_config, evaluation_order)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', id, 'friday_noon',
  '{
    "severity": "warning",
    "checkpoint_type": "calendar_anchor",
    "checkpoint_local": "Friday 12:00",
    "applies_to": "tournament_games_this_weekend",
    "non_responder_threshold": 5
  }'::jsonb, 10
FROM public.alert_types WHERE key = 'rsvp_shortfall';

-- 3.2 rsvp_shortfall — Saturday 6 AM day-of
INSERT INTO public.alert_configurations (org_id, alert_type_id, instance_key, threshold_config, evaluation_order)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', id, 'saturday_6am',
  '{
    "severity": "critical",
    "checkpoint_time_local": "06:00",
    "yes_count_threshold": 5,
    "applies_to": "tournament_games_today",
    "_q1_note": "Reading 1 lock: threshold derived from age_group+circuit. Legacy currently resolves to 5 for all teams. Derivation lookup in PR 2 evaluator."
  }'::jsonb, 11
FROM public.alert_types WHERE key = 'rsvp_shortfall';

-- 3.3 rsvp_shortfall — League 24h checkpoint
INSERT INTO public.alert_configurations (org_id, alert_type_id, instance_key, threshold_config, evaluation_order)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', id, 'league_24h',
  '{
    "severity": "warning",
    "checkpoint_type": "relative_offset",
    "checkpoint_hours_before_event": 24,
    "applies_to": "league_games_only",
    "non_responder_threshold": 4
  }'::jsonb, 12
FROM public.alert_types WHERE key = 'rsvp_shortfall';

-- 3.7 location_unassigned
INSERT INTO public.alert_configurations (org_id, alert_type_id, instance_key, threshold_config, evaluation_order)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', id, NULL,
  '{
    "severity_warning_window_hours": 48,
    "severity_critical_window_hours": 24
  }'::jsonb, 20
FROM public.alert_types WHERE key = 'location_unassigned';

-- 3.8 briefing_overdue — weekly_digest
INSERT INTO public.alert_configurations (org_id, alert_type_id, instance_key, threshold_config, evaluation_order)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', id, 'weekly_digest',
  '{
    "severity": "warning",
    "expected_send_by_local": "Thursday 09:00",
    "grace_window_hours": 8,
    "week_start_local": "Sunday",
    "briefing_kind": "weekly_digest",
    "queued_counts_as_sent": true
  }'::jsonb, 30
FROM public.alert_types WHERE key = 'briefing_overdue';

-- 3.9 briefing_overdue — tournament_prelim
INSERT INTO public.alert_configurations (org_id, alert_type_id, instance_key, threshold_config, evaluation_order)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', id, 'tournament_prelim',
  '{
    "severity": "warning",
    "alert_fire_time_local": "Friday 15:00",
    "applies_when": "tournament_within_next_3_days",
    "briefing_kind": "tournament_prelim",
    "grace_window_hours": 0,
    "queued_counts_as_sent": true
  }'::jsonb, 31
FROM public.alert_types WHERE key = 'briefing_overdue';

-- 3.10 payment_overdue
INSERT INTO public.alert_configurations (org_id, alert_type_id, instance_key, threshold_config, evaluation_order)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', id, NULL,
  '{
    "severity": "warning",
    "age_threshold_days": 30,
    "minimum_amount_dollars": 1,
    "evaluation_time_local": "09:00",
    "rendering": "rolled_up"
  }'::jsonb, 40
FROM public.alert_types WHERE key = 'payment_overdue';

-- 3.11 data_integrity_event_location_missing
INSERT INTO public.alert_configurations (org_id, alert_type_id, instance_key, threshold_config, evaluation_order)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', id, NULL,
  '{
    "severity": "info",
    "applies_to": "future_events_only",
    "trigger_conditions": [
      "location_id IS NULL",
      "location_id IS NOT NULL AND location IS NULL"
    ],
    "rolled_up": true
  }'::jsonb, 50
FROM public.alert_types WHERE key = 'data_integrity_event_location_missing';

-- ─────────────────────────────────────────────────────────────────
-- quick_actions_config for Legacy (6 rows per Q4 lock)
-- ─────────────────────────────────────────────────────────────────

INSERT INTO public.quick_actions_config (org_id, action_key, label, icon_name, route, sort_order) VALUES
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'add_event',        '+ Event',          'CalendarPlus', '/schedule',                  1),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'add_player',       '+ Player',         'UserPlus',     '/teams',                     2),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'compose_briefing', 'Compose Briefing', 'Mail',         '/admin/briefings/compose',   3),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'financials',       'Financials',       'DollarSign',   '/admin/financials',          4),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'announce',         'Announce',         'Megaphone',    '/messages?announce=1',       5),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'tournaments',      'Tournaments',      'Trophy',       '/tournaments',               6);

-- ─────────────────────────────────────────────────────────────────
-- dashboard_section_visibility for Legacy (7 rows per Q5 enumeration)
-- ─────────────────────────────────────────────────────────────────

INSERT INTO public.dashboard_section_visibility (org_id, section_key, sort_order) VALUES
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'key_metrics',           1),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'next_event',            2),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'admin_shortcuts',       3),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'teams',                 4),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'active_season',         5),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'next_7_days',           6),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'recent_notifications',  7);

-- ─────────────────────────────────────────────────────────────────
-- Smoke test
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_types int;
  v_configs int;
  v_actions int;
  v_sections int;
BEGIN
  SELECT count(*) INTO v_types FROM public.alert_types;
  SELECT count(*) INTO v_configs FROM public.alert_configurations
    WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
  SELECT count(*) INTO v_actions FROM public.quick_actions_config
    WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
  SELECT count(*) INTO v_sections FROM public.dashboard_section_visibility
    WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

  IF v_types != 5 THEN
    RAISE EXCEPTION 'Expected 5 alert_types catalog rows, got %', v_types;
  END IF;
  IF v_configs != 8 THEN
    RAISE EXCEPTION 'Expected 8 alert_configurations for Legacy, got %', v_configs;
  END IF;
  IF v_actions != 6 THEN
    RAISE EXCEPTION 'Expected 6 quick_actions_config for Legacy, got %', v_actions;
  END IF;
  IF v_sections != 7 THEN
    RAISE EXCEPTION 'Expected 7 dashboard_section_visibility for Legacy, got %', v_sections;
  END IF;

  RAISE NOTICE 'Tier 3 PR 1 Migration B+C: 5 catalog + 8 configs + 6 actions + 7 sections seeded for Legacy';
END $$;
