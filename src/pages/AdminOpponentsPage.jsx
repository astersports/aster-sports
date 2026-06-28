// §4.O PR C — Admin opponents directory. Lists opponents for the org
// with H2H record, last-played date, and scouting-note hint. Search
// filters by name, city, state, or circuit. Mounts AdminManagerLayout
// per §4.N.4 design lock. Read-only in this PR; edit / add lands
// later with OpponentFormSheet.
//
// V-33 part 1 closure per ADMIN_SESSION_SCOPE.md Tier 1.
// Route: /admin/opponents (admin-only).
//
// L99 enhancement pass (claude/l99-enhancements): circuit filter chips +
// sort, win-rate + circuit badges, near-duplicate flag, expandable
// scouting notes, copy-name action, summary strip, error + result-count
// states, responsive list — extracted into src/components/admin-opponents/.

import { useMemo, useState } from 'react';
import { Swords } from 'lucide-react';
import AdminManagerLayout from '../components/admin/AdminManagerLayout';
import { useOpponents } from '../hooks/useOpponents';
import OpponentCard from '../components/admin-opponents/OpponentCard';
import OpponentFilterBar from '../components/admin-opponents/OpponentFilterBar';
import OpponentsErrorState from '../components/admin-opponents/OpponentsErrorState';
import {
  circuitLabel,
  duplicateNameSet,
  formatLastPlayed,
  gamesPlayed,
  isDuplicate,
  matchesOpponent,
  sortOpponents,
} from '../components/admin-opponents/opponentUtils';

export default function AdminOpponentsPage() {
  const { opponents, loading, error, refetch } = useOpponents();
  const [search, setSearch] = useState('');
  const [circuit, setCircuit] = useState('all');
  const [sort, setSort] = useState('name');
  // Lazy init runs once — keeps Date.now() out of the render body so
  // relative "Last played" labels stay pure across re-renders.
  const [nowMs] = useState(() => Date.now());

  const circuitOptions = useMemo(() => {
    const counts = new Map();
    for (const o of opponents) counts.set(o.circuit, (counts.get(o.circuit) || 0) + 1);
    const opts = [{ value: 'all', label: 'All', count: opponents.length }];
    for (const [value, count] of counts) opts.push({ value, label: circuitLabel(value), count });
    return opts;
  }, [opponents]);

  const dupeSet = useMemo(() => duplicateNameSet(opponents || []), [opponents]);

  const filtered = useMemo(() => {
    const q = search.trim();
    const list = (opponents || []).filter(
      (o) => (circuit === 'all' || o.circuit === circuit) && matchesOpponent(o, q),
    );
    return sortOpponents(list, sort);
  }, [opponents, search, circuit, sort]);

  const totalGames = useMemo(
    () => opponents.reduce((s, o) => s + gamesPlayed(o), 0),
    [opponents],
  );
  const subtitle = loading
    ? null
    : `${opponents.length} opponent${opponents.length === 1 ? '' : 's'} · ${totalGames} game${totalGames === 1 ? '' : 's'} played`;

  const filtering = !!search.trim() || circuit !== 'all';

  return (
    <AdminManagerLayout
      title="Opponents"
      subtitle={subtitle}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by name, city, or circuit…"
      loading={loading}
      isEmpty={!loading && !error && filtered.length === 0}
      emptyIcon={Swords}
      emptyTitle={filtering ? 'No matches' : 'No opponents yet'}
      emptyDescription={filtering ? 'Try a different search or circuit.' : 'Opponents appear here after games are entered.'}
    >
      {error ? (
        <OpponentsErrorState onRetry={refetch} />
      ) : (
        <>
          {opponents.length > 0 && (
            <OpponentFilterBar
              circuits={circuitOptions}
              circuit={circuit}
              onCircuit={setCircuit}
              sort={sort}
              onSort={setSort}
            />
          )}
          {filtering && filtered.length > 0 && (
            <div
              aria-live="polite"
              style={{ color: 'var(--as-text-tertiary)', fontSize: 12, marginBottom: 8 }}
            >
              {filtered.length} match{filtered.length === 1 ? '' : 'es'}
            </div>
          )}
          <ul className="flex flex-col gap-2">
            {filtered.map((o) => (
              <OpponentCard
                key={o.id}
                opponent={o}
                lastPlayedLabel={formatLastPlayed(o.last_played_at, nowMs)}
                duplicate={isDuplicate(o, dupeSet)}
              />
            ))}
          </ul>
        </>
      )}
    </AdminManagerLayout>
  );
}
