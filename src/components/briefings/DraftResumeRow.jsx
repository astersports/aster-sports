// §4.AI Option C — PR A. "Resume a draft?" card row surfaced
// above the kind tile grid in StepKindPicker. Shows up to 5 recent
// drafts (status='draft', <7 days old). Tapping a draft hydrates
// the composer via the onResume callback (which the composer wires
// to its loadDraft function → HYDRATE_DRAFT dispatch).

import { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAvailableDrafts } from '../../hooks/useAvailableDrafts';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';

const ICON_MAP = { Bell, CalendarClock, CalendarDays, Flag, Medal, Megaphone, MessageSquare, Trophy };

const wrap = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 };
const headerStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--em-text-tertiary)', marginBottom: 2 };
const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', minHeight: 44, borderRadius: 10, border: '1px solid var(--em-border-subtle)', backgroundColor: 'var(--em-bg-card)', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' };
const iconWrap = { width: 28, height: 28, borderRadius: 6, backgroundColor: 'var(--em-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const bodyWrap = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' };
const titleStyle = { fontSize: 14, fontWeight: 500, color: 'var(--em-text-primary)' };
const subStyle = { fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 1 };

function relTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 3600000) return 'just now';
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h ago`;
  return `${Math.round(ms / 86400000)}d ago`;
}

export default function DraftResumeRow({ onResume }) {
  const { orgId } = useAuth();
  const { drafts, loading } = useAvailableDrafts({ orgId, limit: 5 });
  if (loading || !drafts.length) return null;
  return (
    <div style={wrap} aria-label="Resume recent drafts">
      <div style={headerStyle}>Resume a draft?</div>
      {drafts.map((d) => {
        const m = KIND_METADATA[d.kind] || {};
        const Icon = ICON_MAP[m.icon] || MessageSquare;
        const label = m.label || d.kind;
        return (
          <button key={d.id} type="button" className="em-press" style={rowStyle} onClick={() => onResume(d)} aria-label={`Resume ${label} draft`}>
            <span style={iconWrap}><Icon size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" aria-hidden="true" /></span>
            <span style={bodyWrap}>
              <span style={titleStyle}>{label}{d.subject ? ` · ${d.subject}` : ''}</span>
              <span style={subStyle}>Last edited {relTime(d.last_edited_at)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
