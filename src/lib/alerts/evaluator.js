// Tier 3 v1 PR 2 — alert trigger evaluator.
//
// Per Gap 8 clean seam: evaluator is architecture-agnostic. It accepts
// (alertConfigs, queryExecutor) and returns firing alerts. v1 invocation
// passes a Supabase-client-backed executor; future v2+ migration to
// server-side edge function or scheduled cron swaps ONLY the executor.
// Evaluator logic doesn't change.
//
// Per the alert-type-to-query mapping sub-question (Frank's pre-flight
// flag): compile-time function map. Adding a new alert kind requires
// code change + seed change. Acceptable for v1's 5 alert types where
// additions are rare; revisit when v2 admin settings UI ships.
//
// Per per-evaluator contract: each evaluator function takes
// (config, queryExecutor) and returns either null (no fire) OR
// { config_id, alert_type_key, instance_key, severity, data }.

import { thresholdForTeam } from './thresholds';

// ─── Per-instance evaluators ─────────────────────────────────────

async function evalRsvpShortfallNonResponder(config, qx, params) {
  const events = await qx.getRsvpShortfallEvents(config.org_id, params);
  const firing = events.filter((e) => {
    const teamThreshold = config.threshold_config?.non_responder_threshold ?? thresholdForTeam(e.team);
    return (e.expected_roster - e.responded) >= teamThreshold;
  });
  if (!firing.length) return null;
  return { config_id: config.id, alert_type_key: 'rsvp_shortfall', instance_key: config.instance_key,
    severity: config.threshold_config?.severity || 'warning',
    data: { events: firing, affected_count: firing.length } };
}

async function evalRsvpShortfallYesCount(config, qx, params) {
  const events = await qx.getRsvpShortfallEvents(config.org_id, params);
  const firing = events.filter((e) => {
    const teamThreshold = thresholdForTeam(e.team);
    return e.yes_count < teamThreshold;
  });
  if (!firing.length) return null;
  return { config_id: config.id, alert_type_key: 'rsvp_shortfall', instance_key: config.instance_key,
    severity: config.threshold_config?.severity || 'critical',
    data: { events: firing, affected_count: firing.length } };
}

async function evalBriefingOverdue(config, qx) {
  const cfg = config.threshold_config || {};
  const sinceTs = computeWeekStartIso(cfg.week_start_local || 'Sunday');
  const recent = await qx.getMostRecentBriefingByKind(config.org_id, cfg.briefing_kind, sinceTs);
  if (recent) return null;
  return { config_id: config.id, alert_type_key: 'briefing_overdue', instance_key: config.instance_key,
    severity: cfg.severity || 'warning',
    data: { briefing_kind: cfg.briefing_kind, expected_send_by: cfg.expected_send_by_local } };
}

async function evalBriefingOverdueTournament(config, qx) {
  const cfg = config.threshold_config || {};
  const tournaments = await qx.getTournamentsWithoutPrelim(config.org_id, 3);
  if (!tournaments.length) return null;
  return { config_id: config.id, alert_type_key: 'briefing_overdue', instance_key: config.instance_key,
    severity: cfg.severity || 'warning',
    data: { tournaments, expected_send_by: cfg.alert_fire_time_local } };
}

async function evalLocationUnassigned(config, qx) {
  const cfg = config.threshold_config || {};
  const warnHours = cfg.severity_warning_window_hours ?? 48;
  const critHours = cfg.severity_critical_window_hours ?? 24;
  const events = await qx.getEventsWithoutLocation(config.org_id, warnHours);
  if (!events.length) return null;
  const now = Date.now();
  const critical = events.filter((e) => (new Date(e.start_at).getTime() - now) <= critHours * 3600000);
  return { config_id: config.id, alert_type_key: 'location_unassigned', instance_key: null,
    severity: critical.length ? 'critical' : 'warning',
    data: { events, critical_count: critical.length } };
}

