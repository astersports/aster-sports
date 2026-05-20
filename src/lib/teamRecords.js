// Shared team-records math. Extracted so single-team (useTeamRecords)
// and org-wide (useOrgTeamRecords) hooks compute the same shape from
// the same logic — one source of truth for W/L/T branching, streak
// walk, record formatting, and the empty-state default.
//
// Result handling: 'W' / 'L' / 'T' counted explicitly. null or
// unexpected values are skipped (better than silently miscounting).
// Record formats as "W-L" when ties=0 (preserving existing display),
// "W-L-T" when ties>0. A tie breaks the streak; T-streaks don't render.

// 2026-05-20 — single-decimal formatter shared across TeamRow / TeamDetail
// / TeamHeaderCard. Frank flagged "9U Boys · 21 PA" rendering without
// decimal while sibling rows showed "20.4 PA" etc. — template literal
// dropped the trailing zero from exact integers (e.g. 147 ÷ 7 = 21.0).
// Always-1-decimal keeps the column rhythm consistent.
export function fmt1(n) {
  if (n == null || Number.isNaN(n)) return '0.0';
  return Number(n).toFixed(1);
}

export const EMPTY_SUMMARY = {
  record: '0-0',
  ties: 0,
  streak: '—',
  last5: [],
  ppg: 0,
  allowed: 0,
  diff: 0,
  winPct: 0,
  gamesPlayed: 0,
  pointsFor: 0,
  pointsAgainst: 0,
};

export function computeSummary(games) {
  const n = games.length;
  if (n === 0) return EMPTY_SUMMARY;
  const sorted = [...games].sort((a, b) => {
    const da = a.event?.start_at || a.start_at || '';
    const db = b.event?.start_at || b.start_at || '';
    return da < db ? -1 : da > db ? 1 : 0;
  });

  let wins = 0, losses = 0, ties = 0, pf = 0, pa = 0;
  for (const g of games) {
    pf += Number(g.our_score) || 0;
    pa += Number(g.opponent_score) || 0;
    if (g.result === 'W') wins += 1;
    else if (g.result === 'L') losses += 1;
    else if (g.result === 'T') ties += 1;
    // null / void / anything else: skip silently rather than miscount
  }

  // Walk newest → oldest. A T (or any non-W/L) breaks the streak entirely.
  let streakKind = null, streakLen = 0;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const kind = sorted[i].result;
    if (kind !== 'W' && kind !== 'L') break;
    if (streakKind === null) { streakKind = kind; streakLen = 1; continue; }
    if (kind === streakKind) streakLen += 1; else break;
  }

  const ppg     = +(pf / n).toFixed(1);
  const allowed = +(pa / n).toFixed(1);
  const diff    = +((pf - pa) / n).toFixed(1);
  const winPct  = Math.round((wins / n) * 100);

  // Last 5 results in chronological order (oldest → newest)
  const last5 = sorted.slice(-5).map((g) => g.result).filter((r) => r === 'W' || r === 'L' || r === 'T');

  return {
    record: ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`,
    ties,
    streak: streakKind ? `${streakKind}${streakLen}` : '—',
    last5,
    ppg, allowed, diff, winPct,
    gamesPlayed: n,
    pointsFor: pf,
    pointsAgainst: pa,
  };
}
