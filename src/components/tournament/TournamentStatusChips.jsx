import FilterSelect from '../shared/FilterSelect';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in_progress', label: 'Live' },
  { value: 'complete', label: 'Complete' },
];

export default function TournamentStatusChips({ statusFilter, setStatusFilter }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <FilterSelect
        value={statusFilter}
        onChange={(v) => setStatusFilter(v || 'all')}
        options={STATUS_OPTIONS}
        ariaLabel="Filter by status"
      />
    </div>
  );
}
