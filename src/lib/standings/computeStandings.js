/**
 * Rule-driven tournament standings engine (D-FV4) — ratified by the architect
 * 2026-06-26 (option ii). Pure, IO-free (AP #27): same games + same rules ->
 * deeply-equal standings. The SAME engine powers both the standings table AND the
 * D-FV5 bracket predictor, so qualification math has ONE source of truth (AP #63).
 *
 * Inputs:
 *   teams       [{ id, name }]   resolved identities — id is a stable key (team_id /
 *                                opponent_id) or a normalized name (see schema OQ2).
 *                                Pass every division team so 0-game teams still rank.
 *   games       [{ aId, bId, aScore, bScore }]  FINISHED games only (caller filters
 *                                to published results). aScore/bScore null = skipped.
 *   rules       { pointDiffCap: number|null, tiebreakers: string[] }
 *                                Mapped from circuit_rules: pointDiffCap =
 *                                point_differential_cap (Zero Gravity = 20);
 *                                tiebreakers default ['head_to_head','point_diff'].
 *   advanceCount number|null     top-N advance to the bracket. Per the architect's
 *                                OQ5 guard: pass the CONFIRMED per-division value, or
 *                                null to withhold the advances flag ("advancement TBD")
 *                                rather than predicting on the schema default.
 *
 * Output: ranked [{ id, name, gp, wins, losses, ties, pf, pa, diff, winPct, rank,
 *                   advances }]  diff is the per-game-capped differential.
 */
import { resolveTies } from './tiebreakers';

const EPS = 1e-9;
const eq = (a, b) => Math.abs(a - b) < EPS;

const DEFAULT_TIEBREAKERS = ['head_to_head', 'point_diff'];

function capMargin(margin, cap) {
  if (cap == null) return margin;
  return Math.max(-cap, Math.min(cap, margin));
}

export function computeStandings({ teams = [], games = [], rules = {}, advanceCount = null } = {}) {
  // Coerce a numeric-string cap ("20") so it isn't silently dropped; null /
  // undefined / '' stay "no cap" (Number('') and Number(null) are 0, which
  // would wrongly cap every margin at 0).
  const rawCap = rules.pointDiffCap;
  const capNum = Number(rawCap);
  const cap = (rawCap != null && rawCap !== '' && Number.isFinite(capNum)) ? capNum : null;
  const tiebreakers = rules.tiebreakers?.length ? rules.tiebreakers : DEFAULT_TIEBREAKERS;

  const rec = new Map();
  const ensure = (id, name) => {
    if (!rec.has(id)) {
      rec.set(id, { id, name: name ?? id, gp: 0, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, diff: 0 });
    }
    return rec.get(id);
  };
  for (const t of teams) ensure(t.id, t.name);

  for (const g of games) {
    if (g.aScore == null || g.bScore == null) continue;          // unfinished
    const a = ensure(g.aId, g.aName);
    const b = ensure(g.bId, g.bName);
    a.gp += 1; b.gp += 1;
    a.pf += g.aScore; a.pa += g.bScore;
    b.pf += g.bScore; b.pa += g.aScore;
    const margin = g.aScore - g.bScore;
    const capped = capMargin(margin, cap);
    a.diff += capped; b.diff -= capped;
    if (margin > 0) { a.wins += 1; b.losses += 1; }
    else if (margin < 0) { b.wins += 1; a.losses += 1; }
    else { a.ties += 1; b.ties += 1; }
  }

  const rows = Array.from(rec.values()).map((r) => ({
    ...r,
    winPct: r.gp ? (r.wins + r.ties * 0.5) / r.gp : 0,
  }));

  // Primary sort: win% desc. Equal-win% groups resolve through the tiebreaker chain.
  rows.sort((x, y) => y.winPct - x.winPct);
  const ranked = [];
  let i = 0;
  while (i < rows.length) {
    let j = i;
    while (j + 1 < rows.length && eq(rows[j + 1].winPct, rows[i].winPct)) j += 1;
    const group = rows.slice(i, j + 1);
    if (group.length === 1) ranked.push(group[0]);
    else ranked.push(...resolveTies(group, games, tiebreakers, cap));
    i = j + 1;
  }

  return ranked.map((r, idx) => ({
    ...r,
    rank: idx + 1,
    advances: advanceCount == null ? null : idx < advanceCount,
  }));
}

/** Build the engine's `rules` object from a circuit_rules row. */
export function rulesFromCircuit(circuitRow) {
  return {
    pointDiffCap: circuitRow?.point_differential_cap ?? null,
    tiebreakers: DEFAULT_TIEBREAKERS,   // free-form circuit_rules.tiebreaker_rules stays display-only (see OQ note)
  };
}
