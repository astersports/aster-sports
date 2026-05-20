import { Car } from 'lucide-react';
import Label from '../shared/Label';

// HOME_DESIGN_SPEC + RIDES_DESIGN_SPEC §6 — admin home Rides Today
// widget. Hides entirely when no rides-enabled events scheduled today.
//
// Spec layout:
//   RIDES TODAY: N events · X% avg coverage
//   Per-team breakdown rows
//   [Send program broadcast]  ← deferred to follow-up (needs broadcast
//                               flow + audience-picker integration)

function CoverageBar({ pct }) {
  const safe = Math.max(0, Math.min(100, pct || 0));
  const color = safe >= 80 ? 'var(--em-success)' : safe >= 50 ? 'var(--em-warning)' : 'var(--em-danger)';
  return (
    <div
      style={{
        height: 4,
        borderRadius: 2,
        backgroundColor: 'var(--em-bg-secondary)',
        overflow: 'hidden',
      }}
      aria-label={`Coverage ${safe} percent`}
    >
      <div style={{ height: '100%', width: `${safe}%`, backgroundColor: color, borderRadius: 2 }} />
    </div>
  );
}

export default function RidesTodayCard({ summary, loading }) {
  if (loading) return null;
  if (!summary || summary.eventCount === 0) return null;

  const { eventCount, coveragePct, totalSeatsOffered, totalSeatsClaimed, byTeam } = summary;
  const headlinePct = coveragePct === null ? '—' : `${coveragePct}%`;
  const eventLabel = eventCount === 1 ? '1 event' : `${eventCount} events`;
  const seatsLabel = totalSeatsOffered === 0 ? 'no offers' : `${totalSeatsClaimed}/${totalSeatsOffered} seats claimed`;

  return (
    <section className="min-w-0" aria-label="Rides today">
      <Label>RIDES TODAY</Label>
      <div
        style={{
          backgroundColor: 'var(--em-bg-card)',
          borderRadius: 10,
          border: '1px solid var(--em-border-default)',
          boxShadow: 'var(--em-shadow-sm)',
          padding: '12px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Car size={18} strokeWidth={1.75} color="var(--em-text-tertiary)" aria-hidden="true" />
          <div style={{ fontSize: 13, color: 'var(--em-text-primary)', fontWeight: 600 }}>
            {eventLabel} · {headlinePct} avg coverage
          </div>
          <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', marginLeft: 'auto' }}>
            {seatsLabel}
          </div>
        </div>
        {byTeam.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {byTeam.map((t) => (
              <div key={t.teamId}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: t.teamColor || 'var(--em-text-primary)', fontWeight: 500 }}>{t.teamName}</span>
                  <span style={{ color: 'var(--em-text-tertiary)' }}>
                    {t.coveragePct === null ? '—' : `${t.coveragePct}%`} · {t.claimed}/{t.offered} seats
                  </span>
                </div>
                <CoverageBar pct={t.coveragePct} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
