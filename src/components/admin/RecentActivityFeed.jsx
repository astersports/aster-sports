import Label from '../shared/Label';

// HOME_DESIGN_SPEC §3.1.6 — admin home RECENT ACTIVITY feed.
// Presence-driven: hides entirely when no activity in last 24h.
// Items rendered as compact rows with a team-color stripe.

function relativeTime(iso, nowMs) {
  if (!iso) return '';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '';
  const diffMs = Math.max(0, nowMs - ts);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentActivityFeed({ items, loading, nowMs }) {
  if (loading) return null;
  if (!items?.length) return null;

  return (
    <section className="min-w-0" aria-label="Recent activity">
      <Label>RECENT ACTIVITY</Label>
      <ul
        style={{
          backgroundColor: 'var(--as-bg-card)',
          borderRadius: 10,
          border: '1px solid var(--as-border-default)',
          boxShadow: 'var(--as-shadow-sm)',
          overflow: 'hidden',
          padding: 0,
          margin: 0,
          listStyle: 'none',
        }}
      >
        {items.map((item, idx) => (
          <li
            key={`${item.kind}:${item.ts}:${idx}`}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 14px',
              borderTop: idx === 0 ? 'none' : '1px solid var(--as-border-subtle)',
              fontSize: 13,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                flex: '0 0 4px',
                alignSelf: 'stretch',
                backgroundColor: item.team_color || 'var(--as-neutral)',
                borderRadius: 2,
                minHeight: 18,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'var(--as-text-primary)' }}>{item.text}</div>
              <div style={{ color: 'var(--as-text-tertiary)', fontSize: 11, marginTop: 1 }}>
                {relativeTime(item.ts, nowMs)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
