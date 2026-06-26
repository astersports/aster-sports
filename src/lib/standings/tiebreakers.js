/**
 * Tiebreaker resolution for tournament standings (D-FV4).
 *
 * Pure, IO-free (AP #27). The standings engine ranks primarily by win%, then
 * hands each tied group here to be ordered by the circuit's tiebreaker sequence.
 *
 * A linear sequence captures the Zero Gravity rule exactly:
 *   ['head_to_head', 'point_diff']
 *   - 2-way tie  -> head_to_head produces a strict order (the H2H winner ranks up)
 *   - 3-way tie  -> head_to_head is circular/inconclusive, so it does NOT separate
 *                   the group, and the next tiebreaker (point_diff, capped) decides.
 * This mirrors "2 teams tied = head-to-head; 3 teams tied = point differential"
 * without special-casing the group size. Point differential is capped per-game by
 * the circuit's point_differential_cap (Zero Gravity = +20).
 */

const EPS = 1e-9;
const eq = (a, b) => Math.abs(a - b) < EPS;

export function normalizeTeamName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function cappedMargin(margin, cap) {
  if (cap == null) return margin;
  return Math.max(-cap, Math.min(cap, margin));
}

/**
 * Score one team under a single tiebreaker, higher = ranks better.
 * head_to_head / point_diff_vs_tied are computed ONLY over games among the tied
 * group; point_diff / wins / win_pct read the team's overall (capped) totals.
 */
function tiebreakerScore(rule, team, group, games, cap) {
  if (rule === 'point_diff') return team.diff;
  if (rule === 'wins') return team.wins;
  if (rule === 'win_pct') return team.winPct;

  if (rule === 'head_to_head' || rule === 'point_diff_vs_tied') {
    const ids = new Set(group.map((g) => g.id));
    let w = 0, t = 0, gp = 0, pd = 0;
    for (const g of games) {
      if (g.aScore == null || g.bScore == null) continue;       // unfinished
      if (!ids.has(g.aId) || !ids.has(g.bId)) continue;          // not within the tied group
      let me, opp;
      if (g.aId === team.id) { me = g.aScore; opp = g.bScore; }
      else if (g.bId === team.id) { me = g.bScore; opp = g.aScore; }
      else continue;
      gp += 1;
      const m = me - opp;
      pd += cappedMargin(m, cap);
      if (m > 0) w += 1; else if (m === 0) t += 1;
    }
    if (rule === 'point_diff_vs_tied') return pd;
    return gp ? (w + t * 0.5) / gp : 0;                          // no H2H games -> neutral 0
  }
  return 0;
}

/**
 * Order a tied group by the tiebreaker sequence. Each tiebreaker partitions the
 * group; sub-groups that remain tied recurse into the next tiebreaker. When the
 * sequence is exhausted, fall back to a deterministic name sort (stable output).
 */
export function resolveTies(group, games, tiebreakers, cap) {
  if (group.length <= 1) return [...group];
  if (!tiebreakers || tiebreakers.length === 0) {
    return [...group].sort((a, b) => normalizeTeamName(a.name).localeCompare(normalizeTeamName(b.name)));
  }
  const [rule, ...rest] = tiebreakers;
  const scored = group
    .map((t) => ({ t, score: tiebreakerScore(rule, t, group, games, cap) }))
    .sort((x, y) => y.score - x.score);

  const out = [];
  let i = 0;
  while (i < scored.length) {
    let j = i;
    while (j + 1 < scored.length && eq(scored[j + 1].score, scored[i].score)) j += 1;
    const sub = scored.slice(i, j + 1).map((s) => s.t);
    if (sub.length === 1) out.push(sub[0]);
    else out.push(...resolveTies(sub, games, rest, cap));        // still tied -> next tiebreaker
    i = j + 1;
  }
  return out;
}

export const __test = { tiebreakerScore, cappedMargin, eq };
