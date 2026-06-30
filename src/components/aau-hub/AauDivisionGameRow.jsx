// One game on the Hub division page Schedule/Bracket tabs (R1·PR-A). Mirrors the
// source layout: home + away stacked on the left with scores aligned right, and a
// status/time chip (Final · FF · or tip-off time) + venue line. Bracket games may
// still carry placeholder seed names before they're played. --as-* tokens only.
// *Row test ships alongside (AP #46).

const TIME = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

function timeLabel(startAt) {
  if (!startAt) return 'TBD';
  const d = new Date(startAt);
  return Number.isNaN(d.getTime()) ? 'TBD' : TIME.format(d);
}

const card = {
  display: 'flex', alignItems: 'stretch', gap: 12, padding: 12,
  backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)',
  borderRadius: 10, boxShadow: 'var(--as-shadow-sm)',
};

function Side({ name, score, show, win }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <span style={{ fontSize: 15, fontWeight: win ? 700 : 500, color: 'var(--as-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'TBD'}</span>
      {show && <span style={{ flexShrink: 0, fontSize: 15, fontWeight: win ? 700 : 500, color: 'var(--as-text-primary)' }}>{score ?? '—'}</span>}
    </div>
  );
}

export default function AauDivisionGameRow({ game }) {
  const g = game || {};
  const isFinal = g.status === 'final';
  const homeWin = isFinal && (g.homeScore ?? 0) > (g.awayScore ?? 0);
  const awayWin = isFinal && (g.awayScore ?? 0) > (g.homeScore ?? 0);
  const venue = g.venue?.name ? [g.venue.name, g.court].filter(Boolean).join(' · ') : (g.court || null);

  return (
    <article style={card}>
      <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 4 }}>
        <Side name={g.home} score={g.homeScore} show={isFinal} win={homeWin} />
        <Side name={g.away} score={g.awayScore} show={isFinal} win={awayWin} />
        {venue && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--as-text-meta)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{venue}</p>}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', borderLeft: '1px solid var(--as-border-subtle)', paddingLeft: 12, minWidth: 52 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: isFinal ? 'var(--as-text-secondary)' : 'var(--as-text-primary)' }}>
          {isFinal ? (g.isForfeit ? 'FF' : 'Final') : timeLabel(g.startAt)}
        </span>
        {g.isBracket && <span style={{ marginTop: 2, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--as-accent)' }}>Bracket</span>}
      </div>
    </article>
  );
}
