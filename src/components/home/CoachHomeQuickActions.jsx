import { Link } from 'react-router-dom';
import { ClipboardCheck, MessageSquare, Trophy } from 'lucide-react';

// HOME_DESIGN_SPEC §2.1.6 — coach home QUICK ACTIONS ROW. Horizontal
// chip row of 44px tall outbound-action shortcuts.
//
// V1 tiles:
//   - Start Check-In → /schedule (coach navigates to their event;
//     contextual auto-routing to active event deferred)
//   - Message Team → /messages
//   - Quick Score → /records (coach selects team + game for score
//     entry; existing scoring flow)
//
// Spec also lists "Practice Plans" but no surface exists yet —
// deferred. Distinct from the per-team `roster/CoachQuickActions`
// component (used inside team detail surfaces, different scope).

const ACTIONS = [
  { label: 'Start Check-In', icon: ClipboardCheck, to: '/schedule' },
  { label: 'Message Team',   icon: MessageSquare,  to: '/messages' },
  { label: 'Quick Score',    icon: Trophy,         to: '/records'  },
];

const CHIP_STYLE = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minHeight: 44,
  padding: '0 8px',
  borderRadius: 999,
  border: '1px solid var(--as-border-default)',
  backgroundColor: 'var(--as-bg-card)',
  color: 'var(--as-text-primary)',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export default function CoachHomeQuickActions() {
  return (
    <nav aria-label="Quick actions" style={{ display: 'flex', gap: 8 }}>
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.label}
            to={a.to}
            onClick={() => navigator.vibrate?.(10)}
            className="as-press"
            style={CHIP_STYLE}
          >
            <Icon size={16} strokeWidth={1.75} color="var(--as-text-tertiary)" aria-hidden="true" />
            <span>{a.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
