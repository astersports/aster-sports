// Wave 3.16 — kind-aware template picker. Compact dropdown above
// the body editor. Hidden entirely when the current kind has no
// templates (schedule_change, rsvp_nudge stub).
//
// On select, fires onSelect(template | null). null = "(no template)".
// Caller is responsible for dispatching SET_ACTIVE_TEMPLATE +
// UPDATE_BODY in sequence.

import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { getTemplatesForKind } from '../../lib/engine/templates';

const wrap = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 };
const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--em-text-tertiary)' };
const triggerStyle = (open) => ({
  display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 14px', borderRadius: 10,
  border: open ? '1.5px solid var(--em-accent)' : '1.5px solid var(--em-border-default)',
  backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)',
  fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
});
const menuStyle = { display: 'flex', flexDirection: 'column', gap: 2, padding: 6, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', boxShadow: 'var(--em-shadow-md)' };
const itemStyle = (active) => ({
  display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 44, padding: '8px 10px', borderRadius: 8,
  border: 'none', backgroundColor: active ? 'var(--em-accent-soft)' : 'transparent',
  color: 'var(--em-text-primary)', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', width: '100%',
});
const nameStyle = { fontSize: 14, fontWeight: 600, color: 'var(--em-text-primary)' };
const descStyle = { fontSize: 12, color: 'var(--em-text-secondary)', marginTop: 2 };

export default function TemplatePicker({ kind, currentTemplateId, onSelect }) {
  const [open, setOpen] = useState(false);
  const templates = getTemplatesForKind(kind);
  if (!templates.length) return null;

  const current = templates.find((t) => t.id === currentTemplateId);
  const triggerLabel = current ? current.name : '(no template)';

  const pick = (template) => {
    setOpen(false);
    onSelect?.(template);
  };

  return (
    <div style={wrap}>
      <span style={labelStyle}>Template (optional)</span>
      <button type="button" className="sf-press" style={triggerStyle(open)} onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span style={{ flex: 1 }}>{triggerLabel}</span>
        {open ? <ChevronDown size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" /> : <ChevronRight size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />}
      </button>
      {open && (
        <div role="listbox" style={menuStyle}>
          <button type="button" className="sf-press" style={itemStyle(!currentTemplateId)} onClick={() => pick(null)}>
            <span style={{ width: 18, marginTop: 2 }}>{!currentTemplateId && <Check size={14} strokeWidth={1.75} color="var(--em-accent)" />}</span>
            <span style={nameStyle}>(no template)</span>
          </button>
          {templates.map((t) => {
            const active = t.id === currentTemplateId;
            return (
              <button key={t.id} type="button" className="sf-press" style={itemStyle(active)} onClick={() => pick(t)}>
                <span style={{ width: 18, marginTop: 2 }}>{active && <Check size={14} strokeWidth={1.75} color="var(--em-accent)" />}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={nameStyle}>{t.name}</div>
                  {t.description && <div style={descStyle}>{t.description}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
