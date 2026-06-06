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
export function alertToActionItem(alert) {
  const label = ALERT_LABELS[alert.alert_type_key] || alert.alert_type_key;
  const n = (alert.data?.events?.length || 0) + (alert.data?.tournaments?.length || 0);
  return {
    domain: 'generic',
    id: `alert-${alert.config_id}`,
    primary: label,
    subtitle: n ? `${n} event${n !== 1 ? 's' : ''}` : null,
    to: '/schedule',
  };
}
