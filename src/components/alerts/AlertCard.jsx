// Tier 3 v1 PR 3 — renders a single firing alert.
//
// Consumes a firing-alert object from evaluateAlerts() (PR 2). Uses
// severity tokens (PR 3) for visual treatment. Body shape is
// alert-type-specific; per-type body content lives in a small inline
// switch here for v1 (8 alert kinds). Future v2+ could extract per-
// type body renderers if the inline grows past tractable.
//
// L99 v6 §5.1 B2 follow-up (Frank-reported 2026-05-20 PM, "what are
// they and what can I do to resolve?"): event-bearing alert types
// (location_unassigned, opponent_unassigned, data_integrity_event_
// location_missing) now expand on tap into a per-event list with
// tap-to-edit affordance. Drill-down resolves Frank's "don't
// understand the flow" complaint — the alert names what's wrong, the
// expansion names which events, and the per-row tap routes to the
// event detail page where the field can be set.

import { useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronDown, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tokensForSeverity } from '../../lib/alerts/severityTokens';

const ICONS = { AlertCircle, AlertTriangle, Info };

const EXPANDABLE_TYPES = new Set([
  'location_unassigned',
  'opponent_unassigned',
  'data_integrity_event_location_missing',
]);

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

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

function EventRow({ event, onTap }) {
  const teamName = event.teams?.name || event.team_name || 'Team';
  return (
    <button type="button" onClick={onTap} className="sf-press"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', minHeight: 44, padding: '8px 0', background: 'none', border: 'none', borderTop: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teamName}</div>
        <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>{fmtDate(event.start_at)}</div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--em-accent)', flexShrink: 0 }}>Fix →</span>
    </button>
  );
}

export default function AlertCard({ alert }) {
  const tokens = tokensForSeverity(alert.severity);
  const Icon = ICONS[tokens.icon] || Info;
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const events = alert.data?.events || [];
  const canExpand = EXPANDABLE_TYPES.has(alert.alert_type_key) && events.length > 0;

  return (
    <div role="alert" aria-label={`${tokens.ariaLabel}: ${alertTitle(alert)}`}
      style={{ borderRadius: 10, backgroundColor: tokens.bg, border: `1px solid ${tokens.border}` }}>
      <button type="button"
        onClick={() => canExpand && setExpanded((v) => !v)}
        aria-expanded={canExpand ? expanded : undefined}
        disabled={!canExpand}
        className="sf-press"
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: canExpand ? 'pointer' : 'default', textAlign: 'left' }}>
        <Icon size={18} strokeWidth={1.75} color={tokens.text} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: tokens.text, marginBottom: 2 }}>{alertTitle(alert)}</div>
          <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', lineHeight: 1.4 }}>{alertBody(alert)}</div>
        </div>
        {canExpand && <ChevronDown size={16} strokeWidth={1.75} color={tokens.text} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1, transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 150ms' }} />}
      </button>
      {canExpand && expanded && (
        <div style={{ padding: '0 14px 8px 44px' }}>
          {events.slice(0, 10).map((e) => (
            <EventRow key={e.id} event={e} onTap={() => navigate(`/events/${e.id}?edit=1`)} />
          ))}
          {events.length > 10 && (
            <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', padding: '8px 0 4px' }}>
              … and {events.length - 10} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
