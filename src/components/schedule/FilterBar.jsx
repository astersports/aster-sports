import { TYPE_OPTIONS } from '../../lib/constants';

export default function FilterBar({ teams, selectedTeam, onSelectTeam, selectedType, onSelectType, showCancelled, onToggleCancelled }) {
  const uniqueTeams = [];
  const seen = new Set();
  (teams || []).forEach((a) => {
    if (a.team_id && !seen.has(a.team_id) && a.teams) {
      seen.add(a.team_id);
      uniqueTeams.push({ id: a.team_id, name: a.teams.name, team_color: a.teams.team_color });
    }
  });

  return (
    <div style={{ padding: '8px 0' }}>
      <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ paddingBottom: 6 }}>
        <Chip
          label="All Teams"
          active={!selectedTeam}
          onClick={() => onSelectTeam(null)}
        />
        {uniqueTeams.map((t) => (
          <Chip
            key={t.id}
            label={t.name}
            active={selectedTeam === t.id}
            color={t.team_color}
            onClick={() => onSelectTeam(selectedTeam === t.id ? null : t.id)}
          />
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto sf-no-scrollbar">
        {TYPE_OPTIONS.map((opt) => (
          <Chip
            key={opt.key || 'all'}
            label={opt.label}
            active={selectedType === opt.key}
            onClick={() => onSelectType(opt.key)}
          />
        ))}
      </div>
      {onToggleCancelled && (
        <button type="button" onClick={onToggleCancelled}
          style={{ fontSize: 12, color: 'var(--sf-text-tertiary)', background: 'none', border: 'none', padding: '4px 0', marginTop: 4 }}>
          {showCancelled ? 'Hide cancelled' : 'Show cancelled'}
        </button>
      )}
    </div>
  );
}

function Chip({ label, active, color, onClick }) {
  return (
    <button
      type="button"
      onClick={() => { navigator.vibrate?.(10); onClick(); }}
      className="sf-press"
      style={{
        flexShrink: 0,
        minHeight: 32,
        padding: '0 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        border: `1.5px solid ${active ? (color || 'var(--sf-accent)') : 'var(--sf-border-default)'}`,
        backgroundColor: active ? (color ? `${color}15` : 'var(--sf-accent-soft)') : 'var(--sf-bg-card)',
        color: active ? (color || 'var(--sf-accent)') : 'var(--sf-text-primary)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
