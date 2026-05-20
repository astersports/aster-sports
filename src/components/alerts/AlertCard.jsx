// Tier 3 v1 PR 3 — renders a single firing alert.
//
// Consumes a firing-alert object from evaluateAlerts() (PR 2). Uses
// severity tokens (PR 3) for visual treatment. Body shape is
// alert-type-specific; per-type body content lives in a small inline
// switch here for v1 (8 alert kinds). Future v2+ could extract per-
// type body renderers if the inline grows past tractable.

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { tokensForSeverity } from '../../lib/alerts/severityTokens';

const ICONS = { AlertCircle, AlertTriangle, Info };

function alertTitle(alert) {
  switch (alert.alert_type_key) {
    case 'rsvp_shortfall': return alert.instance_key === 'saturday_6am' ? 'Roster shortfall today' : 'RSVP shortfall';
    case 'briefing_overdue': return alert.instance_key === 'tournament_prelim' ? 'Tournament prelim briefing overdue' : 'Weekly briefing overdue';
    case 'location_unassigned': return 'Event missing location';
    case 'opponent_unassigned': return 'Event missing opponent';
    case 'payment_overdue': return 'Payments overdue';
    case 'data_integrity_event_location_missing': return 'Event location data broken';
    default: return alert.alert_type_key;
  }
}

function alertBody(alert) {
  const d = alert.data || {};
  switch (alert.alert_type_key) {
    case 'rsvp_shortfall': return `${d.affected_count || 0} event${(d.affected_count || 0) === 1 ? '' : 's'} affected`;
    case 'briefing_overdue': return d.tournaments ? `${d.tournaments.length} upcoming` : `Expected by ${d.expected_send_by || 'usual window'}`;
    case 'location_unassigned': return `${(d.events || []).length} event${(d.events || []).length === 1 ? '' : 's'}${d.critical_count ? ` · ${d.critical_count} <24h` : ''}`;
    case 'opponent_unassigned': return `${(d.events || []).length} event${(d.events || []).length === 1 ? '' : 's'}${d.critical_count ? ` · ${d.critical_count} <24h` : ''}`;
    case 'payment_overdue': {
      const dollars = ((d.total_outstanding_cents || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      return `${dollars} across ${d.family_count || 0} famil${(d.family_count || 0) === 1 ? 'y' : 'ies'}`;
    }
    case 'data_integrity_event_location_missing': return `${d.count || 0} event${(d.count || 0) === 1 ? '' : 's'} missing location data`;
    default: return '';
  }
}

export default function AlertCard({ alert }) {
  const tokens = tokensForSeverity(alert.severity);
  const Icon = ICONS[tokens.icon] || Info;
  return (
    <div role="alert" aria-label={`${tokens.ariaLabel}: ${alertTitle(alert)}`}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 14px', borderRadius: 10,
        backgroundColor: tokens.bg, border: `1px solid ${tokens.border}`,
      }}>
      <Icon size={18} strokeWidth={1.75} color={tokens.text} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: tokens.text, marginBottom: 2 }}>{alertTitle(alert)}</div>
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', lineHeight: 1.4 }}>{alertBody(alert)}</div>
      </div>
    </div>
  );
}
