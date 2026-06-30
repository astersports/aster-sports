import { formatCountdown, formatTime } from '../../lib/formatters';
import { getDirectionUrls } from '../../lib/mapsUrls';

// One game on a team's public Hub schedule (R1·PR-A). Pure presentational —
// receives one element of get_public_aau_team_schedule(). --as-* tokens only,
// no hardcoded hex, 44px+ tap targets on the direction links.

const NY_TZ = 'America/New_York';

// "Sat, Jun 27" — NY-pinned per the timezone-audit invariant (AP #31). The
// time half reuses the shared NY-anchored formatTime().
function gameDay(startAt) {
  if (!startAt) return 'Date TBD';
  return new Date(startAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: NY_TZ });
}

const cardStyle = {
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderRadius: 10, boxShadow: 'var(--as-shadow-sm)', padding: 16,
};
const linkStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '0 14px',
  fontSize: 13, fontWeight: 500, borderRadius: 10, textDecoration: 'none',
  color: 'var(--as-accent)', border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)',
};
const badge = (bg, fg) => ({ fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 6, backgroundColor: bg, color: fg });

export default function AauGameCard({ game }) {
  const g = game || {};
  const isFinal = g.status === 'final';
  const win = isFinal && g.myScore != null && g.oppScore != null && g.myScore > g.oppScore;
  const tie = isFinal && g.myScore === g.oppScore;
  const dir = g.venue ? getDirectionUrls(g.venue.address, g.venue.lat, g.venue.lng, null) : null;
  const venueLine = g.venue ? [g.venue.name, g.venue.city && g.venue.state ? `${g.venue.city}, ${g.venue.state}` : (g.venue.city || g.venue.state)].filter(Boolean).join(' · ') : null;
  const meta = [g.tournament, g.division].filter(Boolean).join(' · ');

  return (
    <article style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)' }}>
          {gameDay(g.startAt)} · {formatTime(g.startAt)}
        </span>
        {isFinal ? (
          <span style={badge(win ? 'var(--as-success-soft)' : tie ? 'var(--as-neutral-soft)' : 'var(--as-danger-soft)',
            win ? 'var(--as-success)' : tie ? 'var(--as-text-secondary)' : 'var(--as-danger)')}>
            {win ? 'W' : tie ? 'T' : 'L'} {g.myScore}–{g.oppScore}
          </span>
        ) : (
          <span style={badge('var(--as-accent-soft)', 'var(--as-accent)')}>{formatCountdown(g.startAt)}</span>
        )}
      </div>

      <p style={{ margin: '8px 0 0', fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>
        {g.isHome ? 'vs' : '@'} {g.opponent || 'TBD'}
      </p>

      {meta && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--as-text-tertiary)' }}>{meta}</p>}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {g.isBracket && <span style={badge('var(--as-academy-soft)', 'var(--as-academy)')}>Bracket</span>}
        {g.isForfeit && <span style={badge('var(--as-warning-soft)', 'var(--as-warning)')}>Forfeit</span>}
        {g.court && <span style={badge('var(--as-bg-secondary)', 'var(--as-text-secondary)')}>{g.court}</span>}
      </div>

      {venueLine && (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--as-text-secondary)' }}>{venueLine}</p>
          {dir && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <a href={dir.google} target="_blank" rel="noopener noreferrer" style={linkStyle} aria-label={`Directions to ${g.venue.name} on Google Maps`}>Google Maps</a>
              {dir.apple && <a href={dir.apple} target="_blank" rel="noopener noreferrer" style={linkStyle} aria-label={`Directions to ${g.venue.name} on Apple Maps`}>Apple Maps</a>}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
