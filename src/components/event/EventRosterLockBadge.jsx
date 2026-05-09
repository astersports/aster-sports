import { Lock } from 'lucide-react';
import { formatRelativeTime } from '../../lib/formatters';

// Compact badge for non-card surfaces (event row in lists, parent dashboards).
// Renders nothing when the event is not locked.

export default function EventRosterLockBadge({ lockedAt }) {
  if (!lockedAt) return null;
  const timeAgo = formatRelativeTime(lockedAt);
  return (
    <span
      aria-label={`Roster locked ${timeAgo}`}
      title={`Locked ${timeAgo}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 4,
        backgroundColor: 'var(--em-neutral-soft)',
        color: 'var(--em-text-secondary)',
      }}
    >
      <Lock size={11} strokeWidth={1.75} />
      Locked
    </span>
  );
}
