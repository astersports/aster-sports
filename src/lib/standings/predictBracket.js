/**
 * D-FV5 bracket-qualification predictor — ratified (option R): the math is
 * DETERMINISTIC, exact; only the narration is AI (done elsewhere). Pure, IO-free.
 *
 * Approach: enumerate every win/loss combination of the division's REMAINING games,
 * run the SAME computeStandings engine (AP #63) on completed + simulated games for
 * each combination, and count the fraction where the focus team finishes in the top
 * `advanceCount`. That fraction IS the true odds — every outcome enumerated, not
 * estimated. Clinch / elimination statements fall out of the same enumeration.
 *
 * OQ5 guard: if advanceCount is null (the division's advancement rule is unconfirmed),
 * return { available:false } — show standings, label advancement "TBD", withhold odds.
 *
 * KNOWN LIMITATION (flagged for a later refinement): simulated games use a nominal
 * 1-0 margin, so margin-DEPENDENT tiebreaks ("lose by <=14 and you still hold 2nd")
 * are not yet resolved at the threshold level — odds are computed at win/loss
 * granularity. Completed games keep their real (capped) margins.
 */
import { computeStandings } from './computeStandings';

const MAX_ENUM_GAMES = 16;            // 2^16 = 65,536 outcomes — beyond this we decline rather than sample silently

function focusAdvances(standings, focusId) {
  const row = standings.find((r) => r.id === focusId);
  return !!row?.advances;
}

export function predictBracket({ teams = [], games = [], remaining = [], rules = {}, advanceCount = null, focusId } = {}) {
  if (advanceCount == null) return { available: false, reason: 'advance_count_unconfirmed' };
  if (!focusId) return { available: false, reason: 'no_focus' };

  // Already decided: no games left.
  if (remaining.length === 0) {
    const final = computeStandings({ teams, games, rules, advanceCount });
    const adv = focusAdvances(final, focusId);
    return { available: true, decided: true, oddsPct: adv ? 100 : 0, status: adv ? 'in' : 'out', outcomes: 1, advancing: adv ? 1 : 0, scenarios: [] };
  }
  if (remaining.length > MAX_ENUM_GAMES) {
    return { available: false, reason: 'too_many_outcomes', remaining: remaining.length };
  }

  const k = remaining.length;
  const total = 1 << k;
  const focusGameIdx = remaining.findIndex((g) => g.aId === focusId || g.bId === focusId);

  let advancing = 0;
  let winFocusTotal = 0, winFocusAdv = 0, loseFocusTotal = 0, loseFocusAdv = 0;

  for (let mask = 0; mask < total; mask += 1) {
    const sim = remaining.map((g, j) => {
      const aWins = ((mask >> j) & 1) === 0;                 // bit j clear => home/aId wins
      return { aId: g.aId, bId: g.bId, aScore: aWins ? 1 : 0, bScore: aWins ? 0 : 1 };
    });
    const adv = focusAdvances(computeStandings({ teams, games: games.concat(sim), rules, advanceCount }), focusId);
    if (adv) advancing += 1;

    if (focusGameIdx >= 0) {
      const g = remaining[focusGameIdx];
      const aWins = ((mask >> focusGameIdx) & 1) === 0;
      const focusWon = (g.aId === focusId && aWins) || (g.bId === focusId && !aWins);
      if (focusWon) { winFocusTotal += 1; if (adv) winFocusAdv += 1; }
      else { loseFocusTotal += 1; if (adv) loseFocusAdv += 1; }
    }
  }

  const oddsPct = Math.round((advancing / total) * 100);
  let status = 'live';
  if (advancing === total) status = 'clinched';
  else if (advancing === 0) status = 'eliminated';

  const scenarios = [];
  if (focusGameIdx >= 0 && status === 'live') {
    if (winFocusTotal > 0 && winFocusAdv === winFocusTotal) scenarios.push({ kind: 'in', text: 'Win your next game and you clinch.' });
    if (loseFocusTotal > 0 && loseFocusAdv === 0) scenarios.push({ kind: 'out', text: 'Lose your next game and you are out.' });
    if (loseFocusTotal > 0 && loseFocusAdv > 0 && loseFocusAdv < loseFocusTotal) scenarios.push({ kind: 'maybe', text: 'A loss still leaves you in, depending on the other results.' });
  }

  return { available: true, decided: false, oddsPct, status, outcomes: total, advancing, scenarios };
}
