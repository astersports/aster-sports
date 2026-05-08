import { Check, ChevronRight } from 'lucide-react';
import { messageTypeLabel } from '../../lib/inferMessageType';

const URGENCY_COLOR = {
  red:    'var(--em-danger)',
  amber:  'var(--em-warning)',
  normal: 'var(--em-text-tertiary)',
  sent:   'var(--em-success)',
  post:   'var(--em-info)',
};

function relativeFromNow(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor(ms / 3600000);
  if (days >= 1) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (hours >= 1) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return 'just now';
}

function statusText(row) {
  if (row.status === 'sent') {
    const label = messageTypeLabel(row.inferredType).toLowerCase();
    return `${label} sent ${relativeFromNow(row.lastSentAt)}`;
  }
  if (row.urgency === 'post') {
    const label = messageTypeLabel(row.inferredType).toLowerCase();
    return `${label} pending`;
  }
  if (row.urgency === 'red') return 'URGENT · less than 24h';
  if (row.urgency === 'amber') {
    const days = Math.max(0, Math.ceil(row.daysUntilStart));
    return `needs briefing · ${days} day${days === 1 ? '' : 's'}`;
  }
  return 'needs briefing';
}

export default function BriefingRow({ row, onOpen }) {
  const isSent = row.status === 'sent';
  const dotColor = URGENCY_COLOR[row.urgency] || URGENCY_COLOR.normal;
  const eventLabel = `${row.event_count} game${Number(row.event_count) === 1 ? '' : 's'}`;

  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className="sf-press"
      aria-label={`Open briefing for ${row.team_name} at ${row.tournament_name}`}
      style={{
        width: '100%',
        minHeight: 56,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'var(--em-bg-card)',
        border: '1px solid var(--em-border-subtle)',
        borderLeft: `4px solid ${row.team_color || 'var(--em-border-default)'}`,
        borderRadius: 10,
        boxShadow: 'var(--em-shadow-sm)',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flex: 'none',
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: isSent ? 'var(--em-success-soft)' : dotColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isSent && <Check size={14} strokeWidth={2.25} color="var(--em-success)" />}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)' }}>
          {row.team_name}
          <span style={{ fontWeight: 400, color: 'var(--em-text-tertiary)', marginLeft: 6 }}>
            · {eventLabel}
          </span>
        </div>
        <div style={{ fontSize: 12, color: isSent ? 'var(--em-success)' : 'var(--em-text-secondary)', marginTop: 2 }}>
          {statusText(row)}
        </div>
      </div>

      <ChevronRight size={18} strokeWidth={1.75} style={{ color: 'var(--em-text-tertiary)', flex: 'none' }} aria-hidden="true" />
    </button>
  );
}
