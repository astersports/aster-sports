import { useMemo, useState } from 'react';
import Label from '../shared/Label';

// Phase 3 D-6(a) parent inbox — list view.
// Renders items grouped by recency (TODAY / YESTERDAY / THIS WEEK / EARLIER).
// Tap a row → InboxDetail via onSelect(item).

const KIND_LABEL = {
  weekly_digest: 'Weekly digest',
  schedule_change: 'Schedule change',
  game_recap: 'Game recap',
  games_recap: 'Games recap',
  tournament_prelim: 'Tournament briefing',
  tournament_recap: 'Tournament recap',
  coach_roundup: 'Coach roundup',
  family_guide: 'Family guide',
  announcement: 'Announcement',
  rsvp_nudge: 'RSVP needed',
  academy_callup_notice: 'Academy call-up',
  custom_message: 'Message',
};

const rowStyle = {
  display: 'block', width: '100%', textAlign: 'left',
  background: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderRadius: 10, padding: '12px 14px', marginBottom: 8, cursor: 'pointer',
  fontFamily: 'inherit', color: 'var(--as-text-primary)',
};
const metaStyle = { fontSize: 12, color: 'var(--as-text-tertiary)', marginTop: 4 };
const kindStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--as-text-secondary)' };

function bucketFor(now, sent) {
  if (!sent) return 'EARLIER';
  const sentMs = new Date(sent).getTime();
  const ageDays = (now - sentMs) / 86400000;
  if (ageDays < 1) return 'TODAY';
  if (ageDays < 2) return 'YESTERDAY';
  if (ageDays < 7) return 'THIS WEEK';
  return 'EARLIER';
}

const ORDER = ['TODAY', 'YESTERDAY', 'THIS WEEK', 'EARLIER'];

function relTime(now, sent) {
  if (!sent) return 'pending';
  const sentMs = new Date(sent).getTime();
  const minutes = Math.floor((now - sentMs) / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(sent).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function InboxList({ items, onSelect }) {
  // Snapshot "now" at mount so recency buckets / relative time labels
  // are stable across re-renders (purity rule: Date.now() in render is
  // disallowed). Refresh on a future user gesture if needed.
  const [now] = useState(() => Date.now());
  const groups = useMemo(() => {
    const buckets = new Map(ORDER.map((k) => [k, []]));
    for (const item of items) buckets.get(bucketFor(now, item.sent_at)).push(item);
    return ORDER.filter((k) => buckets.get(k).length > 0).map((k) => ({ label: k, items: buckets.get(k) }));
  }, [items, now]);

  if (groups.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--as-text-tertiary)' }} role="status">
        No briefings yet.
      </div>
    );
  }

  return (
    <div role="list" aria-label="Briefings">
      {groups.map((group) => (
        <section key={group.label} style={{ marginBottom: 16 }}>
          <Label>{group.label}</Label>
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="listitem"
              className="as-press"
              style={rowStyle}
              onClick={() => onSelect(item)}
              aria-label={`${KIND_LABEL[item.kind] || item.kind}: ${item.subject}`}
            >
              <div style={kindStyle}>{KIND_LABEL[item.kind] || item.kind}</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{item.subject}</div>
              <div style={metaStyle}>{relTime(now, item.sent_at)}</div>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}
