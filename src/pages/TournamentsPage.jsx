import { useState } from 'react';
import { Plus, Trophy } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTournaments } from '../hooks/useTournaments';
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
  const openCreate = () => { setEditingTournament(null); setFormOpen(true); };
  const openEdit = (t) => { setEditingTournament(t); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditingTournament(null); };
  const handleArchive = async (t) => {
    if (!window.confirm(`Archive "${t.name}"? This hides it from the list but preserves all data.`)) return;
    await archive(t.id);
  };
  const authReady = role !== undefined && role !== null;
  const isStaff = authReady && (role === 'admin' || role === 'coach');

  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--sf-text-primary)', margin: 0 }}>
          Tournaments
        </h1>
        {isStaff && (
          <button type="button" onClick={openCreate} className="sf-press" aria-label="New tournament" style={{
            minHeight: 40, padding: '0 14px', borderRadius: 10,
            backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-inverse)',
            fontSize: 13, fontWeight: 600, border: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Plus size={16} strokeWidth={2} /> New
          </button>
        )}
      </div>

      <TournamentStatusChips statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

      {loading && tournaments.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--sf-text-secondary)', fontSize: 14 }}>
          Loading...
        </div>
      )}

      {error && (
        <div style={{ padding: 16, color: 'var(--sf-danger)', fontSize: 13 }}>
          {error.message || 'Failed to load tournaments'}
        </div>
      )}

      {!loading && !error && tournaments.length === 0 && (
        <div style={{ padding: '48px 16px', textAlign: 'center' }}>
          <Trophy size={32} strokeWidth={1.5} color="var(--sf-text-tertiary)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sf-text-primary)', marginBottom: 4 }}>
            No tournaments yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--sf-text-secondary)' }}>
            {role === 'admin' || role === 'coach' ? 'Create form ships next.' : 'Check back when your team signs up.'}
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
            borderRadius: 10, border: '1px solid var(--sf-border-default)',
            backgroundColor: 'var(--sf-bg-card)', color: 'var(--sf-accent)',
            fontSize: 14, fontWeight: 500,
          }}
        >
          Load more
        </button>
      )}

      {formOpen && (
        <TournamentFormSheet tournament={editingTournament} onClose={closeForm} />
      )}
    </div>
  );
}
