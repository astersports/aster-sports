// E7/E8: a single public-schedule event row. Adds over the prior inline
// markup: a Home/Away/Neutral chip + an event-type pill for at-a-glance
// clarity, and a tappable Google-Maps search link on the location (name-
// text-only → Google search per §15 MAP URL PRIORITY; we only have a venue
// name here, never coords/address, so Google search is the only safe link).
// Renders as an <li>; the page wraps rows in an <ol> for a11y. Times use the
// NY-pinned formatters. Pure render — no Date.now()/Math.random().

import { ExternalLink, MapPin } from 'lucide-react';
import { formatTime } from '../../lib/formatters';
import { formatEventTitleString } from '../../lib/eventTitle';
import { TYPE_LABELS } from '../../lib/constants';

const HOME_AWAY_LABEL = { home: 'Home', away: 'Away', neutral: 'Neutral' };

const chip = {
  display: 'inline-flex', alignItems: 'center', borderRadius: 6,
  padding: '2px 6px', fontSize: 11, fontWeight: 500, lineHeight: 1.2,
};

export default function PublicScheduleEventRow({ event, accentColor }) {
  const e = event;
  const typeLabel = TYPE_LABELS[e.event_type] || 'Event';
  const homeAway = HOME_AWAY_LABEL[e.home_away];
  const mapUrl = e.location_name
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location_name)}`
    : null;

  return (
    <li
      style={{
        display: 'flex', alignItems: 'stretch', backgroundColor: 'var(--as-bg-card)',
        borderRadius: 10, border: '1px solid var(--as-border-default)',
        boxShadow: 'var(--as-shadow-sm)', overflow: 'hidden', marginBottom: 8, listStyle: 'none',
      }}
    >
      <div style={{ width: 4, flexShrink: 0, backgroundColor: accentColor }} aria-hidden="true" />
      <div style={{ flex: 1, padding: '10px 14px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--as-text-primary)' }}>
            {formatTime(e.start_at)}
          </span>
          <span style={{ ...chip, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-secondary)' }}>
            {typeLabel}
          </span>
          {homeAway && (
            <span style={{ ...chip, backgroundColor: 'var(--as-bg-secondary)', color: 'var(--as-text-secondary)' }}>
              {homeAway}
            </span>
          )}
        </div>
        <div style={{ fontSize: 15, color: 'var(--as-text-primary)', marginTop: 4, lineHeight: 1.4 }}>
          {formatEventTitleString(e)}
        </div>
        {e.location_name && (
          mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${e.location_name} in Google Maps`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 44,
                fontSize: 13, color: 'var(--as-accent)', marginTop: 2, textDecoration: 'none',
              }}
            >
              <MapPin size={13} strokeWidth={1.75} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.location_name}</span>
              <ExternalLink size={11} strokeWidth={1.75} aria-hidden="true" />
            </a>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 2 }}>
              <MapPin size={13} strokeWidth={1.75} />{e.location_name}
            </div>
          )
        )}
      </div>
    </li>
  );
}
