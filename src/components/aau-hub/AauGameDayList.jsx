import { groupGamesByDay } from '../../lib/aau/divisionSchedule';
import AauDivisionGameRow from './AauDivisionGameRow';

// Renders a list of division games grouped under NY-anchored day headers
// (R1·PR-A) — shared by the division page's Schedule and Bracket tabs. Empty
// list → a brand-voice notice. --as-* tokens only.

const dayLabel = { margin: '16px 0 8px', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--as-text-meta)' };

export default function AauGameDayList({ games, emptyText }) {
  const days = groupGamesByDay(games);
  if (days.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, padding: 24, textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--as-text-secondary)' }}>{emptyText || 'Nothing here yet — check back soon.'}</p>
      </div>
    );
  }
  return (
    <div>
      {days.map((d) => (
        <section key={d.key}>
          <h3 style={dayLabel}>{d.label}</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {d.games.map((g, i) => <AauDivisionGameRow key={g.gameId || i} game={g} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
