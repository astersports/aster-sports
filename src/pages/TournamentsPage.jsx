import { useState } from 'react';
import { Plus, Trophy } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTournaments } from '../hooks/useTournaments';
import Button from '../components/shared/Button';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import TournamentListItem from '../components/tournament/TournamentListItem';
import TournamentFormSheet from '../components/tournament/TournamentFormSheet';
import TournamentRowMenu from '../components/tournament/TournamentRowMenu';
import TournamentStatusChips from '../components/tournament/TournamentStatusChips';

// Tournaments list page. Admin sees org-wide list. If mounted under
// /teams/:teamId/tournaments (from team detail tab in 2A-γ), filters to that
// team. Status filter chips for quick narrowing. No + New button yet
// (ships in 2A-γ with the form sheet).

export default function TournamentsPage() {
  const { role } = useAuth();
  const { teamId } = useParams();
  const [statusFilter, setStatusFilter] = useState('all');
  const { tournaments, loading, error, hasMore, loadMore, archive } = useTournaments({
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', margin: 0 }}>
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
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--em-text-secondary)', fontSize: 15 }}>
          Loading...
        </div>
      )}

      {error && (
        <div style={{ padding: 16, color: 'var(--em-danger)', fontSize: 13 }}>
          {error.message || 'Failed to load tournaments'}
        </div>
      )}

      {!loading && !error && tournaments.length === 0 && (
        <div style={{ padding: '48px 16px', textAlign: 'center' }}>
          <Trophy size={32} strokeWidth={1.5} color="var(--em-text-tertiary)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 4 }}>
            No tournaments yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
            {role === 'admin' || role === 'coach' ? 'Tap + New to create one.' : 'Check back when your team signs up.'}
          </div>
        </div>
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

      {hasMore && !loading && (
        <button
          type="button"
          onClick={loadMore}
          className="sf-press"
          style={{
            width: '100%', minHeight: 44, marginTop: 8,
            borderRadius: 10, border: '1px solid var(--em-border-default)',
            backgroundColor: 'var(--em-bg-card)', color: 'var(--em-accent)',
            fontSize: 15, fontWeight: 500,
          }}
        >
          Load more
        </button>
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
