// G5 PR 1a — one interrupted message's ambiguous-queued card (§16.14 detail).
// Leads with the disambiguation pointer, then TWO equal-weight actions both
// gated behind a confirm (architect D2): "Resend to these N" first (moat-leaning
// — a duplicate beats a silent miss), "Mark as delivered" second. --as-* tokens.

import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';

const card = { borderTop: '1px solid var(--as-border-subtle)', padding: '12px 13px' };
const top = { display: 'flex', alignItems: 'center', gap: 8 };
const dot = { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 };
const ttl = { fontSize: 12.5, fontWeight: 700, flex: 1, minWidth: 0, color: 'var(--as-text-primary)' };
const chip = { fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', background: 'var(--as-bg-secondary)', border: '1px solid var(--as-border-default)', borderRadius: 9999, padding: '2px 7px' };
const body = { fontSize: 11.5, color: 'var(--as-text-secondary)', lineHeight: 1.45, marginTop: 7 };
const disamb = { display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 600, color: 'var(--as-info)', background: 'var(--as-info-soft)', border: '1px solid var(--as-border-default)', borderRadius: 8, padding: '8px 10px', marginTop: 9 };
const acts = { display: 'flex', gap: 7, marginTop: 9 };
const btnBase = { flex: 1, minHeight: 44, borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', background: 'var(--as-bg-card)', cursor: 'pointer' };
const btn = { ...btnBase, border: '1.5px solid var(--as-border-default)', color: 'var(--as-text-primary)' };
const btnLead = { ...btnBase, border: '1.5px solid var(--as-accent)', color: 'var(--as-accent)' };
const tog = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', minHeight: 36, fontSize: 11, fontWeight: 600, color: 'var(--as-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 };
const detail = { marginTop: 8, borderTop: '1px dashed var(--as-border-default)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 5 };
const rcp = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, background: 'var(--as-bg-secondary)', borderRadius: 7, padding: '7px 9px', color: 'var(--as-text-secondary)' };

export default function StuckSendCard({ group, onResend, onMark }) {
  const [open, setOpen] = useState(false);
  const n = group.recipients.length;
  const label = KIND_METADATA[group.kind]?.label || group.kind;
  const title = group.teamName ? `${group.teamName} · ${group.subject || label}` : (group.subject || label);
  return (
    <div style={card}>
      <div style={top}>
        <span style={{ ...dot, background: group.teamColor || 'var(--as-neutral)' }} aria-hidden="true" />
        <span style={ttl}>{title}</span>
        <span style={chip}>{label}</span>
      </div>
      <div style={body}>
        <b style={{ color: 'var(--as-text-primary)', fontWeight: 700 }}>{n} recipient{n === 1 ? '' : 's'}</b>{' '}
        {n === 1 ? 'is' : 'are'} in an unknown delivery state after an interrupted send. They may or may not have received this email.
      </div>
      <div style={disamb}><Search size={13} strokeWidth={1.75} aria-hidden="true" />Check Resend to confirm delivery before resolving.</div>
      <div style={acts}>
        <button type="button" className="as-press" style={btnLead} onClick={onResend}>Resend to these {n}</button>
        <button type="button" className="as-press" style={btn} onClick={onMark}>Mark as delivered</button>
      </div>
      <button type="button" style={tog} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <ChevronDown size={13} strokeWidth={1.75} style={{ transform: open ? 'rotate(180deg)' : 'none' }} aria-hidden="true" />
        {open ? 'Hide recipients' : `Show the ${n} recipient${n === 1 ? '' : 's'}`}
      </button>
      {open && (
        <div style={detail}>
          {group.recipients.slice(0, 8).map((r) => (
            <div key={r.id} style={rcp}><span>guardian · row {String(r.id).slice(0, 6)}…</span></div>
          ))}
          {n > 8 && <div style={rcp}><span>+ {n - 8} more</span></div>}
        </div>
      )}
    </div>
  );
}
