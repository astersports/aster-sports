import { rsvpBreakdown } from '../../lib/rsvpEligibility';

export default function RsvpSummary({ roster, rsvps }) {
  const total = roster.length;
  if (total === 0) return null;

  const { going, maybe, out: notGoing, noReply: noResponse } = rsvpBreakdown(rsvps, roster);

  const pct = (n) => Math.round((n / total) * 100);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Colored bar */}
      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
        {going > 0 && <div style={{ width: `${pct(going)}%`, backgroundColor: 'var(--as-success)' }} />}
        {maybe > 0 && <div style={{ width: `${pct(maybe)}%`, backgroundColor: 'var(--as-warning)' }} />}
        {notGoing > 0 && <div style={{ width: `${pct(notGoing)}%`, backgroundColor: 'var(--as-danger)' }} />}
        {noResponse > 0 && <div style={{ width: `${pct(noResponse)}%`, backgroundColor: 'var(--as-neutral)' }} />}
      </div>
      {/* Counts */}
      <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--as-text-secondary)', flexWrap: 'wrap' }}>
        <span><strong style={{ color: 'var(--as-success)' }}>{going}</strong> Going</span>
        {maybe > 0 && <span><strong style={{ color: 'var(--as-warning)' }}>{maybe}</strong> Maybe</span>}
        <span><strong style={{ color: 'var(--as-danger)' }}>{notGoing}</strong> Not Going</span>
        <span><strong style={{ color: 'var(--as-neutral)' }}>{noResponse}</strong> No Response</span>
      </div>
    </div>
  );
}
