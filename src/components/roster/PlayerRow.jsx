export default function PlayerRow({ player, teamColor, isLast }) {
  const initial = (player.last_name || player.first_name || '?').charAt(0).toUpperCase();
  const isAcademy = player.member_type === 'futures_academy';

  return (
    <div
      className="flex items-center sf-press"
      onClick={() => navigator.vibrate?.(10)}
      style={{
        padding: '10px 16px',
        minHeight: 56,
        borderBottom: isLast ? 'none' : '1px solid var(--sf-border-subtle)',
        transition: 'background-color 150ms ease-out',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        backgroundColor: teamColor || 'var(--sf-neutral)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--sf-text-inverse)',
        fontSize: 15,
        fontWeight: 700,
        flexShrink: 0,
      }}>
        {initial}
      </div>

      {/* Name + badges */}
      <div style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
        <div className="font-semibold truncate" style={{ color: 'var(--sf-text-primary)', fontSize: 15 }}>
          {player.first_name} {player.last_name}
        </div>
        <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
          {isAcademy && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
              backgroundColor: 'var(--sf-academy-soft)', color: 'var(--sf-academy)',
            }}>Academy</span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 500, padding: '1px 6px', borderRadius: 4,
            backgroundColor: 'var(--sf-bg-secondary)', color: 'var(--sf-text-secondary)',
          }}>{ordinalGrade(player.grade)}</span>
        </div>
      </div>

      {/* Jersey number */}
      {player.jersey_number != null && (
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: `2px solid ${teamColor || 'var(--sf-neutral)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: teamColor || 'var(--sf-text-primary)',
          flexShrink: 0,
        }}>
          {player.jersey_number}
        </div>
      )}
    </div>
  );
}

function ordinalGrade(g) {
  if (!g) return '';
  if (g === 1) return '1st';
  if (g === 2) return '2nd';
  if (g === 3) return '3rd';
  return `${g}th`;
}
