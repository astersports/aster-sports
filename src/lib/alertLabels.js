// Human labels + read-only threshold summaries for alert_configurations rows,
// keyed by alert_types.key + instance_key. Static map — thresholds are
// READ-ONLY in the pilot (S9 FLAG 2: threshold_config is heterogeneous and
// partly evaluator-internal, so no editor). Strings sourced from the live LH
// seed. Severity derives from threshold_config.severity, falling back to the
// alert type's default_severity.

const LABELS = {
  'rsvp_shortfall|friday_noon': { label: 'Friday noon checkpoint', summary: 'Tournament games this weekend · 5 non-responders' },
  'rsvp_shortfall|saturday_6am': { label: 'Saturday 6am checkpoint', summary: 'Tournament games today · 5 confirmed min' },
  'rsvp_shortfall|league_24h': { label: 'League 24h checkpoint', summary: 'League games · 4 non-responders · 24h before' },
  'location_unassigned|': { label: 'Location unassigned', summary: 'Warn 48h out · critical 24h out' },
  'opponent_unassigned|': { label: 'Opponent unassigned', summary: 'Warn 2 weeks out · critical 24h out' },
  'briefing_overdue|weekly_digest': { label: 'Weekly digest', summary: 'Expected by Thursday 09:00 · 8h grace' },
  'briefing_overdue|tournament_prelim': { label: 'Tournament prelim', summary: 'Fires Friday 15:00 if unsent' },
  'briefing_overdue|game_recap': { label: 'Game recap', summary: 'Past games · within 24h' },
  'briefing_overdue|tournament_recap': { label: 'Tournament recap', summary: 'Past tournaments · within 2 days' },
  'payment_overdue|': { label: 'Payment overdue', summary: 'Balance over 30 days · rolled up' },
  'data_integrity_event_location_missing|': { label: 'Event location data missing', summary: 'Future events · rolled up' },
};

// Display grouping (not 1:1 with alert_type — the four data/ops types collapse
// into one group), and the order the groups render in.
const GROUP_OF = {
  rsvp_shortfall: 'RSVP shortfall',
  briefing_overdue: 'Briefing overdue',
  location_unassigned: 'Data & operations',
  opponent_unassigned: 'Data & operations',
  payment_overdue: 'Data & operations',
  data_integrity_event_location_missing: 'Data & operations',
};
const GROUP_ORDER = ['RSVP shortfall', 'Briefing overdue', 'Data & operations', 'Other alerts'];

export function alertLabel(typeKey, instanceKey) {
  return LABELS[`${typeKey}|${instanceKey || ''}`] || { label: typeKey || 'Alert', summary: '' };
}

export function alertGroup(typeKey) {
  return GROUP_OF[typeKey] || 'Other alerts';
}

// 'warn' | 'crit' | 'info' from threshold_config.severity, else default_severity.
export function alertSeverity(thresholdConfig, defaultSeverity) {
  const sev = thresholdConfig?.severity || defaultSeverity || 'warning';
  if (sev === 'critical') return 'crit';
  if (sev === 'info') return 'info';
  return 'warn';
}

// configs are pre-ordered by evaluation_order (the hook does the order). Returns
// [{ title, rows }] in GROUP_ORDER, within-group order preserved.
export function groupAlerts(configs) {
  const byGroup = {};
  for (const c of configs) {
    const g = alertGroup(c.type_key);
    (byGroup[g] || (byGroup[g] = [])).push(c);
  }
  return GROUP_ORDER.filter((g) => byGroup[g]).map((g) => ({ title: g, rows: byGroup[g] }));
}
