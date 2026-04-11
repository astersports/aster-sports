import { Link } from 'react-router-dom';
import { formatDateFull } from '../../lib/formatters';

// Computes week-of-season progress as a 0..1 float. Dates that haven't
// started yet clamp to 0; dates past the end clamp to 1. End dates in the
// same week as today still show the final week count so the UI never
// flips to "Week 0 of 0".
function seasonProgress(start, end) {
  if (!start || !end) return { pct: 0, weekIdx: 0, totalWeeks: 0 };
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  const totalMs = Math.max(e - s, 1);
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const totalWeeks = Math.max(1, Math.round(totalMs / WEEK));
  const elapsed = Math.min(Math.max(now - s, 0), totalMs);
  const weekIdx = Math.min(totalWeeks, Math.max(1, Math.ceil((elapsed / WEEK) || 1)));
  return { pct: elapsed / totalMs, weekIdx, totalWeeks };
}

export default function ActiveSeasonCard({ season }) {
  if (!season) {
    return (
      <div
        className="p-4"
        style={{
          backgroundColor: 'var(--sf-bg-card)',
          borderRadius: 10,
          border: '1px solid var(--sf-border-subtle)',
          boxShadow: 'var(--sf-shadow-sm)',
        }}
      >
        <div style={{ color: 'var(--sf-text-secondary)', fontSize: 14, marginBottom: 8 }}>
          No active season
        </div>
        <Link
          to="/admin/seasons"
          className="inline-flex items-center sf-press font-semibold"
          style={{
            minHeight: 44, padding: '0 16px', borderRadius: 10,
            backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-inverse)', fontSize: 14,
          }}
        >
          Create your first season
        </Link>
      </div>
    );
  }

  const { pct, weekIdx, totalWeeks } = seasonProgress(season.start_date, season.end_date);
  return (
    <Link
      to="/admin/seasons"
      className="block p-4 sf-press"
      style={{
        backgroundColor: 'var(--sf-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--sf-border-subtle)',
        boxShadow: 'var(--sf-shadow-sm)',
        color: 'inherit',
      }}
    >
      <div style={{ color: 'var(--sf-text-secondary)', fontSize: 13, marginBottom: 10 }}>
        {formatDateFull(season.start_date)} – {formatDateFull(season.end_date)}
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="flex justify-between" style={{ fontSize: 13, color: 'var(--sf-text-secondary)', marginBottom: 6 }}>
          <span>{season.name}</span>
          <span>Week {weekIdx} of {totalWeeks}</span>
        </div>
        <div style={{
          position: 'relative',
          height: 2,
          backgroundColor: 'var(--sf-bg-tertiary)',
          borderRadius: 999,
          overflow: 'visible',
        }}>
          <div style={{
            height: 2,
            width: `${Math.max(pct * 100, 1)}%`,
            backgroundColor: 'var(--sf-accent)',
            borderRadius: 999,
            transition: 'width 600ms ease-out',
          }} />
          <div
            className="sf-pulse-dot"
            style={{
              position: 'absolute',
              top: '50%',
              left: `${pct * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--sf-accent)',
              boxShadow: '0 0 6px var(--sf-accent)',
            }}
          />
        </div>
      </div>
    </Link>
  );
}
