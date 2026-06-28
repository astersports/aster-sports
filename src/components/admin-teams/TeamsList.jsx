import { SearchX, Users } from 'lucide-react';
import TeamRow from './TeamRow';
import EmptyState from '../shared/EmptyState';

// Renders the filtered team list for AdminTeamsPage, plus the live
// result-count line and a distinct "no matches" state (vs the page's
// "no teams at all" empty state). aria-live on the count so screen
// readers hear "2 of 5 teams" as filters change (§16.4). Token-only.
export default function TeamsList({ teams, total, density, filtered, onEdit, onClearFilters }) {
  if (teams.length === 0 && filtered) {
    return (
      <EmptyState
        icon={SearchX}
        title="No teams match"
        description="No teams match those filters. Try a different search or clear the filters."
        action={
          <button
            type="button"
            onClick={onClearFilters}
            className="as-press font-semibold"
            style={{
              minHeight: 44, padding: '0 20px', borderRadius: 10, fontSize: 15,
              backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Clear filters
          </button>
        }
      />
    );
  }

  if (teams.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No teams yet"
        description="Add teams from each program — open Programs to get started."
      />
    );
  }

  return (
    <>
      <div
        aria-live="polite"
        style={{ color: 'var(--as-text-secondary)', fontSize: 13, marginBottom: 8 }}
      >
        {filtered ? `${teams.length} of ${total} teams` : `${total} ${total === 1 ? 'team' : 'teams'}`}
      </div>
      <ul className="flex flex-col gap-2">
        {teams.map((p) => (
          <li key={p.id}>
            <TeamRow team={p} density={density} onEdit={onEdit} />
          </li>
        ))}
      </ul>
    </>
  );
}
