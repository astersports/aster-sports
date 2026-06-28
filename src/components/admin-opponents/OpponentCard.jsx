// §4.O L99 — single opponent row for the admin directory. Adds: circuit
// badge, H2H record + win-rate, near-duplicate flag, ref-based
// expand/collapse for scouting notes (AP #3), and an optimistic
// copy-name action. Tokens only; 44px targets; a11y on every control.

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, Copy } from 'lucide-react';
import { CIRCUIT_BADGE, circuitLabel, formatRecord, winRate } from './opponentUtils';

function CircuitBadge({ circuit }) {
  const c = CIRCUIT_BADGE[circuit] || { bg: 'var(--as-neutral-soft)', fg: 'var(--as-text-secondary)' };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 6,
        backgroundColor: c.bg,
        color: c.fg,
      }}
    >
      {circuitLabel(circuit)}
    </span>
  );
}

export default function OpponentCard({ opponent: o, lastPlayedLabel, duplicate }) {
  const notesRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notesHeight, setNotesHeight] = useState(0);
  const [copied, setCopied] = useState(false);
  const rate = winRate(o);
  const locationLine = [o.city, o.state].filter(Boolean).join(', ');
  const notesId = `op-notes-${o.id}`;

  // Ref-based expand height (AP #3 — measured, not a max-height guess). The
  // ref is read in the effect (never during render) and the measured height
  // drives the transition via state.
  useEffect(() => {
    setNotesHeight(open && notesRef.current ? notesRef.current.scrollHeight : 0);
  }, [open]);

  const handleCopy = async () => {
    setCopied(true); // optimistic
    try {
      await navigator.clipboard.writeText(o.name);
    } catch {
      setCopied(false); // rollback — clipboard blocked
      return;
    }
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <li
      style={{
        backgroundColor: 'var(--as-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--as-border-subtle)',
        boxShadow: 'var(--as-shadow-sm)',
        padding: 16,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
          <span className="font-semibold truncate" style={{ color: 'var(--as-text-primary)', fontSize: 17 }}>
            {o.name}
          </span>
          {duplicate && (
            <span
              className="flex items-center"
              title="Another opponent shares this name — check for a duplicate before adding."
              aria-label="Possible duplicate name"
              style={{ color: 'var(--as-warning)' }}
            >
              <AlertTriangle size={16} strokeWidth={1.75} aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          <span style={{ color: 'var(--as-text-secondary)', fontSize: 13, fontWeight: 600 }}>
            {formatRecord(o)}
          </span>
          {rate !== null && (
            <span style={{ color: 'var(--as-text-tertiary)', fontSize: 11 }}>{rate}% W</span>
          )}
          <button
            type="button"
            className="as-press flex items-center justify-center"
            onClick={handleCopy}
            aria-label={copied ? 'Name copied' : `Copy ${o.name}`}
            style={{
              width: 44, height: 44, margin: -10, borderRadius: 10,
              backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
              color: copied ? 'var(--as-success)' : 'var(--as-text-tertiary)',
            }}
          >
            {copied
              ? <Check size={18} strokeWidth={1.75} aria-hidden="true" />
              : <Copy size={18} strokeWidth={1.75} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: o.scouting_notes ? 8 : 0 }}>
        <CircuitBadge circuit={o.circuit} />
        {locationLine && (
          <span style={{ color: 'var(--as-text-secondary)', fontSize: 13 }}>{locationLine}</span>
        )}
        {lastPlayedLabel && (
          <span style={{ color: 'var(--as-text-tertiary)', fontSize: 13 }}>· Last played {lastPlayedLabel}</span>
        )}
      </div>

      {o.scouting_notes && (
        <div>
          <button
            type="button"
            className="as-press flex items-center gap-1"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={notesId}
            style={{
              minHeight: 44, padding: '0 2px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              color: 'var(--as-text-secondary)',
            }}
          >
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
            />
            {open ? 'Hide scouting notes' : 'Scouting notes'}
          </button>
          <div
            id={notesId}
            ref={notesRef}
            style={{
              maxHeight: notesHeight,
              overflow: 'hidden',
              transition: 'max-height 0.2s ease',
            }}
          >
            <p style={{ color: 'var(--as-text-tertiary)', fontSize: 12, lineHeight: 1.5, fontStyle: 'italic', margin: '4px 0 0' }}>
              {o.scouting_notes}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}
