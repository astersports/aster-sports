import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

// Identity hero for /account. Adds an avatar (initials), a copy-email
// affordance with optimistic feedback + kindness microcopy, and an
// aria-live region so screen readers announce the copy result.
// Extracted so AccountPage stays lean (≤150). Token-only colors.
const initialsOf = (name) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

export default function AccountIdentityCard({ displayName, email, roleLabel, orgLabel }) {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="as-fade-in" style={{ backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', boxShadow: 'var(--as-shadow-sm)', padding: 16, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div aria-hidden="true" style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 9999, backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
        {initialsOf(displayName)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)' }}>{displayName}</div>
        <button type="button" onClick={copyEmail} className="as-press"
          aria-label={copied ? 'Email copied to clipboard' : `Copy email ${email || ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 28, marginTop: 2, padding: 0, background: 'none', border: 'none', cursor: email ? 'pointer' : 'default', color: copied ? 'var(--as-success)' : 'var(--as-text-tertiary)', fontSize: 13, fontFamily: 'inherit', maxWidth: '100%' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
          {email && (copied
            ? <Check size={16} strokeWidth={1.75} aria-hidden="true" style={{ flexShrink: 0 }} />
            : <Copy size={16} strokeWidth={1.75} aria-hidden="true" style={{ flexShrink: 0 }} />)}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)' }}>
            {roleLabel}
          </span>
          <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>{orgLabel}</span>
        </div>
      </div>
      <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {copied ? 'Email copied' : ''}
      </span>
    </section>
  );
}
