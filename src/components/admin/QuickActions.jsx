import { Link } from 'react-router-dom';
import { CalendarPlus, UserPlus, MessageSquare, Calendar } from 'lucide-react';

// Four-chip horizontal scroll row for the admin home shortcuts. The create
// routes are placeholders for now — they deep-link into the schedule/roster
// pages and will gain dedicated /new routes in a later prompt.
const ACTIONS = [
  { label: '+ Event',  icon: CalendarPlus,  to: '/schedule' },
  { label: '+ Player', icon: UserPlus,      to: '/teams'    },
  { label: 'Message',  icon: MessageSquare, to: '/messages' },
  { label: 'Schedule', icon: Calendar,      to: '/schedule' },
];

export default function QuickActions() {
  return (
    <div
      className="flex gap-2 overflow-x-auto sf-no-scrollbar -mx-4 px-4"
      aria-label="Quick actions"
    >
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            to={action.to}
            className="flex items-center gap-2 sf-press whitespace-nowrap"
            style={{
              minHeight: 44,
              padding: '0 16px',
              borderRadius: 10,
              backgroundColor: 'var(--sf-bg-card)',
              border: '1px solid var(--sf-border-default)',
              color: 'var(--sf-text-primary)',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}
