import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { compose } from '../../../lib/engine/composer';

// Per-family preview pane. Calls weekly_digest composer with the family's
// events and renders the resulting HTML inside an email-frame container.
// Prev/Next nav cycles through sendable families so the operator can
// inspect personalization across single- and multi-team rosters.

const navBtn = {
  minWidth: 36, minHeight: 36, padding: 0, borderRadius: 9999, border: 'none',
  backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-primary)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export default function DigestRecipientPreview({
  family, events, period, teams, tournaments, coaches, rsvpCountsByEvent,
  bodyNotes, signoffMessage, opsNotes,
  index, total, onPrev, onNext,
}) {
  const result = useMemo(() => {
    if (!family || !events) return null;
    try {
      return compose({
        kind: 'weekly_digest',
        data: { family, events, period, teams, tournaments, coaches, rsvpCountsByEvent, body_notes: bodyNotes, signoff_message: signoffMessage, ops_notes: opsNotes },
      });
    } catch (e) {
      return { html: `<div style="padding:16px;color:#dc2626;">Preview error: ${e.message}</div>`, plainText: '' };
    }
  }, [family, events, period, teams, tournaments, coaches, rsvpCountsByEvent, bodyNotes, signoffMessage, opsNotes]);

  if (!family) return null;
  const teamLabel = (family.team_names || []).join(' + ');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={onPrev} aria-label="Previous family" style={navBtn} disabled={total <= 1}>
          <ChevronLeft size={18} strokeWidth={1.75} />
        </button>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--em-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {family.full_name || family.email}
          </div>
          <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>
            {teamLabel} · {index + 1} of {total}
          </div>
        </div>
        <button type="button" onClick={onNext} aria-label="Next family" style={navBtn} disabled={total <= 1}>
          <ChevronRight size={18} strokeWidth={1.75} />
        </button>
      </div>
      <div style={{
        backgroundColor: '#ffffff', borderRadius: 8,
        border: '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)',
        maxHeight: 480, overflowY: 'auto',
      }}>
        {result?.html
          ? <div dangerouslySetInnerHTML={{ __html: result.html }} />
          : <div style={{ padding: 16, color: 'var(--em-text-tertiary)', fontSize: 13 }}>No preview available.</div>}
      </div>
    </div>
  );
}
