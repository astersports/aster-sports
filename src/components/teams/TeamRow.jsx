// Single team row on /teams. Hook lives here so each row fetches its
// own summary independently — same N+1 pattern as MY TEAMS strip and
// /records SEASON SNAPSHOT cards. Bundled fix coming in 3d-f via
// useOrgTeamRecords.
import { useNavigate } from 'react-router-dom';
import { useTeamRecords } from '../../hooks/useTeamRecords';

const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };

export default function TeamRow({ team, idx }) {
  const navigate = useNavigate();
  const { summary, loading } = useTeamRecords(team.id);
  const recordLine = loading
    ? '—'
    : (summary.streak === '—' ? summary.record : `${summary.record} · ${summary.streak}`);

  return (
    <button
      type="button"
      onClick={() => { navigator.vibrate?.(10); navigate(`/teams/${team.id}`); }}
      className={`w-full text-left sf-press sf-stagger-${idx + 1}`}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: 'var(--em-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)',
        overflow: 'hidden',
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
      }}
    >
      <div style={{ width: 5, flexShrink: 0, backgroundColor: team.team_color || 'var(--em-neutral)' }} />
      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="font-semibold" style={{ color: 'var(--em-text-primary)', fontSize: 16 }}>
            {team.name}
          </div>
          <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
              backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-secondary)',
            }}>{team.age_group}</span>
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
              backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-secondary)',
            }}>{CIRCUIT_LABELS[team.circuit] || team.circuit}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
              backgroundColor: 'var(--em-neutral-soft)', color: 'var(--em-text-tertiary)',
            }}>{recordLine}</span>
          </div>
        </div>
        <div style={{ display: 'flex', marginLeft: 'auto', marginRight: 12 }}>
          {['A', 'S', 'C'].map((letter, i) => (
            <div key={i} style={{
              width: 24, height: 24, borderRadius: '50%',
              backgroundColor: team.team_color || 'var(--em-neutral)',
              border: '2px solid var(--em-bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--em-text-inverse)', fontSize: 10, fontWeight: 700,
              marginLeft: i === 0 ? 0 : -8,
              zIndex: 3 - i,
              position: 'relative',
            }}>
              {letter}
            </div>
          ))}
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            backgroundColor: 'var(--em-bg-secondary)',
            border: '2px solid var(--em-bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--em-text-tertiary)', fontSize: 9, fontWeight: 600,
            marginLeft: -8,
            zIndex: 0,
            position: 'relative',
          }}>
            +7
          </div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--em-text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </div>
    </button>
  );
}
