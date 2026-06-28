// L99 enhancement — a richer, more scannable member row. Adds an
// initials avatar, kid-name chips (number-first naming is upstream from
// the DB; this only renders what the hook returns), an amber "Needs a
// kid" flag, and quick contact actions (email / call / copy) that don't
// trigger the row's edit tap. Tokens only; 44px targets; full a11y.
import { useState } from 'react';
import { AlertTriangle, Check, ChevronRight, Copy, Mail, Phone } from 'lucide-react';
import { fullName, initialsOf, kidNames } from './memberHelpers';

const ACTION = {
  width: 44, height: 44, flexShrink: 0, display: 'inline-flex', alignItems: 'center',
  justifyContent: 'center', borderRadius: 10, border: '1px solid var(--as-border-default)',
  backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-secondary)', cursor: 'pointer',
};
const CHIP = {
  fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
  backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-secondary)',
};

export default function MemberRow({ guardian: g, onEdit }) {
  const [copied, setCopied] = useState(false);
  const name = fullName(g);
  const kids = kidNames(g);
  const hasKids = kids.length > 0;
  const stop = (e) => e.stopPropagation();

  const copyContact = async (e) => {
    stop(e);
    const text = [g.email, g.phone].filter(Boolean).join(' · ');
    try { await navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  return (
    <li style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-subtle)', boxShadow: 'var(--as-shadow-sm)', overflow: 'hidden' }}>
      <div className="flex items-stretch">
        <button type="button" onClick={() => onEdit(g)} className="flex-1 text-left as-press" aria-label={`Edit ${name}`}
          style={{ minWidth: 0, padding: 16, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span aria-hidden="true" style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 9999, backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>
            {initialsOf(g)}
          </span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span className="flex items-center gap-2">
              <span className="font-semibold truncate" style={{ color: 'var(--as-text-primary)', fontSize: 17 }}>{name}</span>
            </span>
            {(g.email || g.phone) && (
              <span className="block truncate" style={{ color: 'var(--as-text-secondary)', fontSize: 13, marginTop: 2 }}>
                {[g.email, g.phone].filter(Boolean).join(' · ')}
              </span>
            )}
            <span className="flex flex-wrap gap-1" style={{ marginTop: 6 }}>
              {hasKids ? kids.map((k, i) => <span key={i} style={CHIP}>{k}</span>) : (
                <span className="flex items-center gap-1" style={{ ...CHIP, backgroundColor: 'var(--as-warning-soft)', color: 'var(--as-warning)' }}>
                  <AlertTriangle size={11} strokeWidth={1.75} aria-hidden="true" /> Needs a kid
                </span>
              )}
            </span>
          </span>
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--as-text-tertiary)' }} />
        </button>
      </div>
      <div className="flex gap-2" style={{ padding: '0 16px 12px 16px' }}>
        {g.email && <a href={`mailto:${g.email}`} onClick={stop} className="as-press" aria-label={`Email ${name}`} style={ACTION}><Mail size={18} strokeWidth={1.75} aria-hidden="true" /></a>}
        {g.phone && <a href={`tel:${g.phone}`} onClick={stop} className="as-press" aria-label={`Call ${name}`} style={ACTION}><Phone size={18} strokeWidth={1.75} aria-hidden="true" /></a>}
        {(g.email || g.phone) && (
          <button type="button" onClick={copyContact} className="as-press" aria-label={copied ? 'Contact copied' : `Copy ${name}'s contact`} aria-live="polite"
            style={{ ...ACTION, color: copied ? 'var(--as-success)' : 'var(--as-text-secondary)', borderColor: copied ? 'var(--as-success)' : 'var(--as-border-default)' }}>
            {copied ? <Check size={18} strokeWidth={2} aria-hidden="true" /> : <Copy size={18} strokeWidth={1.75} aria-hidden="true" />}
          </button>
        )}
      </div>
    </li>
  );
}
