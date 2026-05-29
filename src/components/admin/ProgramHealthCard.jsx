import { useAuth } from '../../context/AuthContext';
import { useProgramHealthMetrics } from '../../hooks/useProgramHealthMetrics';
import Label from '../shared/Label';

// HOME_DESIGN_SPEC §3.1.5 — admin program health card.
//
// v1 (PR #307): Season progress + Payment collection.
// v2 (PR #311): adds RSVP rate, Attendance, Registration pipeline.
// v3 (2026-05-20, Frank-reported): Attendance row replaced by
//   "Active teams" — attendance had been rendering '—' because no
//   check-ins have been recorded; a static team count is a more
//   honest program-health signal at this org's scale.
//
// Per anti-pattern #42: payment slice flows through
// useProgramHealthMetrics → useSeasonFinancials (same source as
// KPI grid + admin home lane + parent reminder + financial dashboard).
// Hide entirely when no active season.

function seasonProgress(season, nowMs) {
  if (!season?.start_date || !season?.end_date) return null;
  const start = new Date(season.start_date).getTime();
  const end = new Date(season.end_date).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  const totalMs = end - start;
  const elapsedMs = Math.max(0, Math.min(nowMs - start, totalMs));
  const pct = Math.round((elapsedMs / totalMs) * 100);
  const totalWeeks = Math.max(1, Math.ceil(totalMs / (7 * 24 * 60 * 60 * 1000)));
  const currentWeek = Math.min(totalWeeks, Math.floor(elapsedMs / (7 * 24 * 60 * 60 * 1000)) + 1);
  return { pct, currentWeek, totalWeeks };
}

// Wave 2.B post-#570 fix: inline shape-matched pulse for metric values
// during the useProgramHealthMetrics load window. Without this the row
// renders the hook's default-state placeholders (paymentPct=0,
// rsvpPct=null→'—', activeTeamsCount=0→'0 teams', etc.) which read as
// "the org has no data" rather than "data is loading." Matches the
// LoadingSkeleton.Bar shape: --em-bg-tertiary + em-pulse + 6px radius.
function MetricValueSkeleton({ width = 48 }) {
  return (
    <span
      className="em-pulse"
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'var(--em-bg-tertiary)',
        verticalAlign: 'middle',
      }}
    />
  );
}

function MetricRow({ label, value, loading, skeletonWidth }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--em-text-primary)', marginTop: 4 }}>
      <span>{label}</span>
      <span style={{ fontWeight: 600 }}>
        {loading ? <MetricValueSkeleton width={skeletonWidth} /> : value}
      </span>
    </div>
  );
}

export default function ProgramHealthCard({ season, nowMs }) {
  const { orgId } = useAuth();
  const { paymentPct, rsvpPct, activeTeamsCount, newRegistrationsCount, loading } = useProgramHealthMetrics(orgId, season?.id);
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
        <MetricRow label="Payment collection (this season)" value={`${paymentPct}%`} loading={loading} skeletonWidth={40} />
        <MetricRow label="RSVP rate" value={rsvpPct === null ? '—' : `${rsvpPct}%`} loading={loading} skeletonWidth={40} />
        <MetricRow label="Active teams" value={activeTeamsCount === 1 ? '1 team' : `${activeTeamsCount} teams`} loading={loading} skeletonWidth={56} />
        {/* HOME-3: hide when loaded with 0 — for an import-driven org this
            row was permanently "0 new this week" (all accounts share one
            import-day created_at). Show the skeleton while loading. */}
        {(loading || newRegistrationsCount > 0) && (
          <MetricRow label="Registration pipeline" value={newRegistrationsCount === 1 ? '1 new this week' : `${newRegistrationsCount} new this week`} loading={loading} skeletonWidth={96} />
        )}
      </div>
    </section>
  );
}
