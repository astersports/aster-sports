import { Check, X, HelpCircle } from 'lucide-react';

const BUTTONS = [
  { key: 'going', icon: Check, color: 'var(--sf-success)', bg: 'var(--sf-success-soft)', label: 'Going' },
  { key: 'maybe', icon: HelpCircle, color: 'var(--sf-warning)', bg: 'var(--sf-warning-soft)', label: 'Maybe' },
  { key: 'not_going', icon: X, color: 'var(--sf-danger)', bg: 'var(--sf-danger-soft)', label: 'Not going' },
];

export default function RsvpPlayerRow({ player, response, teamColor, onSetRsvp }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 0',
      borderBottom: '1px solid var(--sf-border-subtle)',
    }}>
      {/* Jersey circle */}
      <div style={{
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: teamColor || 'var(--sf-bg-tertiary)',
        color: '#fff', fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {player.jersey_number || '—'}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--sf-text-primary)' }}>
          {player.first_name} {player.last_name}
        </div>
        {player.member_type === 'futures_academy' && (
          <span style={{
            fontSize: 11, color: '#7C3AED', fontWeight: 500,
            backgroundColor: '#F3E8FF', padding: '1px 6px', borderRadius: 4,
          }}>Academy</span>
        )}
      </div>

      {/* RSVP buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {BUTTONS.map((b) => {
          const Icon = b.icon;
          const active = response === b.key;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => onSetRsvp(player.id, b.key)}
              className="sf-press"
              aria-label={b.label}
              style={{
                width: 36, height: 36, borderRadius: 18,
                border: active ? 'none' : '1px solid var(--sf-border-default)',
                backgroundColor: active ? b.bg : 'transparent',
                color: active ? b.color : 'var(--sf-text-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
