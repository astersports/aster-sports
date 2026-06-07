import { Link } from 'react-router-dom';
import Badge from '../../shared/Badge';
import { programBadge } from '../../../lib/programGrouping';

// One row on the /admin/programs index (render R1). Date-only strings are
// parsed at local midnight so the month/day don't shift across time zones.
const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null);

export default function ProgramIndexRow({ program }) {
  const { label, variant } = programBadge(program.programType);
  const range = [fmt(program.startDate), fmt(program.endDate)].filter(Boolean).join(' – ');
  const counts = [
    program.teamCount ? `${program.teamCount} team${program.teamCount !== 1 ? 's' : ''}` : null,
    program.playerCount ? `${program.playerCount} player${program.playerCount !== 1 ? 's' : ''}` : null,
  ].filter(Boolean).join(' · ');
  const meta = [range, counts].filter(Boolean).join(' · ');

  return (
    <Link to={`/admin/programs/${program.id}`} className="as-press" style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{program.name}</span>
        <Badge variant={variant}>{label}</Badge>
      </div>
      {meta && <div style={{ fontSize: 12.5, color: 'var(--as-text-secondary)', marginTop: 3 }}>{meta}</div>}
    </Link>
  );
}

const card = {
  display: 'block', textDecoration: 'none', backgroundColor: 'var(--as-bg-card)',
  border: '1px solid var(--as-border-default)', borderRadius: 10,
  boxShadow: 'var(--as-shadow-sm)', padding: '12px 13px', marginBottom: 9,
};
