import { useState } from 'react';
import { Archive, Edit2, MoreVertical } from 'lucide-react';

export default function TournamentRowMenu({ onEdit, onArchive }) {
  const [open, setOpen] = useState(false);

  const stop = (e) => { e.stopPropagation(); e.preventDefault(); };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }} onClick={stop}>
      <button
        type="button"
        onClick={(e) => { stop(e); setOpen((o) => !o); }}
        aria-label="Tournament actions"
        aria-expanded={open}
        className="as-press"
        style={{
          width: 32, height: 32, borderRadius: 6,
          border: 'none', backgroundColor: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <MoreVertical size={18} strokeWidth={1.75} color="var(--as-text-secondary)" />
      </button>
      {open && (
        <>
          <div
            onClick={(e) => { stop(e); setOpen(false); }}
            style={{ position: 'fixed', inset: 0, zIndex: 1 }}
          />
          <div style={{
            position: 'absolute', top: 36, right: 0, zIndex: 2,
            backgroundColor: 'var(--as-bg-card)',
            border: '1px solid var(--as-border-default)',
            borderRadius: 10, boxShadow: 'var(--as-shadow-md)',
            minWidth: 140, overflow: 'hidden',
          }}>
            <button
              type="button"
              onClick={(e) => { stop(e); setOpen(false); onEdit(); }}
              className="as-press"
              style={{ width: '100%', padding: '10px 14px', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--as-text-primary)', cursor: 'pointer' }}
            >
              <Edit2 size={14} strokeWidth={1.75} /> Edit
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); setOpen(false); onArchive(); }}
              className="as-press"
              style={{ width: '100%', padding: '10px 14px', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--as-danger)', cursor: 'pointer' }}
            >
              <Archive size={14} strokeWidth={1.75} /> Archive
            </button>
          </div>
        </>
      )}
    </div>
  );
}
