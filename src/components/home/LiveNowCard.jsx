// §4.C Sprint C — LIVE NOW card per HOME_DESIGN_SPEC §1.1.3.
// Renders one card per (kid × live event) pair. Pulse-green dot
// indicates active. "Ends 7 PM (in 38 min)" countdown updates as
// parent's useNow ticks.
//
// Visibility: hidden when items is empty. Card removes itself when
// event ends (parent's useNow tick + useLiveNowEvents re-derivation).
//
// NOT in scope: check-in count (10 of 12), coach presence indicator,
// real-time updates. Those need additional queries (check_ins +
// event_arrivals) and are deferred to a follow-up.

import { Link } from 'react-router-dom';

function formatEndsAt(endIso) {
  if (!endIso) return '';
  const d = new Date(endIso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
}

function formatRemaining(endIso, nowMs) {
  if (!endIso || !nowMs) return '';
  const remaining = new Date(endIso).getTime() - nowMs;
  if (remaining <= 0) return '';
  const mins = Math.round(remaining / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rm = mins % 60;
  if (rm === 0) return `in ${hrs}h`;
  return `in ${hrs}h ${rm}m`;
}

export default function LiveNowCard({ items, nowMs }) {
  if (!items?.length) return null;

  return (
    <div aria-label="Live now">
      {items.map((item) => {
        const endTime = formatEndsAt(item.end_at);
        const remaining = formatRemaining(item.end_at, nowMs);
        const subline = endTime
          ? `Ends ${endTime}${remaining ? ` (${remaining})` : ''}`
          : '';
        return (
          <Link
            key={`live:${item.event_id}:${item.kid_first_name}`}
            to={`/events/${item.event_id}`}
            className="as-press"
            style={{
              display: 'block',
              padding: 14,
              marginBottom: 12,
              backgroundColor: 'var(--as-success-soft)',
              border: '1px solid var(--as-success)',
              borderLeft: `4px solid ${item.team_color || 'var(--as-success)'}`,
              borderRadius: 10,
              color: 'var(--as-text-primary)',
              textDecoration: 'none',
              boxShadow: 'var(--as-shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                aria-hidden="true"
                className="as-pulse-dot"
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: 'var(--as-success)',
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--as-success)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Happening now
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--as-text-primary)', lineHeight: 1.3 }}>
              {item.kid_first_name} at {item.event_title}
            </div>
            {subline && (
              <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 4 }}>
                {subline}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
