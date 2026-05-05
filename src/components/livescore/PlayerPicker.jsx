import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function PlayerPicker({ open, players, onCourt, playerStats, playLabel, onSelect, onSkip, onClose }) {
  const trapRef = useFocusTrap(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const courtPlayers = players.filter((p) => onCourt.includes(p.id));
  const benchPlayers = players.filter((p) => !onCourt.includes(p.id));
  const fouls = (id) => playerStats?.[id]?.foul || 0;
  return createPortal(
    <div ref={trapRef} role="dialog" aria-modal="true" aria-label={playLabel}
      style={{ position: 'fixed', inset: 0, zIndex: 9996, backgroundColor: 'var(--em-bg-page)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top) + 12px)', borderBottom: '1px solid var(--em-border-default)' }}>
        <button type="button" onClick={onClose} className="sf-press" aria-label="Cancel"
          style={{ width: 44, height: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--em-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={18} strokeWidth={1.75} color="var(--em-text-primary)" />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--em-text-primary)' }}>{playLabel}</div>
        </div>
        <div style={{ width: 44 }} />
      </div>
      <div style={{ padding: '8px 16px' }}>
        <button type="button" onClick={onSkip} className="sf-press" style={{ minHeight: 44, width: '100%', borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-secondary)', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>Assign Later</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {courtPlayers.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-accent)', marginBottom: 8 }}>On Court ({courtPlayers.length})</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {courtPlayers.map((p) => <PlayerCard key={p.id} player={p} onTap={() => onSelect(p.id)} active fouls={fouls(p.id)} />)}
            </div>
          </>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-tertiary)', marginBottom: 8 }}>
          {courtPlayers.length > 0 ? `Bench (${benchPlayers.length})` : `All Players (${players.length})`}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {benchPlayers.map((p) => <PlayerCard key={p.id} player={p} onTap={() => onSelect(p.id)} fouls={fouls(p.id)} />)}
        </div>
      </div>
    </div>,
    document.body
  );
}

function PlayerCard({ player, onTap, active, fouls = 0 }) {
  return (
    <button type="button" onClick={onTap} className="sf-press"
      aria-label={`${player.first_name} number ${player.jersey_number || 'none'}, ${fouls} fouls`}
      style={{
        padding: '10px 8px', minHeight: 44, borderRadius: 10,
        border: active ? '2px solid var(--em-accent)' : '1px solid var(--em-border-default)',
        backgroundColor: 'var(--em-bg-card)', textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit',
      }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--em-text-primary)' }}>{player.jersey_number || '—'}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--em-text-primary)', marginTop: 2 }}>{player.first_name}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: fouls >= 4 ? 'var(--em-danger)' : 'var(--em-text-tertiary)', marginTop: 2 }}>{fouls} PF</div>
    </button>
  );
}
