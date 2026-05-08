import FilterSelect from '../shared/FilterSelect';

export default function TeamSwitcher({ programs, teamId, navigate }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <FilterSelect
        value={teamId}
        onChange={(v) => { if (v && v !== teamId) { navigator.vibrate?.(10); navigate(`/teams/${v}`); } }}
        options={programs.map((p) => ({ value: p.id, label: p.name, color: p.team_color }))}
        ariaLabel="Switch team"
      />
    </div>
  );
}
