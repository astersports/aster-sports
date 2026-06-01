// Wave 5 PR 2 — mobile card layout for schedule import preview.
// One stacked card per row; replaces the desktop table on viewports
// <720px where the 9-column table is unreadable on portrait phones.

const STATUS_STYLES = {
  valid:   { background: '#fff', borderColor: 'var(--as-border-default)' },
  warning: { background: 'var(--as-warning-soft)', borderColor: 'var(--as-warning)' },
  error:   { background: 'var(--as-danger-soft)', borderColor: 'var(--as-danger)' },
};
const DEDUP_BADGES = {
  new:       { text: 'NEW', color: 'var(--as-success)', bg: 'var(--as-success-soft)' },
  updated:   { text: 'UPDATED', color: 'var(--as-warning)', bg: 'var(--as-warning-soft)' },
  duplicate: { text: 'DUP', color: 'var(--as-text-tertiary)', bg: 'var(--as-bg-tertiary)' },
};
const inputStyle = { width: '100%', minHeight: 40, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--as-border-default)', backgroundColor: '#fff', fontSize: 15, fontFamily: 'inherit' };
const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', marginBottom: 4, display: 'block' };

function StatusGlyph({ status }) {
  if (status === 'valid') return <span style={{ fontSize: 13, color: 'var(--as-success)' }}>✓ valid</span>;
  if (status === 'warning') return <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-warning)' }}>⚠ warning</span>;
  return <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--as-danger)' }}>✗ error</span>;
}

function DedupBadge({ dedup }) {
  const cfg = DEDUP_BADGES[dedup];
  if (!cfg) return null;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, color: cfg.color, backgroundColor: cfg.bg, letterSpacing: '0.5px' }}>{cfg.text}</span>;
}

export default function PreviewMobileCards({ rows, teamNames, onUpdateRow, onRemoveRow }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r, i) => {
        const s = STATUS_STYLES[r.status];
        return (
          <div key={i} style={{ backgroundColor: s.background, border: `1px solid ${s.borderColor}`, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <StatusGlyph status={r.status} />
              <DedupBadge dedup={r.dedup} />
            </div>
            <div>
              <label style={labelStyle}>Team</label>
              <select value={r.team || ''} onChange={(e) => onUpdateRow(i, { team: e.target.value })} style={inputStyle}>
                <option value="">Select…</option>
                {teamNames.map((n) => <option key={n} value={n}>{n}</option>)}
                {r.team && !teamNames.includes(r.team) && <option value={r.team}>{r.team} (unmatched)</option>}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Date</label>
                <input value={r.date} onChange={(e) => onUpdateRow(i, { date: e.target.value })} style={inputStyle} placeholder="5/16" />
              </div>
              <div style={{ flex: 1.2 }}>
                <label style={labelStyle}>Time</label>
                <input value={r.time} onChange={(e) => onUpdateRow(i, { time: e.target.value })} style={inputStyle} placeholder="11:00 AM" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Opponent</label>
              <input value={r.opponent} onChange={(e) => onUpdateRow(i, { opponent: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Venue</label>
                <input value={r.venue} onChange={(e) => onUpdateRow(i, { venue: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Court</label>
                <input value={r.court} onChange={(e) => onUpdateRow(i, { court: e.target.value })} style={inputStyle} />
              </div>
            </div>
            {r.messages?.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--as-text-secondary)' }}>{r.messages.join('; ')}</div>
            )}
            <button type="button" onClick={() => onRemoveRow(i)} className="as-press"
              style={{ alignSelf: 'flex-end', minHeight: 36, padding: '0 14px', borderRadius: 8, border: '1px solid var(--as-border-default)', backgroundColor: '#fff', color: 'var(--as-text-secondary)', fontSize: 13, cursor: 'pointer' }}>Remove row</button>
          </div>
        );
      })}
    </div>
  );
}
