import { Link } from 'react-router-dom';
import { CalendarPlus, UserPlus, MessageSquare, Megaphone, Calendar, Trophy } from 'lucide-react';

const ACTIONS = [
  { label: '+ Event',     icon: CalendarPlus,  to: '/schedule'     },
  { label: '+ Player',    icon: UserPlus,      to: '/teams'        },
  { label: 'Announce',    icon: Megaphone,     to: '/messages?announce=1' },
  { label: 'Message',     icon: MessageSquare, to: '/messages'     },
  { label: 'Schedule',    icon: Calendar,      to: '/schedule'     },
  { label: 'Tournaments', icon: Trophy,        to: '/tournaments'  },
];

export default function QuickActions() {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
      aria-label="Quick actions"
    >
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            to={action.to}
            onClick={() => navigator.vibrate?.(10)}
            className="flex items-center gap-2 sf-press whitespace-nowrap"
            style={{
              minHeight: 44,
              padding: '0 16px',
              borderRadius: 10,
              backgroundColor: 'var(--em-bg-card)',
              border: '1px solid var(--em-border-default)',
              boxShadow: 'var(--em-shadow-sm)',
              color: 'var(--em-text-primary)',
              fontSize: 15,
              fontWeight: 500,
              transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
            }}
          >
            <Icon size={20} strokeWidth={1.75} style={{ color: 'var(--em-text-tertiary)' }} aria-hidden="true" />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}
