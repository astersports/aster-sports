import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTournaments } from '../hooks/useTournaments';
import TournamentListItem from '../components/tournament/TournamentListItem';

// Tournaments list page. Admin sees org-wide list. If mounted under
// /teams/:teamId/tournaments (from team detail tab in 2A-γ), filters to that
// team. Status filter chips for quick narrowing. No + New button yet
// (ships in 2A-γ with the form sheet).

const STATUS_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'Live' },
  { value: 'complete', label: 'Complete' },
];

export default function TournamentsPage() {
  const { role } = useAuth();
  const { teamId } = useParams();
  const [statusFilter, setStatusFilter] = useState('all');
  const { tournaments, loading, error, hasMore, loadMore } = useTournaments({
    teamId,
    statusFilter,
  });

  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--sf-text-primary)', margin: '0 0 14px' }}>
        Tournaments
      </h1>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {STATUS_CHIPS.map((c) => {
          const active = statusFilter === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setStatusFilter(c.value)}
              className="sf-press"
              aria-pressed={active}
              style={{
                minHeight: 32, padding: '0 12px', borderRadius: 999,
                border: `1.5px solid ${active ? 'var(--sf-accent)' : 'var(--sf-border-default)'}`,
                backgroundColor: active ? 'var(--sf-accent-soft)' : 'var(--sf-bg-card)',
                color: active ? 'var(--sf-accent)' : 'var(--sf-text-primary)',
                fontSize: 12, fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

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
        <TournamentListItem key={t.id} tournament={t} />
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
    </div>
  );
}
