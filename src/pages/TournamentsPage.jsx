import { useState } from 'react';
import { Plus, Trophy } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTournaments } from '../hooks/useTournaments';
import Button from '../components/shared/Button';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import TournamentListItem from '../components/tournament/TournamentListItem';
import AdminBackHeader from '../components/admin/AdminBackHeader';
import TournamentFormSheet from '../components/tournament/TournamentFormSheet';
import TournamentRowMenu from '../components/tournament/TournamentRowMenu';
import TournamentStatusChips from '../components/tournament/TournamentStatusChips';
import TournamentsListSkeleton from '../components/tournaments/TournamentsListSkeleton';
import TournamentsEmptyState from '../components/tournaments/TournamentsEmptyState';
import TournamentsErrorState from '../components/tournaments/TournamentsErrorState';
import TournamentsResultCount from '../components/tournaments/TournamentsResultCount';
import TournamentsLoadMore from '../components/tournaments/TournamentsLoadMore';

// Tournaments list page. Admin sees org-wide list. If mounted under
// /teams/:teamId/tournaments (from team detail tab in 2A-γ), filters to that
// team. Status filter chips for quick narrowing. No + New button yet
// (ships in 2A-γ with the form sheet).

export default function TournamentsPage() {
  const { role } = useAuth();
  const { teamId } = useParams();
  const [statusFilter, setStatusFilter] = useState('all');
  const { tournaments, loading, error, hasMore, loadMore, archive, refetch } = useTournaments({
    teamId,
    statusFilter,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const openCreate = () => { setEditingTournament(null); setFormOpen(true); };
  const openEdit = (t) => { setEditingTournament(t); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditingTournament(null); };
  const handleArchive = (t) => {
    setConfirmAction({ type: 'archive', tournament: t });
  };
  const authReady = role !== undefined && role !== null;
  const isStaff = authReady && (role === 'admin' || role === 'coach');

  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <AdminBackHeader />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={20} strokeWidth={1.75} color="var(--as-accent)" aria-hidden="true" />
          Tournaments
        </h1>
        {isStaff && (
          <Button size="sm" onClick={openCreate} aria-label="New tournament">
            <Plus size={16} strokeWidth={2} /> New
          </Button>
        )}
      </div>

      <TournamentStatusChips statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

      {loading && tournaments.length === 0 && (
        <TournamentsListSkeleton rows={4} />
      )}

      {error && tournaments.length === 0 && (
        <TournamentsErrorState onRetry={() => refetch()} retrying={loading} />
      )}

      {tournaments.length > 0 && (
        <TournamentsResultCount count={tournaments.length} hasMore={hasMore} />
      )}

      {!loading && !error && tournaments.length === 0 && (
        <TournamentsEmptyState
          isStaff={isStaff}
          filtered={statusFilter !== 'all'}
          onClear={() => setStatusFilter('all')}
          onCreate={openCreate}
        />
      )}

      {tournaments.map((t) => (
        <TournamentListItem
          key={t.id}
          tournament={t}
          rightSlot={isStaff ? (
            <TournamentRowMenu onEdit={() => openEdit(t)} onArchive={() => handleArchive(t)} />
          ) : null}
        />
      ))}

      {hasMore && tournaments.length > 0 && (
        <TournamentsLoadMore onClick={loadMore} loading={loading} />
      )}

      {formOpen && (
        <TournamentFormSheet tournament={editingTournament} onClose={closeForm} />
      )}
      {confirmAction?.type === 'archive' && (
        <ConfirmDialog title="Archive Tournament" message={`Archive "${confirmAction.tournament.name}"? This hides it from the list but preserves all data.`} confirmLabel="Archive" destructive onConfirm={async () => { await archive(confirmAction.tournament.id); setConfirmAction(null); }} onCancel={() => setConfirmAction(null)} />
      )}
    </div>
  );
}
