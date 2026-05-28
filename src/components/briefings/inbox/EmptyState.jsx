// Wave 3.12 — empty states for Active / History / filtered.
// Wave 4.1b §6.F — added 'drafts' empty state.

import { CheckCircle2, FileText, Filter, Mail } from 'lucide-react';

const wrap = { padding: '48px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' };
const iconStyle = { color: 'var(--em-text-tertiary)' };
const titleStyle = { fontSize: 18, fontWeight: 700, color: 'var(--em-text-primary)' };
const bodyStyle = { fontSize: 14, color: 'var(--em-text-secondary)', maxWidth: 320 };
const btnGhost = { minHeight: 44, padding: '0 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid var(--em-accent)', backgroundColor: 'transparent', color: 'var(--em-accent)' };

export default function EmptyState({ kind, onCompose, onViewHistory, onClearFilters }) {
  if (kind === 'drafts') {
    return (
      <div style={wrap}>
        <FileText size={56} strokeWidth={1.25} style={iconStyle} />
        <div style={titleStyle}>No drafts in progress</div>
        <div style={bodyStyle}>Tap Compose to start one.</div>
        {onCompose && <button type="button" onClick={onCompose} className="em-press" style={btnGhost}>Compose →</button>}
      </div>
    );
  }
  if (kind === 'active') {
    return (
      <div style={wrap}>
        <CheckCircle2 size={56} strokeWidth={1.25} style={iconStyle} />
        <div style={titleStyle}>All caught up</div>
        <div style={bodyStyle}>Nothing needs your attention right now.</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {onCompose && <button type="button" onClick={onCompose} className="em-press" style={btnGhost}>Schedule next week's digest →</button>}
          {onViewHistory && <button type="button" onClick={onViewHistory} className="em-press" style={btnGhost}>Review history →</button>}
        </div>
      </div>
    );
  }
  if (kind === 'history') {
    return (
      <div style={wrap}>
        <Mail size={56} strokeWidth={1.25} style={iconStyle} />
        <div style={titleStyle}>No briefings sent yet</div>
        {onCompose && <button type="button" onClick={onCompose} className="em-press" style={btnGhost}>Compose your first briefing →</button>}
      </div>
    );
  }
  return (
    <div style={wrap}>
      <Filter size={56} strokeWidth={1.25} style={iconStyle} />
      <div style={titleStyle}>No briefings match these filters</div>
      {onClearFilters && <button type="button" onClick={onClearFilters} className="em-press" style={btnGhost}>Clear filters</button>}
    </div>
  );
}
