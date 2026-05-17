import { Link } from 'react-router-dom';
import { CalendarPlus, DollarSign, Inbox, Mail, Megaphone, Trophy, Upload, UserPlus } from 'lucide-react';

// Wave 4.4-B Session 1: 'Compose Briefing' is the canonical entry point
// into the briefing portal per the L99 strategic direction. The existing
// 'Briefings' tile remains as the queue/triage view. Two distinct surfaces.
//
// Wave 5 PR 2 (2026-05-15): 'Import Schedule' added after Tournaments —
// natural grouping (you import the schedule for a tournament). Lands on
// /admin/import-schedule (paste TourneyMachine text → preview → commit
// per cutover wave PR 2).
//
// IA Tier 1 (2026-05-17): 'Message' tile dropped — duplicates the
// Messages tab in the bottom nav, no admin-specific function. Section
// label renamed to ADMIN SHORTCUTS in AdminHomePage.
const ACTIONS = [
  { label: '+ Event',         icon: CalendarPlus,  to: '/schedule'                  },
  { label: '+ Player',        icon: UserPlus,      to: '/teams'                     },
  { label: 'Compose Briefing', icon: Mail,         to: '/admin/briefings/compose'   },
  { label: 'Briefings',       icon: Inbox,         to: '/admin/briefings'           },
  { label: 'Financials',      icon: DollarSign,    to: '/admin/financials'          },
  { label: 'Announce',        icon: Megaphone,     to: '/messages?announce=1'       },
  { label: 'Tournaments',     icon: Trophy,        to: '/tournaments'               },
  { label: 'Import Schedule', icon: Upload,        to: '/admin/import-schedule'     },
];

export default function QuickActions() {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
      aria-label="Admin shortcuts"
    >
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            to={action.to}
            onClick={() => navigator.vibrate?.(10)}
            className="flex items-center gap-2 sf-press"
            style={{
              minHeight: 44,
              padding: '0 16px',
              borderRadius: 10,
              backgroundColor: 'var(--em-bg-card)',
              border: '1px solid var(--em-border-default)',
              boxShadow: 'var(--em-shadow-sm)',
              color: 'var(--em-text-primary)',
              fontSize: 14,
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
