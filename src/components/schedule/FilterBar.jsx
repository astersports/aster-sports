import { TYPE_OPTIONS } from '../../lib/constants';
import Chip from '../shared/Chip';

export default function FilterBar({ teams, selectedTeam, onSelectTeam, selectedType, onSelectType, showCancelled, onToggleCancelled, hideTeamRow = false }) {
  const uniqueTeams = [];
  const seen = new Set();
  const activeTypes = new Set();
  (teams || []).forEach((a) => {
    if (a.event_type) activeTypes.add(a.event_type);
    if (a.team_id && !seen.has(a.team_id) && a.teams) {
      seen.add(a.team_id);
      uniqueTeams.push({ id: a.team_id, name: a.teams.name, team_color: a.teams.team_color, sort_order: a.teams.sort_order });
    }
  });
  uniqueTeams.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  const visibleTypes = TYPE_OPTIONS.filter((opt) => opt.key === null || activeTypes.has(opt.key));

  return (
    <div style={{ padding: '8px 0' }}>
      {!hideTeamRow && (
      <div className="flex gap-2 flex-wrap" style={{ paddingBottom: 6 }}>
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
      )}
      <div className="flex gap-2 flex-wrap">
        {visibleTypes.map((opt) => (
          <Chip
            key={opt.key || 'all'}
            label={opt.label}
            active={selectedType === opt.key}
            onClick={() => onSelectType(selectedType === opt.key ? null : opt.key)}
          />
        ))}
      </div>
      {onToggleCancelled && (
        <button type="button" onClick={onToggleCancelled}
          style={{ fontSize: 13, color: 'var(--em-text-tertiary)', background: 'none', border: 'none', padding: '4px 0', marginTop: 4, minHeight: 44, fontFamily: 'inherit' }}>
          {showCancelled ? 'Hide cancelled' : 'Show cancelled'}
        </button>
      )}
    </div>
  );
}
