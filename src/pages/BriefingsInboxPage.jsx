import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { useBriefingQueue } from '../hooks/useBriefingQueue';
import BriefingTournamentGroup from '../components/briefings/BriefingTournamentGroup';
import BriefingRow from '../components/briefings/BriefingRow';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import EmptyState from '../components/shared/EmptyState';
import TournamentBriefing from '../components/event/TournamentBriefing';
import DigestComposeButton from '../components/admin/briefings/DigestComposeButton';

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

function chipStyle(active) {
  return {
    minHeight: 32,
    padding: '0 12px',
    borderRadius: 9999,
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    backgroundColor: active ? 'var(--em-accent)' : 'var(--em-bg-secondary)',
    color: active ? 'var(--em-text-inverse)' : 'var(--em-text-secondary)',
  };
}

export default function BriefingsInboxPage() {
  const { rows, loading, error, refresh } = useBriefingQueue();
  const [filter, setFilter] = useState('all');
  const [composerRow, setComposerRow] = useState(null);
  const [params, setParams] = useSearchParams();

  // Deep-link: ?tournament=ID&team=ID auto-opens the matching row's composer
  useEffect(() => {
    const tId = params.get('tournament');
    const teamId = params.get('team');
    if (!tId || !teamId || !rows.length || composerRow) return undefined;
    const match = rows.find((r) => r.tournament_id === tId && r.team_id === teamId);
    if (!match) return undefined;
    Promise.resolve().then(() => {
      setComposerRow(match);
      const next = new URLSearchParams(params);
      next.delete('tournament'); next.delete('team');
      setParams(next, { replace: true });
    });
    return undefined;
  }, [rows, params, composerRow, setParams]);

  const filtered = useMemo(() => {
    if (filter === 'all') return rows;
    return rows.filter((r) => r.tournamentState === filter);
  }, [rows, filter]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const row of filtered) {
      if (!map.has(row.tournament_id)) {
        map.set(row.tournament_id, {
          tournament_id: row.tournament_id,
          tournament_name: row.tournament_name,
          tournament_start_date: row.tournament_start_date,
          rows: [],
        });
      }
      map.get(row.tournament_id).rows.push(row);
    }
    return [...map.values()];
  }, [filtered]);

  const composerEvent = composerRow ? {
    tournament_id: composerRow.tournament_id,
    tournament_name: composerRow.tournament_name,
    team_id: composerRow.team_id,
  } : null;
  const composerTeam = composerRow ? {
    id: composerRow.team_id,
    name: composerRow.team_name,
    team_color: composerRow.team_color,
    sort_order: composerRow.team_sort_order,
  } : null;

  const handleClose = () => {
    setComposerRow(null);
    refresh();
  };

  return (
    <div className="px-4 py-4 sf-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-primary)', letterSpacing: '-0.01em' }}>Briefings</h1>
          <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>One row per tournament-team decision in the active season.</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)} className="sf-press" style={chipStyle(filter === f.key)}>
              {f.label}
            </button>
          ))}
          <DigestComposeButton />
        </div>
      </div>

      {loading && <LoadingSkeleton variant="card" count={4} />}
      {error && (
        <div style={{ padding: 16, borderRadius: 10, backgroundColor: 'var(--em-danger-soft)', color: 'var(--em-text-primary)', fontSize: 14 }}>
          Couldn&rsquo;t load the briefing queue. {error.message || 'Try again in a moment.'}
          <button type="button" onClick={refresh} style={{ marginLeft: 12, fontSize: 13, fontWeight: 600, color: 'var(--em-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
        </div>
      )}
      {!loading && !error && grouped.length === 0 && (
        <EmptyState
          icon={Inbox}
          title={filter === 'all' ? 'No briefings this season' : `No ${filter} briefings`}
          description={filter === 'all' ? 'Briefings appear here once tournaments are scheduled in the active season.' : `Switch to All to see other tournament states.`}
        />
      )}

      {!loading && !error && grouped.map((g) => (
        <BriefingTournamentGroup key={g.tournament_id} startDate={g.tournament_start_date} name={g.tournament_name}>
          {g.rows.map((row) => (
            <BriefingRow key={`${row.tournament_id}-${row.team_id}`} row={row} onOpen={setComposerRow} />
          ))}
        </BriefingTournamentGroup>
      ))}

      {composerRow && (
        <TournamentBriefing event={composerEvent} team={composerTeam} onClose={handleClose} />
      )}
    </div>
  );
}
