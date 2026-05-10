// Wave 3.12 — single inbox row. Status border-left, kind icon, title,
// audience preview, status pill, primary action button.

import { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy } from 'lucide-react';
import { KIND_METADATA } from '../../../lib/briefings/kindMetadata';
import { STATUS_TABLE, statusFor } from '../../../lib/briefings/statusTable';

const ICON_MAP = { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy };

const rowStyle = (color) => ({
  display: 'flex', gap: 12, padding: 14, borderRadius: 10,
  backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)',
  borderLeft: `4px solid ${color}`,
});
const iconWrap = { width: 36, height: 36, borderRadius: 8, backgroundColor: 'var(--em-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
// Wave 4.1b §6.H — clamp titles to 2 lines so long tournament names
// don't push pill or action button off the row at narrow widths.
const titleStyle = { fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' };
const audienceStyle = { fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2 };
const pillStyle = (s) => ({ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', padding: '3px 8px', borderRadius: 9999, backgroundColor: s.pillBg, color: s.pillText, textTransform: 'uppercase' });
const actionBtn = { minHeight: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' };

function iconNameFor(kind) {
  return KIND_METADATA[kind]?.icon || 'MessageSquare';
}

function timeRel(row) {
  if (row.relative_time) return row.relative_time;
  if (row.scheduled_for) return `sends ${new Date(row.scheduled_for).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  if (row.last_edited_at) return `edited ${new Date(row.last_edited_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  return '';
}

export default function ActionQueueRow({ row, onAction }) {
  const status = statusFor(row);
  const s = STATUS_TABLE[status] || STATUS_TABLE.draft;
  const Icon = ICON_MAP[iconNameFor(row.kind)] || MessageSquare;
  const title = row.title || row.subject || (KIND_METADATA[row.kind]?.label || row.kind);
  return (
    <div style={rowStyle(s.borderColor)}>
      <span style={iconWrap}><Icon size={20} strokeWidth={1.75} color="var(--em-text-secondary)" /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={titleStyle}>{title}</span>
          <span style={pillStyle(s)}>{s.label}</span>
        </div>
        <div style={audienceStyle}>{row.audience_preview || timeRel(row) || '—'}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={() => onAction(row, status)} className="sf-press" style={actionBtn}>{s.action}</button>
        </div>
      </div>
    </div>
  );
}
