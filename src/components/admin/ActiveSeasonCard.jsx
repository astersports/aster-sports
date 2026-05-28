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
          backgroundColor: 'var(--em-bg-card)',
          borderRadius: 10,
          border: '1px solid var(--em-border-default)',
          boxShadow: 'var(--em-shadow-sm)',
        }}
      >
        <div style={{ color: 'var(--em-text-secondary)', fontSize: 15, marginBottom: 8 }}>
          No active season
        </div>
        <Link
          to="/admin/seasons"
          className="inline-flex items-center em-press font-semibold"
          style={{
            minHeight: 44, padding: '0 16px', borderRadius: 10,
            backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15,
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
      className="block p-4 em-press"
      style={{
        backgroundColor: 'var(--em-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)',
        color: 'inherit',
      }}
    >
      <div style={{ color: 'var(--em-text-secondary)', fontSize: 13, marginBottom: 10 }}>
        {formatDateFull(season.start_date)} – {formatDateFull(season.end_date)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
        <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--em-bg-tertiary)" strokeWidth="3" />
          <circle
            cx="24" cy="24" r="20" fill="none"
            stroke="var(--em-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct)}`}
            style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
          />
          <text
            x="24" y="24"
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: 11,
              fontWeight: 700,
              fill: 'var(--em-text-primary)',
              transform: 'rotate(90deg)',
              transformOrigin: '24px 24px',
            }}
          >
            {Math.round(pct * 100)}%
          </text>
        </svg>
        <div>
          <div className="font-semibold" style={{ color: 'var(--em-text-primary)', fontSize: 15 }}>
            Week {weekIdx} of {totalWeeks}
          </div>
          <div style={{ color: 'var(--em-text-tertiary)', fontSize: 13 }}>
            {Math.round(pct * 100)}% complete
          </div>
        </div>
      </div>
    </Link>
  );
}
