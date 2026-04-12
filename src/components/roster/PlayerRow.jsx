export default function PlayerRow({ player, teamColor, isLast }) {
  const initial = (player.last_name || player.first_name || '?').charAt(0).toUpperCase();
  const isAcademy = player.member_type === 'futures_academy';

  return (
    <div
      className="flex items-center sf-press"
      onClick={() => navigator.vibrate?.(10)}
      onTouchStart={(e) => { e.currentTarget.style.backgroundColor = `${teamColor}08`; }}
      onTouchEnd={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      style={{
        padding: '10px 16px',
        minHeight: 56,
        borderBottom: isLast ? 'none' : '1px solid var(--sf-border-subtle)',
        transition: 'background-color 150ms ease-out, box-shadow 150ms ease-out',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        backgroundColor: teamColor || 'var(--sf-neutral)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--sf-text-inverse)', fontSize: 15, fontWeight: 700, flexShrink: 0,
      }}>
        {initial}
      </div>

      {/* Name (with payment dot) + badges + attendance */}
      <div style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
        <div className="flex items-center gap-2">
          <div className="font-semibold truncate" style={{ color: 'var(--sf-text-primary)', fontSize: 15 }}>
            {player.first_name} {player.last_name}
          </div>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: player.payment_status === 'partial' ? 'var(--sf-warning)'
              : player.payment_status === 'overdue' ? 'var(--sf-danger)'
              : 'var(--sf-success)',
            flexShrink: 0,
          }} title={player.payment_status === 'partial' ? 'Partial payment' : player.payment_status === 'overdue' ? 'Payment overdue' : 'Paid'} />
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
        <div className="flex items-center gap-1" style={{ marginTop: 3 }}>
          <div style={{
            width: 40, height: 3, borderRadius: 999,
            backgroundColor: 'var(--sf-bg-tertiary)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${player.attendance_pct || 85}%`,
              backgroundColor: (player.attendance_pct || 85) >= 80 ? 'var(--sf-success)' : 'var(--sf-warning)',
              borderRadius: 999,
            }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--sf-text-tertiary)' }}>
            {player.attendance_pct || 85}%
          </span>
        </div>
      </div>

      {/* Jersey number */}
      {player.jersey_number != null && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: `2px solid ${teamColor || 'var(--sf-neutral)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700,
          color: teamColor || 'var(--sf-text-primary)',
          flexShrink: 0,
        }}>
          {player.jersey_number}
        </div>
      )}

      {/* Contact actions — tel/sms deep links, stopPropagation so the
          row's onClick (haptic) doesn't also fire when tapping them. */}
      <div className="flex items-center gap-1" style={{ marginLeft: 8, flexShrink: 0 }}>
        <a
          href={`tel:+1234567890`}
          onClick={(e) => { e.stopPropagation(); navigator.vibrate?.(10); }}
          className="sf-press flex items-center justify-center"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: 'var(--sf-bg-secondary)',
          }}
          aria-label={`Call ${player.first_name}'s parent`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sf-text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </a>
        <a
          href={`sms:+1234567890`}
          onClick={(e) => { e.stopPropagation(); navigator.vibrate?.(10); }}
          className="sf-press flex items-center justify-center"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: 'var(--sf-bg-secondary)',
          }}
          aria-label={`Text ${player.first_name}'s parent`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sf-text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </a>
      </div>
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
