import { NavLink } from 'react-router-dom';
import { House, Calendar, Trophy, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isStaff } from '../../lib/permissions';

// Admin/Coach see the Score tab; parents don't. Defining the full tab set in
// one array keeps the active-state styling and a11y labels consistent across
// both role variants.
const ALL_TABS = [
  { to: '/',         label: 'Home',     icon: House,         staffOnly: false },
  { to: '/schedule', label: 'Schedule', icon: Calendar,      staffOnly: false },
  { to: '/score',    label: 'Score',    icon: Trophy,        staffOnly: true  },
  { to: '/teams',    label: 'Teams',    icon: Users,         staffOnly: false },
  { to: '/messages', label: 'Messages', icon: MessageSquare, staffOnly: false },
];

export default function BottomNav() {
  const { role } = useAuth();
  const tabs = ALL_TABS.filter((t) => !t.staffOnly || isStaff(role));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        backgroundColor: 'var(--sf-bg-card)',
        borderTop: '1px solid var(--sf-border-default)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Primary"
    >
      {tabs.map((tab) => (
        <NavItem key={tab.to} {...tab} />
      ))}
    </nav>
  );
}

function NavItem(tab) {
  // Destructuring `icon: Icon` defeats the eslint varsIgnorePattern because
  // the parser checks the original key, not the alias — so we grab the
  // component via property access instead and alias locally.
  const Icon = tab.icon;
  return (
    <NavLink
      to={tab.to}
      end={tab.to === '/'}
      className="flex-1 sf-press"
      style={({ isActive }) => ({
        minHeight: 44,
        color: isActive ? 'var(--sf-accent)' : 'var(--sf-text-tertiary)',
      })}
      aria-label={tab.label}
    >
      {({ isActive: active }) => (
        <div className="flex flex-col items-center justify-center" style={{ gap: 2, paddingTop: 6, paddingBottom: 2 }}>
          <Icon size={22} strokeWidth={active ? 2 : 1.5} />
          <span style={{
            fontSize: 10,
            fontWeight: active ? 600 : 400,
            letterSpacing: '0.02em',
          }}>{tab.label}</span>
          {active && (
            <div style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: 'var(--sf-accent)',
              marginTop: -1,
            }} />
          )}
        </div>
      )}
    </NavLink>
  );
}
