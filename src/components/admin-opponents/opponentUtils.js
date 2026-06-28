// §4.O L99 — pure helpers for the admin opponents directory. Extracted
// from AdminOpponentsPage so the page stays ≤150 lines and the logic is
// unit-testable. All functions are pure (no Date.now()/Math.random()).

export const CIRCUIT_LABELS = {
  aau: 'AAU',
  league_play: 'League Play',
  tournament: 'Tournament',
};

// Status-token map per circuit so badges read consistently with the
// rest of the platform. Tokens only — never hardcoded hex.
export const CIRCUIT_BADGE = {
  aau: { bg: 'var(--as-info-soft)', fg: 'var(--as-info)' },
  league_play: { bg: 'var(--as-success-soft)', fg: 'var(--as-success)' },
  tournament: { bg: 'var(--as-academy-soft)', fg: 'var(--as-academy)' },
};

export function circuitLabel(circuit) {
  return CIRCUIT_LABELS[circuit] || circuit || 'Other';
}

export function matchesOpponent(o, q) {
  if (!q) return true;
  const haystack = [o.name, o.city, o.state, o.circuit, CIRCUIT_LABELS[o.circuit]]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

export function gamesPlayed(o) {
  return (o.head_to_head_wins || 0) + (o.head_to_head_losses || 0);
}

export function formatRecord(o) {
  const w = o.head_to_head_wins || 0;
  const l = o.head_to_head_losses || 0;
  if (w === 0 && l === 0) return 'No games played';
  return `${w}-${l}`;
}

// Win rate as a 0-100 integer, or null when no games are on record.
export function winRate(o) {
  const total = gamesPlayed(o);
  if (total === 0) return null;
  return Math.round(((o.head_to_head_wins || 0) / total) * 100);
}

// `nowMs` injected so render stays pure (no Date.now() in render).
export function formatLastPlayed(iso, nowMs) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const abs = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });
  if (typeof nowMs !== 'number') return abs;
  const days = Math.floor((nowMs - d.getTime()) / 86400000);
  if (days < 0) return abs;
  if (days === 0) return `${abs} · today`;
  if (days < 7) return `${abs} · ${days}d ago`;
  return abs;
}

// Dedupe clarity: surface opponents whose normalized name collides with
// another row so an admin can spot near-duplicate entries before adding.
function normalizeName(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function duplicateNameSet(opponents) {
  const counts = new Map();
  for (const o of opponents) {
    const key = normalizeName(o.name);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const dupes = new Set();
  for (const [key, n] of counts) if (n > 1) dupes.add(key);
  return dupes;
}

export function isDuplicate(o, dupeSet) {
  return dupeSet.has(normalizeName(o.name));
}

export const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'games', label: 'Most played' },
  { value: 'recent', label: 'Recently played' },
];

export function sortOpponents(list, sort) {
  const copy = [...list];
  if (sort === 'games') {
    copy.sort((a, b) => gamesPlayed(b) - gamesPlayed(a) || a.name.localeCompare(b.name));
  } else if (sort === 'recent') {
    copy.sort((a, b) => {
      const at = a.last_played_at ? new Date(a.last_played_at).getTime() : -Infinity;
      const bt = b.last_played_at ? new Date(b.last_played_at).getTime() : -Infinity;
      return bt - at || a.name.localeCompare(b.name);
    });
  } else {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  return copy;
}
