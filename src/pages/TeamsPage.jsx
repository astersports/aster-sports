import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { usePrograms } from '../hooks/usePrograms';
import { useSeason } from '../context/SeasonContext';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import EmptyState from '../components/shared/EmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';

// Labels mirror AdminTeamsPage — duplicated intentionally so this file
// stays self-contained until we extract circuit/day labels into
// lib/constants.js during a dedicated cleanup pass.
const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };

// Public teams list. Every signed-in user — admin, coach, parent — sees
// all teams in the active season, sorted oldest-to-youngest via the
// usePrograms() sort_order query. Tapping a card routes to
// /teams/:teamId where the roster lives.
export default function TeamsPage() {
  const { activeSeason } = useSeason();
  const { programs, loading, refetch } = usePrograms();
  const navigate = useNavigate();
  const { refreshing, onTouchStart, onTouchEnd } = usePullToRefresh(() => refetch?.());

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="px-4 py-4 sf-fade-in overflow-x-hidden" style={{ maxWidth: '100%' }}>
      <div style={{ marginBottom: 4 }}>
        <h1 className="font-bold" style={{ color: 'var(--sf-text-primary)', fontSize: 20, letterSpacing: '-0.025em' }}>
          Teams
        </h1>
        <div style={{ fontSize: 13, color: 'var(--sf-text-tertiary)', marginTop: 2 }}>
          {activeSeason?.name || 'No active season'} · {programs.length} teams
        </div>
        <div style={{ width: 32, height: 3, borderRadius: 999, backgroundColor: 'var(--sf-accent)', marginTop: 8 }} />
      </div>

      {refreshing && (
        <div className="flex justify-center py-3">
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '2px solid var(--sf-accent)',
            borderTopColor: 'transparent',
            animation: 'spin 0.6s linear infinite',
          }} />
        </div>
      )}

      {loading ? (
        <LoadingSkeleton variant="card" count={5} />
      ) : programs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Teams will appear here once an admin adds them."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {programs.map((team, i) => (
            <button
              key={team.id}
              type="button"
              onClick={() => { navigator.vibrate?.(10); navigate(`/teams/${team.id}`); }}
              className={`w-full text-left sf-press sf-stagger-${i + 1}`}
              style={{
                display: 'flex',
                alignItems: 'stretch',
                backgroundColor: 'var(--sf-bg-card)',
                borderRadius: 10,
                border: '1px solid var(--sf-border-default)',
                boxShadow: 'var(--sf-shadow-sm)',
                overflow: 'hidden',
                transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
              }}
            >
              <div style={{ width: 5, flexShrink: 0, backgroundColor: team.team_color || 'var(--sf-neutral)' }} />
              <div style={{ flex: 1, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--sf-text-primary)', fontSize: 16 }}>
                    {team.name}
                  </div>
                  <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
                      backgroundColor: 'var(--sf-bg-secondary)', color: 'var(--sf-text-secondary)',
                    }}>{team.age_group}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
                      backgroundColor: 'var(--sf-bg-secondary)', color: 'var(--sf-text-secondary)',
                    }}>{CIRCUIT_LABELS[team.circuit] || team.circuit}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                      backgroundColor: 'var(--sf-neutral-soft)', color: 'var(--sf-text-tertiary)',
                    }}>0-0</span>
                  </div>
                </div>
                <div style={{ display: 'flex', marginLeft: 'auto', marginRight: 12 }}>
                  {['A', 'S', 'C'].map((letter, i) => (
                    <div key={i} style={{
                      width: 24, height: 24, borderRadius: '50%',
                      backgroundColor: team.team_color || 'var(--sf-neutral)',
                      border: '2px solid var(--sf-bg-card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--sf-text-inverse)', fontSize: 10, fontWeight: 700,
                      marginLeft: i === 0 ? 0 : -8,
                      zIndex: 3 - i,
                      position: 'relative',
                    }}>
                      {letter}
                    </div>
                  ))}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    backgroundColor: 'var(--sf-bg-secondary)',
                    border: '2px solid var(--sf-bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--sf-text-tertiary)', fontSize: 9, fontWeight: 600,
                    marginLeft: -8,
                    zIndex: 0,
                    position: 'relative',
                  }}>
                    +7
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sf-text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
