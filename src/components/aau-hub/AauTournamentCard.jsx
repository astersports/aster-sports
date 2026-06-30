// A single tournament row in the no-login Hub directory (R1·PR-A).
// Pure presentational — receives one element of get_public_tournament_directory().
// Cosmetic only: --as-* tokens, no hardcoded hex, 44px+ tap target.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Format a YYYY-MM-DD (date-only) string without timezone drift — parse the
// parts directly rather than `new Date(str)` (which treats it as UTC midnight
// and can render the prior day in NY).
function fmtDay(ymd) {
  if (!ymd || typeof ymd !== 'string') return '';
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${MONTHS[m - 1]} ${d}`;
}

function dateRange(start, end) {
  const s = fmtDay(start);
  const e = fmtDay(end);
  if (s && e) return s === e ? s : `${s} – ${e}`;
  return s || e || 'Dates TBD';
}

export default function AauTournamentCard({ tournament }) {
  const { name, circuit, states, start_date, end_date, divisions } = tournament || {};
  const stateList = Array.isArray(states) ? states.filter(Boolean) : [];
  const divisionCount = Array.isArray(divisions) ? divisions.length : 0;

  const meta = [
    circuit,
    stateList.length ? stateList.join(', ') : null,
    divisionCount ? `${divisionCount} division${divisionCount !== 1 ? 's' : ''}` : null,
  ].filter(Boolean);

  return (
    <article
      style={{
        backgroundColor: 'var(--as-bg-card)',
        border: '1px solid var(--as-border-default)',
        borderRadius: 10,
        boxShadow: 'var(--as-shadow-sm)',
        padding: 16,
        minHeight: 44,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--as-text-primary)', margin: 0 }}>
          {name || 'Untitled tournament'}
        </h2>
        <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)' }}>
          {dateRange(start_date, end_date)}
        </span>
      </div>
      {meta.length > 0 && (
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--as-text-tertiary)' }}>
          {meta.join(' · ')}
        </p>
      )}
    </article>
  );
}
