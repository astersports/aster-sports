import { useMemo } from 'react';
import { TYPE_OPTIONS } from '../../lib/constants';
import FilterSelect from '../shared/FilterSelect';
import Chip from '../shared/Chip';

export default function FilterBar({ teams, selectedTeam, onSelectTeam, selectedType, onSelectType, showCancelled, onToggleCancelled, hideTeamRow = false }) {
  const teamChips = useMemo(() => {
    const unique = [];
    const seen = new Set();
    (teams || []).forEach((a) => {
      if (a.team_id && !seen.has(a.team_id) && a.teams) {
        seen.add(a.team_id);
        unique.push({ id: a.team_id, name: a.teams.name, color: a.teams.team_color, sort: a.teams.sort_order ?? 999 });
      }
    });
    unique.sort((a, b) => a.sort - b.sort);
    return unique;
  }, [teams]);

  const typeOptions = useMemo(() => {
    const activeTypes = new Set();
    (teams || []).forEach((a) => { if (a.event_type) activeTypes.add(a.event_type); });
    return TYPE_OPTIONS.filter((opt) => opt.key === null || activeTypes.has(opt.key))
      .map((opt) => ({ value: opt.key, label: opt.label }));
  }, [teams]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
      {!hideTeamRow && teamChips.length > 0 && (
        <div className="sf-no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <Chip label="All" active={!selectedTeam} onClick={() => onSelectTeam(null)} />
          {teamChips.map((t) => (
            <Chip key={t.id} label={t.name} color={t.color} active={selectedTeam === t.id} onClick={() => onSelectTeam(t.id)} />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FilterSelect value={selectedType} onChange={onSelectType} options={typeOptions} ariaLabel="Filter by type" />
        {onToggleCancelled && (
          <button type="button" onClick={onToggleCancelled}
            style={{ fontSize: 13, color: 'var(--em-text-tertiary)', background: 'none', border: 'none', padding: '4px 0', minHeight: 44, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            {showCancelled ? 'Hide cancelled' : 'Show cancelled'}
          </button>
        )}
      </div>
    </div>
  );
}
