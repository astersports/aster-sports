// Pure shapers for the coach home. Keep CoachHomePage + useCoachNeedsYou thin.

const ALERT_LABELS = {
  rsvp_shortfall: 'RSVP shortfall',
  opponent_unassigned: 'Opponent needs assigning',
  location_unassigned: 'Location needs assigning',
  data_integrity_event_location_missing: 'Event location missing',
  payment_overdue: 'Payments overdue',
  briefing_overdue: 'Briefing ready to send',
};

// Map a firing alert ({ config_id, alert_type_key, severity, data }) to a
// NeedsYou generic ActionRow item. Title from the type label, subtitle from
// the affected-event count. Avoids duplicating AlertCard's internals — the
// coach NeedsYou only needs a tap-through summary row.
// Per-kind labels for the grouped "Action queue" item (coach + admin).
const QUEUE_LABELS = {
  score_unpublished: ['unpublished score', 'unpublished scores'],
  achievement_pending: ['pending achievement', 'pending achievements'],
  unscored_game: ['game needs a score', 'games need scores'],
  pending_invitation: ['pending invite', 'pending invites'],
};

// Summarize the action queue into one subtitle ("2 games need scores ·
// 1 pending invite") — the grouped-by-domain treatment (R-c).
export function summarizeActionQueue(items) {
  const counts = {};
  for (const it of items || []) counts[it.kind] = (counts[it.kind] || 0) + 1;
  return Object.entries(counts)
    .map(([kind, n]) => {
      const lbl = QUEUE_LABELS[kind] || [kind, kind];
      return `${n} ${n === 1 ? lbl[0] : lbl[1]}`;
    })
    .join(' · ');
}

export function alertToActionItem(alert) {
  const label = ALERT_LABELS[alert.alert_type_key] || alert.alert_type_key;
  const n = (alert.data?.events?.length || 0) + (alert.data?.tournaments?.length || 0);
  return {
    domain: 'generic',
    id: `alert-${alert.config_id}`,
    // HOME_RENDERS alert rows read "{label} · {N events}" on one line.
    primary: n ? `${label} · ${n} event${n !== 1 ? 's' : ''}` : label,
    to: '/schedule',
    // Severity drives the act-now treatment (amber/red rail + icon) in
    // ActionRow — D-B. critical → danger, warning → amber, else neutral.
    severity: alert.severity || 'warning',
  };
}
