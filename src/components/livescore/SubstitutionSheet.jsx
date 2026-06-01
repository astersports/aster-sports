import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function SubstitutionSheet({ open, players, onCourt, playerStats, onSubIn, onSubOut, onClose }) {
  const trapRef = useFocusTrap(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const court = players.filter((p) => onCourt.includes(p.id));
  const bench = players.filter((p) => !onCourt.includes(p.id));

  const fouls = (id) => playerStats[id]?.foul || 0;

  return createPortal(
    <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Substitutions"
      style={{ position: 'fixed', inset: 0, zIndex: 9996, backgroundColor: 'var(--as-bg-page)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top) + 12px)', borderBottom: '1px solid var(--as-border-default)' }}>
        <button type="button" onClick={() => { court.forEach((p) => onSubOut(p.id)); }} className="as-press" aria-label="Bench all players" style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44, padding: '0 8px' }}>Bench All</button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)' }}>Substitutions</span>
        <button type="button" onClick={onClose} className="as-press" aria-label="Done" style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>Done</button>
      </div>
      <div style={{ display: 'flex', gap: 16, padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
        <span style={{ color: 'var(--as-text-primary)' }}>On Court {court.length}</span>
        <span style={{ color: 'var(--as-text-tertiary)' }}>Bench {bench.length}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {court.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {court.map((p) => (
              <button key={p.id} type="button" onClick={() => onSubOut(p.id)} className="as-press" aria-label={`Sub out ${p.first_name}`}
                style={{ padding: '10px 8px', borderRadius: 10, border: '2px solid var(--as-accent)', backgroundColor: 'var(--as-accent-soft)', textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--as-text-primary)' }}>{p.jersey_number || '—'}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--as-text-primary)', marginTop: 2 }}>{p.first_name}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: fouls(p.id) >= 4 ? 'var(--as-danger)' : 'var(--as-text-tertiary)', marginTop: 2 }}>{fouls(p.id)} PF</div>
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {bench.map((p) => {
            const pf = fouls(p.id);
            const fouledOut = pf >= 5;
            return (
              <button key={p.id} type="button" onClick={() => { if (fouledOut) return; onSubIn(p.id); }} className="as-press"
                aria-label={fouledOut ? `${p.first_name} fouled out` : `Sub in ${p.first_name}`} aria-disabled={fouledOut}
                style={{ padding: '10px 8px', borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', textAlign: 'center', cursor: fouledOut ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minHeight: 44, opacity: fouledOut ? 0.4 : 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--as-text-primary)' }}>{p.jersey_number || '—'}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--as-text-primary)', marginTop: 2 }}>{p.first_name}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: fouledOut ? 'var(--as-danger)' : pf >= 4 ? 'var(--as-danger)' : 'var(--as-text-tertiary)', marginTop: 2 }}>
                  {fouledOut ? 'FOULED OUT' : `${pf} PF`}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
