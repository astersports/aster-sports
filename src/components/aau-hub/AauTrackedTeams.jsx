import { Link } from 'react-router-dom';
import { useTrackedTeams } from '../../hooks/useTrackedTeams';

// "Tracked" section on the no-login Hub Home (R1·PR-A). Lists the parent's
// followed teams (anon localStorage) as links to each team's schedule. Renders
// nothing when no teams are tracked, so the Hub falls back to the browse
// directory. The up-next countdown + weather hero per tracked team rides a
// later increment; this is the navigable foundation.
export default function AauTrackedTeams() {
  const teams = useTrackedTeams();
  if (teams.length === 0) return null;

  return (
    <section style={{ marginBottom: 12 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)' }}>
        Tracked · {teams.length}
      </h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {teams.map((t) => (
          <Link
            key={t.teamKey}
            to={`/hub/team/${encodeURIComponent(t.teamKey)}`}
            aria-label={`${t.name || 'Team'} schedule`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44, padding: '12px 16px',
              backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10,
              boxShadow: 'var(--as-shadow-sm)', textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{t.name || 'Team'}</span>
            <span aria-hidden="true" style={{ fontSize: 18, color: 'var(--as-accent)' }}>★</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
