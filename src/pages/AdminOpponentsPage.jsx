// §4.O PR C — Admin opponents directory. Lists opponents for the org
// with H2H record, last-played date, and scouting-note hint. Search
// filters by name, city, state, or circuit. Mounts AdminManagerLayout
// per §4.N.4 design lock. Read-only in this PR; edit / add lands
// later with OpponentFormSheet.
//
// V-33 part 1 closure per ADMIN_SESSION_SCOPE.md Tier 1.
// Route: /admin/opponents (admin-only).

import { useMemo, useState } from 'react';
import { Swords } from 'lucide-react';
import AdminManagerLayout from '../components/admin/AdminManagerLayout';
import { useOpponents } from '../hooks/useOpponents';

const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };

function matches(o, q) {
  if (!q) return true;
  const haystack = [o.name, o.city, o.state, o.circuit, CIRCUIT_LABELS[o.circuit]]
    .filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function formatRecord(o) {
  const w = o.head_to_head_wins || 0;
  const l = o.head_to_head_losses || 0;
  if (w === 0 && l === 0) return 'No games played';
  return `${w}-${l}`;
}

function formatLastPlayed(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
}

export default function AdminOpponentsPage() {
  const { opponents, loading } = useOpponents();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => (opponents || []).filter((o) => matches(o, search.trim())),
    [opponents, search],
  );

  const totalGames = opponents.reduce((s, o) => s + (o.head_to_head_wins || 0) + (o.head_to_head_losses || 0), 0);
  const subtitle = loading
    ? null
    : `${opponents.length} opponent${opponents.length === 1 ? '' : 's'} · ${totalGames} game${totalGames === 1 ? '' : 's'} played`;

  return (
    <AdminManagerLayout
      title="Opponents"
      subtitle={subtitle}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by name, city, or circuit…"
      loading={loading}
      isEmpty={!loading && filtered.length === 0}
      emptyIcon={Swords}
      emptyTitle={search ? 'No matches' : 'No opponents yet'}
      emptyDescription={search ? 'Try a different search term.' : 'Opponents appear here after games are entered.'}
    >
      <ul className="flex flex-col gap-2">
        {filtered.map((o) => {
          const locationLine = [o.city, o.state].filter(Boolean).join(', ');
          const lastPlayed = formatLastPlayed(o.last_played_at);
          const metaLine = [
            CIRCUIT_LABELS[o.circuit] || o.circuit,
            locationLine,
            lastPlayed ? `Last played ${lastPlayed}` : null,
          ].filter(Boolean).join(' · ');
          return (
            <li
              key={o.id}
              style={{
                backgroundColor: 'var(--as-bg-card)',
                borderRadius: 10,
                border: '1px solid var(--as-border-subtle)',
                boxShadow: 'var(--as-shadow-sm)',
                padding: 16,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold" style={{ color: 'var(--as-text-primary)', fontSize: 17 }}>
                  {o.name}
                </span>
                <span style={{ color: 'var(--as-text-secondary)', fontSize: 13, fontWeight: 600 }}>
                  {formatRecord(o)}
                </span>
              </div>
              {metaLine && (
                <div style={{ color: 'var(--as-text-secondary)', fontSize: 13, marginBottom: o.scouting_notes ? 4 : 0 }}>
                  {metaLine}
                </div>
              )}
              {o.scouting_notes && (
                <div style={{ color: 'var(--as-text-tertiary)', fontSize: 12, lineHeight: 1.5, fontStyle: 'italic' }}>
                  {o.scouting_notes}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </AdminManagerLayout>
  );
}
