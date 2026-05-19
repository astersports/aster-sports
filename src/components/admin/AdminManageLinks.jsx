// §4.O — admin MANAGE section. Discoverability fix for the gap where
// admin manager pages (Seasons / Teams / Members / Rollover / Engine
// Preview / Locations) had routes registered in App.jsx but no nav
// affordance reaching them. The orphan-LocationsPage finding (2026-05-19,
// PR #268 discovery) made the gap concrete.
//
// QuickActions stays for action-take entries (+ Event, + Player,
// Compose Briefing, Announce, etc.). This component stays for
// navigate-to-data-table entries. Two different visual + intent
// categories on the admin home page.
//
// Anti-pattern #42 corollary: every route in App.jsx should have at
// least one navigation referencer. The routeAccessibility.test.js
// audit enforces that going forward.

import { Link } from 'react-router-dom';
import { CalendarDays, FlaskConical, MapPin, Repeat, Swords, Trophy, UsersRound } from 'lucide-react';

const LINKS = [
  { label: 'Seasons',         icon: CalendarDays,   to: '/admin/seasons'         },
  { label: 'Teams',           icon: Trophy,         to: '/admin/teams'           },
  { label: 'Members',         icon: UsersRound,     to: '/admin/members'         },
  { label: 'Opponents',       icon: Swords,         to: '/admin/opponents'       },
  { label: 'Locations',       icon: MapPin,         to: '/locations'             },
  { label: 'Season Rollover', icon: Repeat,         to: '/admin/rollover'        },
  { label: 'Engine Preview',  icon: FlaskConical,   to: '/admin/engine-preview'  },
];

// Coach Directory tile dropped 2026-05-19 PR C (was aliased to
// /admin/members; replaced with Opponents now that V-33 part 1 ships).
// Dedicated /admin/coaches lands when staff
// profiles get their own management surface.
const DEDUP_BY_TO = (items) => {
  const seen = new Set();
  return items.filter((i) => (seen.has(i.to) ? false : seen.add(i.to)));
};

export default function AdminManageLinks() {
  const items = DEDUP_BY_TO(LINKS);
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
      aria-label="Admin manage"
    >
      {items.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.to}
            to={link.to}
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
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
