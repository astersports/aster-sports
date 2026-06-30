// Group a division's games into NY-anchored day buckets for the Hub division
// page (R1·PR-A) Schedule + Bracket tabs. Pure (AP #27). Games carry an ISO
// `startAt` (may be null → a "Date TBD" bucket, sorted last); buckets and the
// games inside them stay chronological. Day label + key are NY-anchored so the
// grouping matches what a parent in the Eastern timezone sees (AP #31).

const DAY_LABEL = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
const DAY_KEY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD

export function groupGamesByDay(games) {
  const buckets = new Map(); // key -> { key, label, games }
  for (const g of games || []) {
    const at = g?.startAt ? new Date(g.startAt) : null;
    const key = at && !Number.isNaN(at.getTime()) ? DAY_KEY.format(at) : 'tbd';
    const label = key === 'tbd' ? 'Date TBD' : DAY_LABEL.format(at);
    if (!buckets.has(key)) buckets.set(key, { key, label, games: [] });
    buckets.get(key).games.push(g);
  }
  const out = [...buckets.values()];
  out.sort((a, b) => (a.key === 'tbd' ? 1 : b.key === 'tbd' ? -1 : a.key.localeCompare(b.key)));
  for (const d of out) d.games.sort((a, b) => String(a.startAt || '~').localeCompare(String(b.startAt || '~')));
  return out;
}
