import { Wallet } from 'lucide-react';

// CoachCompCard — the coach's "Your pay" context card (D-A). Reads
// useCoachComp (coach_payouts). Hidden when the coach has no payouts (no
// per-session rate) so directors don't see an empty $0 card. Presentational.
const LABEL = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--as-text-meta)', marginBottom: 8, padding: '0 2px',
};
const CARD = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderTop: '3px solid var(--as-accent)', borderRadius: 12, boxShadow: 'var(--as-shadow-sm)',
  padding: 14, display: 'flex', alignItems: 'center', gap: 11,
};
const dollars = (cents) => `$${Math.round((cents || 0) / 100).toLocaleString()}`;

export default function CoachCompCard({ owedCents, paidCents, pendingSessions, hasComp, loading }) {
  if (loading || !hasComp) return null;
  return (
    <section className="min-w-0" aria-label="Your pay">
      <div style={LABEL}>Your pay</div>
      <div style={CARD}>
        <span style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', flexShrink: 0, backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)' }}>
          <Wallet size={18} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)' }}>
            {owedCents > 0 ? `You're owed ${dollars(owedCents)}` : 'All paid up'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 2 }}>
            {owedCents > 0 ? `${pendingSessions} session${pendingSessions === 1 ? '' : 's'} pending · ` : ''}{dollars(paidCents)} paid this season
          </div>
        </div>
      </div>
    </section>
  );
}
