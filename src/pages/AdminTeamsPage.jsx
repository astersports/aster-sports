import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useActiveSeasonTeams } from '../hooks/useActiveSeasonTeams';
import { useSeason } from '../context/SeasonContext';
import { useDensity } from '../hooks/useDensity';
import AdminBackHeader from '../components/admin/AdminBackHeader';
import TeamFormSheet from '../components/admin/TeamFormSheet';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import Toast from '../components/shared/Toast';
import TeamsFilterBar from '../components/admin-teams/TeamsFilterBar';
import TeamsList from '../components/admin-teams/TeamsList';
import TeamsErrorState from '../components/admin-teams/TeamsErrorState';

export default function AdminTeamsPage() {
  const { activeSeason } = useSeason();
  const { teams, loading, error, refetch, createTeam, updateTeam, deleteTeam } = useActiveSeasonTeams();
  const { density } = useDensity('admin_teams', 'maximum');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState('');
  const [circuit, setCircuit] = useState('all');
  const [sort, setSort] = useState('age');
  const [hiddenIds, setHiddenIds] = useState([]); // optimistic-delete overlay

  const openEdit = (p) => { setEditing(p); setSheetOpen(true); };
  const clearFilters = () => { setQuery(''); setCircuit('all'); };
  const filtered = query.trim() !== '' || circuit !== 'all';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = teams
      .filter((t) => !hiddenIds.includes(t.id))
      .filter((t) => circuit === 'all' || t.circuit === circuit)
      .filter((t) => q === '' || (t.name || '').toLowerCase().includes(q));
    return sort === 'name'
      ? [...rows].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      : rows; // 'age' keeps hook's sort_order (oldest → youngest)
  }, [teams, hiddenIds, circuit, query, sort]);

  const save = async (payload) => {
    const { error: e } = editing ? await updateTeam(editing.id, payload) : await createTeam(payload);
    if (e) setToast({ message: e, variant: 'error' });
    else {
      setToast({ message: editing ? 'Team updated' : 'Team created', variant: 'success' });
      setSheetOpen(false);
    }
  };

  // Optimistic delete: hide the row immediately, roll back + toast on error.
  const remove = async (id) => {
    setSheetOpen(false);
    setHiddenIds((ids) => [...ids, id]);
    const { error: e } = await deleteTeam(id);
    if (e) {
      setHiddenIds((ids) => ids.filter((x) => x !== id));
      setToast({ message: 'Looks like that didn’t go through. Try again?', variant: 'error' });
    } else {
      setHiddenIds((ids) => ids.filter((x) => x !== id));
      setToast({ message: 'Team deleted', variant: 'success' });
    }
  };

  if (!activeSeason && !loading && teams.length === 0) {
    return (
      <div className="px-4 py-4">
        <AdminBackHeader />
        <EmptyState
          icon={Users}
          title="No active season"
          description="Create and activate a season before adding teams."
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 as-fade-in overflow-x-hidden" style={{ maxWidth: '100%' }}>
      <AdminBackHeader />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20 }}>
            Teams
          </h1>
          {activeSeason && (
            <div style={{ color: 'var(--as-text-secondary)', fontSize: 13 }}>{activeSeason.name}</div>
          )}
        </div>
        <Link to="/admin/programs" className="as-press" style={{ color: 'var(--as-accent)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          Programs →
        </Link>
      </div>

      {error ? (
        <TeamsErrorState onRetry={refetch} />
      ) : loading ? (
        <LoadingSkeleton variant="card" count={4} />
      ) : (
        <>
          {teams.length > 0 && (
            <TeamsFilterBar
              query={query}
              onQuery={setQuery}
              circuit={circuit}
              onCircuit={setCircuit}
              sort={sort}
              onSort={setSort}
            />
          )}
          <TeamsList
            teams={visible}
            total={teams.filter((t) => !hiddenIds.includes(t.id)).length}
            density={density}
            filtered={filtered}
            onEdit={openEdit}
            onClearFilters={clearFilters}
          />
        </>
      )}

      <TeamFormSheet
        open={sheetOpen}
        program={editing}
        programType={activeSeason?.program_type ?? 'season'}
        onClose={() => setSheetOpen(false)}
        onSave={save}
        onDelete={remove}
      />
      <Toast
        message={toast?.message}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
