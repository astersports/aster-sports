import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function SubstitutionSheet({ open, players, onCourt, playerStats, onSubIn, onSubOut, onClose }) {
  if (!open) return null;
  const court = players.filter((p) => onCourt.includes(p.id));
  const bench = players.filter((p) => !onCourt.includes(p.id));

  const fouls = (id) => playerStats[id]?.foul || 0;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9996, backgroundColor: 'var(--em-bg-page)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top) + 12px)', borderBottom: '1px solid var(--em-border-default)' }}>
        <button type="button" onClick={() => { court.forEach((p) => onSubOut(p.id)); }} className="sf-press" aria-label="Bench all players" style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44, padding: '0 8px' }}>Bench All</button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700, color: 'var(--em-text-primary)' }}>Substitutions</span>
        <button type="button" onClick={onClose} className="sf-press" aria-label="Done" style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>Done</button>
      </div>
      <div style={{ display: 'flex', gap: 16, padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
        <span style={{ color: 'var(--em-text-primary)' }}>On Court {court.length}</span>
        <span style={{ color: 'var(--em-text-tertiary)' }}>Bench {bench.length}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {court.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {court.map((p) => (
              <button key={p.id} type="button" onClick={() => onSubOut(p.id)} className="sf-press" aria-label={`Sub out ${p.first_name}`}
                style={{ padding: '10px 8px', borderRadius: 10, border: '2px solid var(--em-accent)', backgroundColor: 'var(--em-accent-soft)', textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--em-text-primary)' }}>{p.jersey_number || '—'}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--em-text-primary)', marginTop: 2 }}>{p.first_name}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: fouls(p.id) >= 4 ? 'var(--em-danger)' : 'var(--em-text-tertiary)', marginTop: 2 }}>{fouls(p.id)} PF</div>
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {bench.map((p) => (
            <button key={p.id} type="button" onClick={() => onSubIn(p.id)} className="sf-press" aria-label={`Sub in ${p.first_name}`}
              style={{ padding: '10px 8px', borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--em-text-primary)' }}>{p.jersey_number || '—'}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--em-text-primary)', marginTop: 2 }}>{p.first_name}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: fouls(p.id) >= 4 ? 'var(--em-danger)' : 'var(--em-text-tertiary)', marginTop: 2 }}>{fouls(p.id)} PF</div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
