// Five-cell stats card on TeamDetailPage. Mirrors TeamHeaderCard's
// three-cell stats row pattern, scaled to five (PPG / Allowed / Diff /
// Win% / Games). Pure presentational; summary comes from the page,
// which calls useTeamRecords once.
import { formatDiff } from '../../lib/formatters';

function Cell({ value, label }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div className="font-bold" style={{ fontSize: 18, color: 'var(--em-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

export default function TeamRecordsSection({ summary, loading }) {
  const v = (n) => (loading ? '—' : n);
  return (
    <section style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 8 }}>
        SEASON STATS
      </div>
      <div style={{
        backgroundColor: 'var(--em-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)',
        padding: '14px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        <Cell value={v(summary.ppg)} label="PPG" />
        <Cell value={v(summary.allowed)} label="Allowed" />
        <Cell value={v(formatDiff(summary.diff))} label="Diff" />
        <Cell value={v(`${summary.winPct}%`)} label="Win %" />
        <Cell value={v(summary.gamesPlayed)} label="Games" />
      </div>
    </section>
  );
}
