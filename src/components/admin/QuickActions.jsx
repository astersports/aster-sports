import { Link } from 'react-router-dom';
import { CalendarPlus, UserPlus, MessageSquare, Calendar, Trophy } from 'lucide-react';

// Four-chip horizontal scroll row for the admin home shortcuts. The create
// routes are placeholders for now — they deep-link into the schedule/roster
// pages and will gain dedicated /new routes in a later prompt.
const ACTIONS = [
  { label: '+ Event',     icon: CalendarPlus,  to: '/schedule'     },
  { label: '+ Player',    icon: UserPlus,      to: '/teams'        },
  { label: 'Message',     icon: MessageSquare, to: '/messages'     },
  { label: 'Schedule',    icon: Calendar,      to: '/schedule'     },
  { label: 'Tournaments', icon: Trophy,        to: '/tournaments'  },
];

export default function QuickActions() {
  // Previously used `-mx-4 px-4` to bleed edge-to-edge inside the
  // parent's px-4 gutter, but the negative margins were blowing out the
  // page wrapper's computed width on iOS Safari and letting the whole
  // admin dashboard drag horizontally. A plain scroll row sits inside
  // the gutter — slightly less chrome-y, no overflow risk.
  return (
    <div
      className="flex gap-2 overflow-x-auto sf-no-scrollbar"
      style={{ maxWidth: '100%' }}
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
