import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { usePrograms } from '../hooks/usePrograms';
import { useSeason } from '../context/SeasonContext';
import Badge from '../components/shared/Badge';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';

// Labels mirror AdminTeamsPage — duplicated intentionally so this file
// stays self-contained until we extract circuit/day labels into
// lib/constants.js during a dedicated cleanup pass.
const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

// Public teams list. Every signed-in user — admin, coach, parent — sees
// all teams in the active season, sorted oldest-to-youngest via the
// usePrograms() sort_order query. Tapping a card routes to
// /teams/:teamId where the roster lives.
export default function TeamsPage() {
  const { activeSeason } = useSeason();
  const { programs, loading } = usePrograms();
  const navigate = useNavigate();

  return (
    <div className="px-4 py-4 sf-fade-in overflow-x-hidden" style={{ maxWidth: '100%' }}>
      <div className="mb-4">
        <h1 className="font-bold" style={{ color: 'var(--sf-text-primary)', fontSize: 22 }}>
          Teams
        </h1>
        {activeSeason && (
          <div style={{ color: 'var(--sf-text-secondary)', fontSize: 13 }}>{activeSeason.name}</div>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton variant="card" count={5} />
      ) : programs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Teams will appear here once an admin adds them."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {programs.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => navigate(`/teams/${p.id}`)}
                className="w-full text-left p-4 sf-press"
                style={{
                  backgroundColor: 'var(--sf-bg-card)',
                  borderRadius: 10,
                  border: '1px solid var(--sf-border-default)',
                  borderLeft: `4px solid ${p.team_color || 'var(--sf-border-default)'}`,
                  boxShadow: 'var(--sf-shadow-sm)',
                  minHeight: 44,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold" style={{ color: 'var(--sf-text-primary)', fontSize: 16 }}>
                    {p.name}
                  </span>
                  <div className="flex gap-1">
                    <Badge>{p.age_group}</Badge>
                    <Badge variant="info">{CIRCUIT_LABELS[p.circuit] || p.circuit}</Badge>
                  </div>
                </div>
                <div style={{ color: 'var(--sf-text-secondary)', fontSize: 13 }}>
                  {p.practice_day ? DAY_LABELS[p.practice_day] : 'No practice day set'}
                  {p.practice_location ? ` · ${p.practice_location}` : ''}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
