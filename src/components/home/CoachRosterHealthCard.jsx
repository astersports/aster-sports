import { ClipboardCheck } from 'lucide-react';

// CoachRosterHealthCard — attendance summary for the coach's teams (D-B).
// Empty state is a productive nudge that drives Start Check-In adoption (the
// only honest source of attendance — never synthesized). Once check_ins
// exist, it shows the logged count. Presentational; onStartCheckIn navigates.
const LABEL = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--as-text-meta)', marginBottom: 8, padding: '0 2px',
};
const CARD = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderTop: '3px solid var(--as-accent)', borderRadius: 12, boxShadow: 'var(--as-shadow-sm)',
  padding: 14, display: 'flex', alignItems: 'center', gap: 11,
};

export default function CoachRosterHealthCard({ hasData, checkInCount, loading, onStartCheckIn }) {
  if (loading) return null;
  return (
    <section className="min-w-0" aria-label="Roster health">
      <div style={LABEL}>Roster health</div>
      <button
        type="button"
        onClick={onStartCheckIn}
        className="as-press"
        style={{ ...CARD, width: '100%', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
        aria-label={hasData ? `${checkInCount} check-ins logged` : 'Start Check-In to track attendance'}
      >
        <span style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', flexShrink: 0, backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)' }}>
          <ClipboardCheck size={18} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {hasData ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' }}>{checkInCount} check-in{checkInCount === 1 ? '' : 's'} logged</div>
              <div style={{ fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 2 }}>Attendance is tracking across your teams.</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--as-text-primary)' }}>No attendance logged yet</div>
              <div style={{ fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 2 }}>Start Check-In at your next event to track this.</div>
            </>
          )}
        </div>
      </button>
    </section>
  );
}
