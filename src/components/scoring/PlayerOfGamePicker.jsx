import { useRoster } from '../../hooks/useRoster';

export default function PlayerOfGamePicker({ teamId, value, onChange, disabled }) {
  const { players, loading } = useRoster(teamId);

  const handleTap = (playerId) => {
    if (disabled) return;
    onChange(value === playerId ? null : playerId);
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-primary)', marginBottom: 12 }}>
        Player of the Game (optional)
      </div>

      {loading && <div style={{ fontSize: 15, color: 'var(--em-text-secondary)' }}>Loading roster…</div>}

      {!loading && players.length === 0 && (
        <div style={{ fontSize: 15, color: 'var(--em-text-secondary)' }}>No active roster yet</div>
      )}

      {!loading && players.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
          {players.map(p => {
            const selected = p.id === value;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleTap(p.id)}
                disabled={disabled}
                className="em-press"
                style={{
                  minHeight: 44, padding: '8px 14px', borderRadius: 8,
                  background: selected ? 'var(--em-accent)' : 'var(--em-bg-card)',
                  color: selected ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
                  border: selected ? '2px solid var(--em-accent)' : '1px solid var(--em-border-default)',
                  fontSize: 15, fontWeight: selected ? 600 : 500,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {p.first_name}{p.last_name ? ` ${p.last_name}` : ''}{p.jersey_number ? ` #${p.jersey_number}` : ''}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
