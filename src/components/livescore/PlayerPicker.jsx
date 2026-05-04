import { createPortal } from 'react-dom';

export default function PlayerPicker({ open, players, onCourt, playLabel, onSelect, onSkip }) {
  if (!open) return null;
  const courtPlayers = players.filter((p) => onCourt.includes(p.id));
  const benchPlayers = players.filter((p) => !onCourt.includes(p.id));
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9990, backgroundColor: 'var(--em-bg-page)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', paddingTop: 'calc(env(safe-area-inset-top) + 16px)', borderBottom: '1px solid var(--em-border-default)', textAlign: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--em-text-primary)' }}>{playLabel}</div>
        <button type="button" onClick={onSkip} className="sf-press" style={{ minHeight: 44, width: '100%', marginTop: 8, borderRadius: 10, border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-secondary)', fontSize: 15, fontWeight: 500 }}>Assign Later</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {courtPlayers.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-accent)', marginBottom: 8 }}>On Court ({courtPlayers.length})</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {courtPlayers.map((p) => <PlayerCard key={p.id} player={p} onTap={() => onSelect(p.id)} active />)}
            </div>
          </>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-tertiary)', marginBottom: 8 }}>Bench ({benchPlayers.length})</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {benchPlayers.map((p) => <PlayerCard key={p.id} player={p} onTap={() => onSelect(p.id)} />)}
        </div>
      </div>
    </div>,
    document.body
  );
}

function PlayerCard({ player, onTap, active }) {
  return (
    <button type="button" onClick={onTap} className="sf-press"
      aria-label={`${player.first_name} #${player.jersey_number}`}
      style={{
        padding: '12px 8px', borderRadius: 10, border: active ? '2px solid var(--em-accent)' : '1px solid var(--em-border-default)',
        backgroundColor: 'var(--em-bg-card)', textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit',
      }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--em-text-primary)' }}>{player.jersey_number || '—'}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-primary)', marginTop: 2 }}>{player.first_name}</div>
    </button>
  );
}
