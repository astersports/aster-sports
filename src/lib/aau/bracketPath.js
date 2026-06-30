// Group a division's bracket games into NY-anchored day buckets for the Hub
// "Playoff path" view (R1·PR-A). Pure (AP #27). The RPC already returns games
// soonest-first; this preserves that order within each day and orders the day
// buckets by their first game. Games with no start time land in a trailing
// "Date TBD" bucket so a not-yet-scheduled round still shows the matchup.

const NY_TZ = 'America/New_York';

// "Thursday, Aug 13" — NY-pinned (AP #31): a parent on any timezone sees the
// tournament's local game day.
function dayLabel(startAt) {
  return new Date(startAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: NY_TZ });
}

// NY calendar day key (YYYY-MM-DD) so buckets split on the tournament's midnight,
// not the viewer's.
function dayKey(startAt) {
  return new Date(startAt).toLocaleDateString('en-CA', { timeZone: NY_TZ });
}

export function groupBracketByDay(games) {
  const buckets = new Map();
  for (const g of games || []) {
    const key = g?.startAt ? dayKey(g.startAt) : 'tbd';
    if (!buckets.has(key)) {
      buckets.set(key, { key, label: g?.startAt ? dayLabel(g.startAt) : 'Date TBD', games: [] });
    }
    buckets.get(key).games.push(g);
  }
  // 'tbd' always sorts last; real ISO day-keys compare lexicographically (== chronologically).
  return [...buckets.values()].sort((a, b) => {
    if (a.key === 'tbd') return 1;
    if (b.key === 'tbd') return -1;
    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  });
}
