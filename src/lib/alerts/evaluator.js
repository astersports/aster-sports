// Tier 3 v1 PR 2 — alert trigger evaluator.
//
// Per Gap 8 clean seam: evaluator is architecture-agnostic. It accepts
// (alertConfigs, queryExecutor) and returns firing alerts. v1 invocation
// passes a Supabase-client-backed executor; future v2+ migration to
// server-side edge function or scheduled cron swaps ONLY the executor.
//
// §4.AI Option C PR B (2026-05-23): briefing_overdue evaluators moved
// to briefingOverdueEvaluators.js so this file stays under the 150-line
// cap after adding 2 new sub-keys (game_recap + tournament_recap).
//
// Per per-evaluator contract: each evaluator function takes
// (config, queryExecutor) and returns either null (no fire) OR
// { config_id, alert_type_key, instance_key, severity, data }.

import { thresholdForTeam } from './thresholds';
import {
  computeWeekStartIso,
  evalBriefingOverdue,
  evalBriefingOverdueGameRecap,
  evalBriefingOverdueTournament,
  evalBriefingOverdueTournamentRecap,
} from './briefingOverdueEvaluators';

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
  'briefing_overdue:game_recap': evalBriefingOverdueGameRecap,
  'briefing_overdue:tournament_recap': evalBriefingOverdueTournamentRecap,
  'location_unassigned': evalLocationUnassigned,
  'opponent_unassigned': evalOpponentUnassigned,
  'payment_overdue': evalPaymentOverdue,
  'data_integrity_event_location_missing': evalDataIntegrityLocationMissing,
};

function evaluatorKey(config) {
  const k = config.alert_type?.key || config.alert_type_key;
  return config.instance_key ? `${k}:${config.instance_key}` : k;
}

// ─── Orchestrator (clean-seam entry point) ───────────────────────

export async function evaluateAlerts(alertConfigs, queryExecutor) {
  if (!Array.isArray(alertConfigs) || !queryExecutor) return [];
  const enabled = alertConfigs.filter((c) => c.enabled !== false);
  enabled.sort((a, b) => (a.evaluation_order ?? 0) - (b.evaluation_order ?? 0));
  // Wave 2.B Batch 1 (#1 P0-1): parallelize evaluators via Promise.all
  // so all 9 evaluators fire concurrently instead of serially. Per-
  // evaluator try/catch preserves the original error-isolation contract
  // (one evaluator failing does not abort the rest). Promise.all
  // preserves input order, so the result-shape contract is unchanged.
  const settled = await Promise.all(enabled.map(async (config) => {
    const fn = EVALUATORS[evaluatorKey(config)];
    if (!fn) return null;
    try {
      return await fn(config, queryExecutor);
    } catch (err) {
      console.error(`[alerts/evaluator] ${evaluatorKey(config)} failed:`, err.message);
      return null;
    }
  }));
  return settled.filter((r) => r);
}

export { EVALUATORS, evaluatorKey, computeWeekStartIso };
