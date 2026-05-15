// Wave 5 PR 2 — Step 2 UI: per-row inline edit table with status
// indicators. Three-severity (error/warning/info) per scope read
// flagged-item #3 + dedup labels (new/updated/duplicate) per
// flagged-item #2.

import { useMemo } from 'react';

const STATUS_STYLES = {
  valid:   { bg: '#fff', border: '1px solid var(--em-border-default)' },
  warning: { bg: 'var(--em-warning-soft)', border: '1px solid var(--em-warning)' },
  error:   { bg: 'var(--em-danger-soft)', border: '1px solid var(--em-danger)' },
};
const DEDUP_BADGES = {
  new:       { text: 'NEW', color: 'var(--em-success)', bg: 'var(--em-success-soft)' },
  updated:   { text: 'UPDATED', color: 'var(--em-warning)', bg: 'var(--em-warning-soft)' },
  duplicate: { text: 'DUP (will skip)', color: 'var(--em-text-tertiary)', bg: 'var(--em-bg-tertiary)' },
};
const inputStyle = { width: '100%', minHeight: 32, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--em-border-default)', backgroundColor: '#fff', fontSize: 13, fontFamily: 'inherit' };
const cellStyle = { padding: 6, verticalAlign: 'top', fontSize: 13 };

function StatusBadge({ status }) {
  if (status === 'valid') return <span style={{ fontSize: 11, color: 'var(--em-success)' }}>✓</span>;
  if (status === 'warning') return <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-warning)' }}>⚠</span>;
  return <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--em-danger)' }}>✗</span>;
}

function DedupBadge({ dedup }) {
  const cfg = DEDUP_BADGES[dedup];
  if (!cfg) return null;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, color: cfg.color, backgroundColor: cfg.bg, letterSpacing: '0.5px' }}>{cfg.text}</span>;
}

export default function PreviewTable({ rows, validation, dedup, canCommit, onUpdateRow, onRemoveRow, onCommit, committing }) {
  const summary = useMemo(() => `${validation.valid} valid · ${validation.warning} warnings · ${validation.error} errors  |  ${dedup.new} new · ${dedup.updated} updated · ${dedup.duplicate} duplicate`, [validation, dedup]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ padding: 12, backgroundColor: 'var(--em-bg-card)', borderRadius: 8, marginBottom: 16, fontSize: 14, color: 'var(--em-text-primary)' }}>{summary}</div>

      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
        <thead>
          <tr style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--em-text-tertiary)' }}>
            <th style={{ padding: 6, textAlign: 'left', width: 32 }}>•</th>
            <th style={{ padding: 6, textAlign: 'left' }}>Team</th>
            <th style={{ padding: 6, textAlign: 'left' }}>Date</th>
            <th style={{ padding: 6, textAlign: 'left' }}>Time</th>
            <th style={{ padding: 6, textAlign: 'left' }}>Opponent</th>
            <th style={{ padding: 6, textAlign: 'left' }}>Venue</th>
            <th style={{ padding: 6, textAlign: 'left' }}>Court</th>
            <th style={{ padding: 6, textAlign: 'left' }}>Status</th>
            <th style={{ padding: 6, textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ ...STATUS_STYLES[r.status], borderRadius: 6 }}>
              <td style={cellStyle}><StatusBadge status={r.status} /></td>
              <td style={cellStyle}><input value={r.team} onChange={(e) => onUpdateRow(i, { team: e.target.value })} style={inputStyle} /></td>
              <td style={cellStyle}><input value={r.date} onChange={(e) => onUpdateRow(i, { date: e.target.value })} style={{ ...inputStyle, width: 80 }} placeholder="5/16" /></td>
              <td style={cellStyle}><input value={r.time} onChange={(e) => onUpdateRow(i, { time: e.target.value })} style={{ ...inputStyle, width: 100 }} placeholder="11:00 AM" /></td>
              <td style={cellStyle}><input value={r.opponent} onChange={(e) => onUpdateRow(i, { opponent: e.target.value })} style={inputStyle} /></td>
              <td style={cellStyle}><input value={r.venue} onChange={(e) => onUpdateRow(i, { venue: e.target.value })} style={inputStyle} /></td>
              <td style={cellStyle}><input value={r.court} onChange={(e) => onUpdateRow(i, { court: e.target.value })} style={{ ...inputStyle, width: 80 }} /></td>
              <td style={cellStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <DedupBadge dedup={r.dedup} />
                  {r.messages?.length > 0 && (<div style={{ fontSize: 11, color: 'var(--em-text-secondary)' }}>{r.messages.join('; ')}</div>)}
                </div>
              </td>
              <td style={{ ...cellStyle, textAlign: 'right' }}>
                <button type="button" onClick={() => onRemoveRow(i)} className="sf-press"
                  style={{ minHeight: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--em-border-default)', backgroundColor: '#fff', color: 'var(--em-text-secondary)', fontSize: 12, cursor: 'pointer' }}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
        <button type="button" onClick={onCommit} disabled={!canCommit || committing} className="sf-press"
          style={{ minHeight: 44, padding: '0 24px', borderRadius: 10, border: 'none', backgroundColor: canCommit ? 'var(--em-accent)' : 'var(--em-bg-tertiary)', color: canCommit ? 'var(--em-text-inverse)' : 'var(--em-text-tertiary)', fontSize: 15, fontWeight: 600, cursor: canCommit ? 'pointer' : 'not-allowed' }}>
          {committing ? 'Committing…' : `Commit ${dedup.new + dedup.updated} events`}
        </button>
      </div>
    </div>
  );
}