// L99 v6 §5.1 B2 — mirror of evalLocationUnassigned for opponent.
// Same window + severity escalation logic. Reuses the same
// filterEventsByTeamScope path in relevanceFilters.js (location_
// unassigned branch recomputes severity from filtered critical count;
// opponent_unassigned passes through since it doesn't get
// per-event-team rescoping from the parent admin scope).
async function evalOpponentUnassigned(config, qx) {
  const cfg = config.threshold_config || {};
  const warnHours = cfg.severity_warning_window_hours ?? 336;
  const critHours = cfg.severity_critical_window_hours ?? 24;
  const events = await qx.getEventsWithoutOpponent(config.org_id, warnHours);
  if (!events.length) return null;
  const now = Date.now();
  const critical = events.filter((e) => (new Date(e.start_at).getTime() - now) <= critHours * 3600000);
  return { config_id: config.id, alert_type_key: 'opponent_unassigned', instance_key: null,
    severity: critical.length ? 'critical' : 'warning',
    data: { events, critical_count: critical.length } };
}

async function evalPaymentOverdue(config, qx) {
  const cfg = config.threshold_config || {};
  const rows = await qx.getOverdueFamilyBalances(config.org_id, cfg.age_threshold_days ?? 30, cfg.minimum_amount_dollars ?? 1);
  if (!rows.length) return null;
  const total = rows.reduce((sum, r) => sum + (r.outstanding_amount || 0), 0);
  return { config_id: config.id, alert_type_key: 'payment_overdue', instance_key: null,
    severity: cfg.severity || 'warning',
    data: { total_outstanding_cents: total, family_count: rows.length } };
}

async function evalDataIntegrityLocationMissing(config, qx) {
  const events = await qx.getEventsWithBrokenLocationData(config.org_id);
  if (!events.length) return null;
  return { config_id: config.id, alert_type_key: 'data_integrity_event_location_missing', instance_key: null,
    severity: config.threshold_config?.severity || 'info',
    data: { events, count: events.length } };
}

// ─── Compile-time evaluator map ──────────────────────────────────

const EVALUATORS = {
  'rsvp_shortfall:friday_noon': (c, qx) => evalRsvpShortfallNonResponder(c, qx, { eventTypeFilter: 'tournament', withinHours: 60 }),
  'rsvp_shortfall:saturday_6am': (c, qx) => evalRsvpShortfallYesCount(c, qx, { eventTypeFilter: 'tournament', withinHours: 18 }),
  'rsvp_shortfall:league_24h': (c, qx) => evalRsvpShortfallNonResponder(c, qx, { eventTypeFilter: 'game', withinHours: 24 }),
  'briefing_overdue:weekly_digest': evalBriefingOverdue,
  'briefing_overdue:tournament_prelim': evalBriefingOverdueTournament,
  'location_unassigned': evalLocationUnassigned,
  'opponent_unassigned': evalOpponentUnassigned,
  'payment_overdue': evalPaymentOverdue,
  'data_integrity_event_location_missing': evalDataIntegrityLocationMissing,
};

function evaluatorKey(config) {
  const k = config.alert_type?.key || config.alert_type_key;
  return config.instance_key ? `${k}:${config.instance_key}` : k;
}

function computeWeekStartIso(weekStartLocal) {
  const day = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }[weekStartLocal] ?? 0;
  const now = new Date();
  const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() - day + 7) % 7));
  return dt.toISOString();
}

// ─── Orchestrator (clean-seam entry point) ───────────────────────

export async function evaluateAlerts(alertConfigs, queryExecutor) {
  if (!Array.isArray(alertConfigs) || !queryExecutor) return [];
  const enabled = alertConfigs.filter((c) => c.enabled !== false);
  enabled.sort((a, b) => (a.evaluation_order ?? 0) - (b.evaluation_order ?? 0));
  const results = [];
  for (const config of enabled) {
    const fn = EVALUATORS[evaluatorKey(config)];
    if (!fn) continue;
    try {
      const result = await fn(config, queryExecutor);
      if (result) results.push(result);
    } catch (err) {
      console.error(`[alerts/evaluator] ${evaluatorKey(config)} failed:`, err.message);
    }
  }
  return results;
}

export { EVALUATORS, evaluatorKey, computeWeekStartIso };
