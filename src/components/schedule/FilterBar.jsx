import { useMemo } from 'react';
import { TYPE_OPTIONS } from '../../lib/constants';
import FilterSelect from '../shared/FilterSelect';

export default function FilterBar({ teams, selectedTeam, onSelectTeam, selectedType, onSelectType, showCancelled, onToggleCancelled, hideTeamRow = false }) {
  const teamOptions = useMemo(() => {
    const unique = [];
    const seen = new Set();
    (teams || []).forEach((a) => {
      if (a.team_id && !seen.has(a.team_id) && a.teams) {
        seen.add(a.team_id);
        unique.push({ value: a.team_id, label: a.teams.name, color: a.teams.team_color, sort: a.teams.sort_order ?? 999 });
      }
    });
    unique.sort((a, b) => a.sort - b.sort);
    return [{ value: null, label: 'All Teams' }, ...unique];
  }, [teams]);

  const typeOptions = useMemo(() => {
    const activeTypes = new Set();
    (teams || []).forEach((a) => { if (a.event_type) activeTypes.add(a.event_type); });
    return TYPE_OPTIONS.filter((opt) => opt.key === null || activeTypes.has(opt.key))
      .map((opt) => ({ value: opt.key, label: opt.label }));
  }, [teams]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', flexWrap: 'wrap' }}>
      {!hideTeamRow && (
        <FilterSelect value={selectedTeam} onChange={onSelectTeam} options={teamOptions} ariaLabel="Filter by team" />
      )}
      <FilterSelect value={selectedType} onChange={onSelectType} options={typeOptions} ariaLabel="Filter by type" />
      {onToggleCancelled && (
        <button type="button" onClick={onToggleCancelled}
          style={{ fontSize: 13, color: 'var(--em-text-tertiary)', background: 'none', border: 'none', padding: '4px 0', minHeight: 44, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          {showCancelled ? 'Hide cancelled' : 'Show cancelled'}
        </button>
      )}
    </div>
  );
}
