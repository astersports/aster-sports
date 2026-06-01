// §4.C Sprint B — ACTION ZONE on parent home. Per HOME_DESIGN_SPEC.md
// §1.1.2: surfaces "things to handle" for the parent. Signal-agnostic
// shell — each item carries its own `primary` label (e.g. "Charlie:
// RSVP needed", "Charlie: Ride needed") so this renderer doesn't have
// to know about signal kinds. Item shape:
//   { event_id, player_id, primary, start_at, event_title,
//     team_name, team_color }
//
// Visibility: hidden entirely when items.length === 0. The section is
// presence-driven, not always-on.
//
// CTAs: this PR clicks through to event detail. Inline action buttons
// (Going / Can't / Maybe for RSVP, Offer / Request for ride per
// HOME_DESIGN_SPEC visual) ship in follow-ups — they need the
// optimistic-update path from PR §16.1.
//
// Density: HOME_DESIGN_SPEC §1.1.2. Two states (the useDensity hook
// runtime supports `minimal` + `maximum`; spec's middle "medium" maps
// to `maximum` here, the default rows view):
//   - `minimal`: single-line summary "N things to handle — tap to expand"
//   - `maximum` (default): full rows with team-color stripe + drill-down
// PR #308 adds the minimal variant + DensityToggle in the section
// header. Maximum's spec ambition (inline CTAs — Going/Can't, Offer
// ride, Claim slot — with optimistic updates) ships in its own arc.

import { Link } from 'react-router-dom';
import Label from '../shared/Label';
import DensityToggle from './DensityToggle';
import { useDensity } from '../../hooks/useDensity';

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

export default function ActionZone({ items, loading, sectionKey = 'action-zone' }) {
  // Default = 'maximum' (rows). useDensity's global fallback is
  // 'minimal' which would silently flip every existing user to the
  // summary view; override per HOME_DESIGN_SPEC §1.1.2 (medium is the
  // default in spec, mapped to maximum in our 2-state runtime).
  const { density } = useDensity(sectionKey, 'maximum');
  // Hide entirely while loading + empty; hide after load if nothing
  // to handle. Don't render a "0 items" empty state — the section's
  // purpose is to surface action, not advertise its own emptiness.
  if (loading || !items?.length) return null;

  const count = items.length;
  const headline = count === 1 ? '1 thing to handle' : `${count} things to handle`;
  const isMinimal = density === 'minimal';

  return (
    <section aria-label="Things to handle">
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <Label style={{ marginBottom: 0 }}>{headline.toUpperCase()}</Label>
        <DensityToggle sectionKey={sectionKey} />
      </div>
      {isMinimal && (
        <div
          style={{
            backgroundColor: 'var(--as-bg-card)',
            borderRadius: 10,
            border: '1px solid var(--as-border-default)',
            boxShadow: 'var(--as-shadow-sm)',
            padding: '12px 14px',
            fontSize: 14,
            color: 'var(--as-text-secondary)',
          }}
        >
          {count === 1 ? '1 item needs your attention' : `${count} items need your attention`} — tap the density toggle to expand.
        </div>
      )}
      {!isMinimal && (
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
        {items.map((item, idx) => {
          // PR coach-action-queue: signal-agnostic link target via
          // item.href. Falls back to /events/<event_id> for parent
          // signals where event_id is the natural drill-down target.
          const href = item.href || (item.event_id ? `/events/${item.event_id}` : '#');
          return (
          <li
            key={`${item.kind || 'item'}:${item.event_id || item.id}:${item.player_id || ''}`}
            style={{
              borderTop: idx === 0 ? 'none' : '1px solid var(--as-border-subtle)',
            }}
          >
            <Link
              to={href}
              className="as-press"
              style={{
                display: 'block',
                padding: '12px 14px',
                color: 'var(--as-text-primary)',
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
                    backgroundColor: item.team_color || 'var(--as-warning)',
                    borderRadius: 2,
                    minHeight: 24,
                    marginTop: 2,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--as-text-primary)' }}>
                    {item.primary || `${item.kid_first_name}: action needed`}
                  </div>
                  {(item.start_at || item.event_title || item.secondary) && (
                    <div style={{ color: 'var(--as-text-secondary)', fontSize: 13, marginTop: 2 }}>
                      {item.secondary || [formatWhen(item.start_at), item.event_title].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <span
                  aria-hidden="true"
                  style={{ color: 'var(--as-text-tertiary)', fontSize: 18, marginLeft: 4 }}
                >
                  ›
                </span>
              </div>
            </Link>
          </li>
          );
        })}
      </ul>
      )}
    </section>
  );
}
