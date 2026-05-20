import Label from '../shared/Label';

// HOME_DESIGN_SPEC §3.1.5 — admin program health card. v1 metrics:
//   - Season progress (Week X of Y + progress bar)
//   - Payment collection % (from useSeasonFinancials.stats.pct)
//
// Deferred to follow-ups (each needs new data wiring):
//   - Attendance % (check-ins / arrivals workflow not fully wired)
//   - RSVP rate (different aggregation than payment collection)
//   - Registration pipeline (new registrations count)
//
// Hide entirely when no active season.
//
// Per anti-pattern #42: receives pct as prop from useAdminStats's
// extended return — single useSeasonFinancials call across admin
// home, not a parallel fetch from inside this component.

function seasonProgress(season, nowMs) {
  if (!season?.start_date || !season?.end_date) return null;
  const start = new Date(season.start_date).getTime();
  const end = new Date(season.end_date).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  const totalMs = end - start;
  const elapsedMs = Math.max(0, Math.min(nowMs - start, totalMs));
  const pct = Math.round((elapsedMs / totalMs) * 100);
  // Weeks: integer division, both numerator and denominator. Cap
  // current week at total weeks (season can run past end_date).
  const totalWeeks = Math.max(1, Math.ceil(totalMs / (7 * 24 * 60 * 60 * 1000)));
  const currentWeek = Math.min(totalWeeks, Math.floor(elapsedMs / (7 * 24 * 60 * 60 * 1000)) + 1);
  return { pct, currentWeek, totalWeeks };
}

export default function ProgramHealthCard({ season, paymentPct, nowMs }) {
  if (!season) return null;
  const progress = seasonProgress(season, nowMs);
  if (!progress) return null;

  return (
    <section className="min-w-0" aria-label="Program health">
      <Label>PROGRAM HEALTH</Label>
      <div
        style={{
          backgroundColor: 'var(--em-bg-card)',
          borderRadius: 10,
          border: '1px solid var(--em-border-default)',
          boxShadow: 'var(--em-shadow-sm)',
          padding: '12px 14px',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginBottom: 4 }}>
          {season.name} · Week {progress.currentWeek} of {progress.totalWeeks}
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'var(--em-bg-secondary)',
            overflow: 'hidden',
            marginBottom: 10,
          }}
          aria-label={`Season progress ${progress.pct} percent`}
        >
          <div
            style={{
              height: '100%',
              width: `${progress.pct}%`,
              backgroundColor: 'var(--em-accent)',
              borderRadius: 3,
              transition: 'width 200ms ease-out',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--em-text-primary)' }}>
          <span>Payment collection</span>
          <span style={{ fontWeight: 600 }}>{paymentPct}%</span>
        </div>
      </div>
    </section>
  );
}
