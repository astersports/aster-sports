import Badge from '../shared/Badge';

// Ordinal grade formatter — "1st", "2nd", "3rd", "4th". Handles the
// english-irregular 11/12/13 block and defaults to "th" otherwise.
function ordinalGrade(n) {
  if (n == null) return '—';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// Single roster row. `color` is the team_color string passed through as
// inline style — the only hex allowed in a component per CLAUDE.md §0.
export default function PlayerRow({ player, color, isLast }) {
  const initial = (player.last_name?.[0] || player.first_name?.[0] || '?').toUpperCase();
  return (
    <li
      className="flex items-center gap-3"
      style={{
        padding: '12px 16px',
        minHeight: 44,
        borderBottom: isLast ? 'none' : '1px solid var(--sf-border-subtle)',
      }}
    >
      <div
        className="flex items-center justify-center font-semibold flex-shrink-0"
        style={{
          width: 40, height: 40, borderRadius: '50%',
          backgroundColor: color, color: 'var(--sf-text-inverse)', fontSize: 15,
        }}
        aria-hidden="true"
      >
        {initial}
      </div>
      <div
        className="flex-1 min-w-0 truncate font-semibold"
        style={{ color: 'var(--sf-text-primary)', fontSize: 15 }}
      >
        {player.first_name} {player.last_name}
      </div>
      {player.member_type === 'futures_academy' && (
        <Badge variant="academy">Academy</Badge>
      )}
      <span
        style={{
          backgroundColor: 'var(--sf-bg-secondary)',
          color: 'var(--sf-text-secondary)',
          borderRadius: 6, fontSize: 13, padding: '4px 8px', fontWeight: 500,
        }}
      >
        {ordinalGrade(player.grade)}
      </span>
      <div
        className="flex items-center justify-center font-bold flex-shrink-0"
        style={{
          width: 24, height: 24, borderRadius: '50%',
          backgroundColor: color, color: 'var(--sf-text-inverse)', fontSize: 11,
        }}
      >
        {player.jersey_number ?? '—'}
      </div>
    </li>
  );
}
