import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useActiveSeasonTeams } from '../hooks/useActiveSeasonTeams';
import { useSeason } from '../context/SeasonContext';
import AdminBackHeader from '../components/admin/AdminBackHeader';
import TeamFormSheet from '../components/admin/TeamFormSheet';
import Badge from '../components/shared/Badge';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import Toast from '../components/shared/Toast';

const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

export default function AdminTeamsPage() {
  const { activeSeason } = useSeason();
  const { teams, loading, createTeam, updateTeam, deleteTeam } = useActiveSeasonTeams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const openEdit = (p) => { setEditing(p); setSheetOpen(true); };

  const save = async (payload) => {
    const { error } = editing
      ? await updateTeam(editing.id, payload)
      : await createTeam(payload);
    if (error) setToast({ message: error, variant: 'error' });
    else {
      setToast({ message: editing ? 'Team updated' : 'Team created', variant: 'success' });
      setSheetOpen(false);
    }
  };

  const remove = async (id) => {
    const { error } = await deleteTeam(id);
    if (error) setToast({ message: error, variant: 'error' });
    else {
      setToast({ message: 'Team deleted', variant: 'success' });
      setSheetOpen(false);
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

      {loading ? (
        <LoadingSkeleton variant="card" count={4} />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Add teams from each program — open Programs to get started."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {teams.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => openEdit(p)}
                className="w-full text-left p-4 as-press"
                style={{
                  backgroundColor: 'var(--as-bg-card)',
                  borderRadius: 10,
                  border: '1px solid var(--as-border-subtle)',
                  borderLeft: `4px solid ${p.team_color || 'var(--as-border-default)'}`,
                  boxShadow: 'var(--as-shadow-sm)',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold" style={{ color: 'var(--as-text-primary)', fontSize: 17 }}>
                    {p.name}
                  </span>
                  <div className="flex gap-1">
                    <Badge>{p.age_group}</Badge>
                    <Badge variant="info">{CIRCUIT_LABELS[p.circuit] || p.circuit}</Badge>
                  </div>
                </div>
                <div style={{ color: 'var(--as-text-secondary)', fontSize: 13 }}>
                  {p.practice_day ? `${DAY_LABELS[p.practice_day]}` : 'No practice day set'}
                  {p.practice_location ? ` · ${p.practice_location}` : ''}
                  {p.circuit === 'aau' && p.circuit_name ? ` · ${p.circuit_name}` : ''}
                </div>
              </button>
            </li>
          ))}
        </ul>
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
