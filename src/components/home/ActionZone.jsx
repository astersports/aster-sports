// §4.C Sprint B — ACTION ZONE on parent home. Per HOME_DESIGN_SPEC.md
// §1.1.2: surfaces "things to handle" for the parent. This PR ships the
// first signal: pending RSVPs (kid × event where no event_rsvps row
// exists yet). Future PRs add ride needed / open duty slot / payment
// overdue signals via the same shell.
//
// Visibility: hidden entirely when items.length === 0. The section is
// presence-driven, not always-on.
//
// CTAs: this PR clicks through to event detail. Inline RSVP buttons
// (Going / Can't / Maybe per HOME_DESIGN_SPEC visual) ship in a
// follow-up — they need the optimistic-update path from PR §16.1.
//
// Density: HOME_DESIGN_SPEC §1.1.2 specifies 3 states (minimal /
// medium / detailed). This PR ships the medium default. Density-aware
// variants ship in a follow-up alongside DensityToggle wiring.

import { Link } from 'react-router-dom';
import Label from '../shared/Label';

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

export default function ActionZone({ items, loading }) {
  // Hide entirely while loading + empty; hide after load if nothing
  // to handle. Don't render a "0 items" empty state — the section's
  // purpose is to surface action, not advertise its own emptiness.
  if (loading || !items?.length) return null;

  const count = items.length;
  const headline = count === 1 ? '1 thing to handle' : `${count} things to handle`;

  return (
    <section aria-label="Things to handle">
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <Label style={{ marginBottom: 0 }}>{headline.toUpperCase()}</Label>
      </div>
      <ul
        style={{
          backgroundColor: 'var(--em-bg-card)',
          borderRadius: 10,
          border: '1px solid var(--em-border-default)',
          boxShadow: 'var(--em-shadow-sm)',
          overflow: 'hidden',
          padding: 0,
          margin: 0,
          listStyle: 'none',
        }}
      >
        {items.map((item, idx) => (
          <li
            key={`${item.event_id}:${item.player_id}`}
            style={{
              borderTop: idx === 0 ? 'none' : '1px solid var(--em-border-subtle)',
            }}
          >
            <Link
              to={`/events/${item.event_id}`}
              className="sf-press"
              style={{
                display: 'block',
                padding: '12px 14px',
                color: 'var(--em-text-primary)',
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span
                  aria-hidden="true"
                  style={{
                    flex: '0 0 6px',
                    alignSelf: 'stretch',
                    backgroundColor: item.team_color || 'var(--em-warning)',
                    borderRadius: 2,
                    minHeight: 24,
                    marginTop: 2,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--em-text-primary)' }}>
                    {item.kid_first_name}: RSVP needed
                  </div>
                  <div style={{ color: 'var(--em-text-secondary)', fontSize: 13, marginTop: 2 }}>
                    {formatWhen(item.start_at)} · {item.event_title}
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  style={{ color: 'var(--em-text-tertiary)', fontSize: 18, marginLeft: 4 }}
                >
                  ›
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
