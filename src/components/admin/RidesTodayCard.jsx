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
  const color = safe >= 80 ? 'var(--as-success)' : safe >= 50 ? 'var(--as-warning)' : 'var(--as-danger)';
  return (
    <div
      style={{
        height: 4,
        borderRadius: 2,
        backgroundColor: 'var(--as-bg-secondary)',
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

  // PR #338 — arrival/return split per RIDES_DESIGN_SPEC §5/§6.
  // Headline shows event count + the lower of the two coverage
  // percentages (the gap is where families are unmatched). Detail
  // rows show separate bars for arrival vs return per team.
  const { eventCount, totalSeatsOffered, totalSeatsClaimed, byTeam, arrival, return: ret } = summary;
  // 2026-05-20 — when both arrival + return have no offers, headline
  // used to render literal "— avg coverage" which read as broken UI.
  // hasAnyCoverage gates the suffix entirely so the headline drops to
  // just "N events" and the right-side chip carries "no offers yet".
  const hasAnyCoverage = arrival.coveragePct !== null || ret.coveragePct !== null;
  const headlinePct = (() => {
    if (!hasAnyCoverage) return null;
    if (arrival.coveragePct === null) return `${ret.coveragePct}%`;
    if (ret.coveragePct === null) return `${arrival.coveragePct}%`;
    return `${Math.min(arrival.coveragePct, ret.coveragePct)}%`;
  })();
  const eventLabel = eventCount === 1 ? '1 event' : `${eventCount} events`;
  const seatsLabel = totalSeatsOffered === 0 ? 'no offers yet' : `${totalSeatsClaimed}/${totalSeatsOffered} seats`;

  return (
    <section className="min-w-0" aria-label="Rides today">
      <Label>RIDES TODAY</Label>
      <div
        style={{
          backgroundColor: 'var(--as-bg-card)',
          borderRadius: 10,
          border: '1px solid var(--as-border-default)',
          boxShadow: 'var(--as-shadow-sm)',
          padding: '12px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Car size={18} strokeWidth={1.75} color="var(--as-text-tertiary)" aria-hidden="true" />
          <div style={{ fontSize: 13, color: 'var(--as-text-primary)', fontWeight: 600 }}>
            {eventLabel}{headlinePct ? ` · ${headlinePct} avg coverage` : ''}
          </div>
          <div style={{ fontSize: 12, color: 'var(--as-text-tertiary)', marginLeft: 'auto' }}>
            {seatsLabel}
          </div>
        </div>
        {byTeam.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byTeam.map((t) => (
              <div key={t.teamId}>
                <div style={{ fontSize: 12, color: t.teamColor || 'var(--as-text-primary)', fontWeight: 500, marginBottom: 4 }}>
                  {t.teamName}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--as-text-tertiary)', marginBottom: 2 }}>
                      <span>Arrival</span>
                      <span>{t.arrival.coveragePct === null ? '—' : `${t.arrival.coveragePct}%`}</span>
                    </div>
                    <CoverageBar pct={t.arrival.coveragePct} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--as-text-tertiary)', marginBottom: 2 }}>
                      <span>Return</span>
                      <span>{t.return.coveragePct === null ? '—' : `${t.return.coveragePct}%`}</span>
                    </div>
                    <CoverageBar pct={t.return.coveragePct} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
