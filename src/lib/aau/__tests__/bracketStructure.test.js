// §2.B coverage — source-native attribute capture (parseDivisionGames) + pure
// bracket-structure derivation (deriveBracketStructure / parseSeedSource).
// HTML fixtures mirror the real TourneyMachine Division.aspx shape captured live
// 2026-06-27 (data-gameid on the <tr>, data-teamid on team cells, data-facilityid
// on the location cell; seed placeholders "Bracket Winner B<n>" / "<Pool> Nth
// Place"). The edge function uses the byte-near-identical Deno mirrors
// (_parse.ts / _bracket.ts, AP #30).

import { describe, expect, it } from 'vitest';
import { parseDivisionGames } from '../parseTournament.js';
import { deriveBracketStructure, parseSeedSource } from '../bracketStructure.js';

// A two-row games table in the real TM shape: B1 (a play-in between two pool
// seeds) and B2 (the final: the pool 1st vs the winner of B1). Cells:
// [slot, time, location(data-facilityid), team1(data-teamid), s1, s2, team2(data-teamid), buttons].
const GAMES_HTML = `
<table><tbody>
  <tr class='schedule_row date_20260628' data-gameid='h20260624171154AAA' data-seuuid=''>
    <td>B1</td>
    <td>Sun 06/28/26 11:00 AM</td>
    <td data-facilityid='hFAC1'>2 - House of Sports - Court 3</td>
    <td data-teamid=''>National Orange 2nd Place</td>
    <td></td>
    <td></td>
    <td data-teamid=''>National Orange 3rd Place</td>
    <td class="tournamentResultsButtons"></td>
  </tr>
  <tr class='schedule_row date_20260628' data-gameid='h20260624171154BBB' data-seuuid=''>
    <td>B2</td>
    <td>Sun 06/28/26 12:20 PM</td>
    <td data-facilityid='hFAC1'>2 - House of Sports - Court 3</td>
    <td data-teamid=''>National Orange 1st Place</td>
    <td></td>
    <td></td>
    <td data-teamid=''>Bracket Winner B1</td>
    <td class="tournamentResultsButtons"></td>
  </tr>
</tbody></table>`;

describe('parseDivisionGames — §2.B source-native attribute capture', () => {
  const games = parseDivisionGames(GAMES_HTML, new Date('2026-06-28T20:00:00Z'));

  it('still parses the cell text identically (slot label, sides)', () => {
    expect(games.map((g) => g.externalGameId)).toEqual(['B1', 'B2']);
    expect(games[1].homeName).toBe('National Orange 1st Place');
    expect(games[1].awayName).toBe('Bracket Winner B1');
  });

  it('recovers the durable data-gameid off the <tr> (the §2.D Layer-1 ref)', () => {
    expect(games[0].sourceGameId).toBe('h20260624171154AAA');
    expect(games[1].sourceGameId).toBe('h20260624171154BBB');
  });

  it('recovers data-facilityid off the location cell', () => {
    expect(games[0].facilityId).toBe('hFAC1');
  });

  it('leaves team refs empty for unresolved seeds (data-teamid="")', () => {
    expect(games[1].homeTeamRef).toBe('');
    expect(games[1].awayTeamRef).toBe('');
  });

  it('flags both bracket sides as placeholders (unseeded)', () => {
    expect(games[1].homePlaceholder).toBe(true);
    expect(games[1].awayPlaceholder).toBe(true);
  });
});

describe('parseSeedSource', () => {
  it('parses pool-finish placements', () => {
    expect(parseSeedSource('National Orange 1st Place', true)).toEqual({ kind: 'pool_finish', poolGroup: 'National Orange', rank: 1 });
    expect(parseSeedSource('Pool A 2nd Place', true)).toEqual({ kind: 'pool_finish', poolGroup: 'Pool A', rank: 2 });
  });
  it('parses winner/loser advancement edges', () => {
    expect(parseSeedSource('Bracket Winner B1', true)).toEqual({ kind: 'winner', fromSlot: 'B1' });
    expect(parseSeedSource('Bracket Loser B3', true)).toEqual({ kind: 'loser', fromSlot: 'B3' });
  });
  it('treats a non-placeholder side as a concrete team', () => {
    expect(parseSeedSource('High Rise (NY)', false)).toEqual({ kind: 'team' });
  });
});

describe('deriveBracketStructure — 3-team mini bracket (incomplete → neutral depth)', () => {
  const games = parseDivisionGames(GAMES_HTML, new Date('2026-06-28T20:00:00Z'));
  const slots = deriveBracketStructure(games);

  it('emits one slot per game side (2 per game)', () => {
    expect(slots.length).toBe(4);
  });
  it('labels the terminal game "Final" and the play-in with a NEUTRAL depth (no fabrication)', () => {
    const b2 = slots.filter((s) => s.gameCode === 'B2');
    const b1 = slots.filter((s) => s.gameCode === 'B1');
    expect(b2.every((s) => s.round === 'Final' && s.isFinal)).toBe(true);
    // a 3-team bracket is NOT a clean binary tree → not "Semifinal", a neutral token
    expect(b1.every((s) => s.round === 'Round -1')).toBe(true);
  });
  it('builds the advancement edge from the winner-of seed text', () => {
    const b1home = slots.find((s) => s.gameCode === 'B1' && s.side === 'home');
    const b2away = slots.find((s) => s.gameCode === 'B2' && s.side === 'away');
    expect(b1home.advancesTo).toEqual({ round: b2away.round, slotIndex: b2away.slotIndex });
    expect(slots.filter((s) => s.gameCode === 'B2').every((s) => s.advancesTo === null)).toBe(true);
  });
});

describe('deriveBracketStructure — resolved snapshot has no derivable structure', () => {
  // Once a bracket completes, TM shows real team names (no seed placeholders) and
  // the advancement topology is gone from the schedule table. The derivation must
  // return [] so a late ingest can't overwrite structure captured while seeded.
  const resolved = [
    { externalGameId: 'B1', homeName: 'High Rise (NY)', awayName: 'Lady Breakers (MA)', homePlaceholder: false, awayPlaceholder: false },
    { externalGameId: 'B2', homeName: 'High Rise (NY)', awayName: 'Zero Gravity (CT)', homePlaceholder: false, awayPlaceholder: false },
  ];
  it('returns [] when every side has resolved to a concrete team', () => {
    expect(deriveBracketStructure(resolved)).toEqual([]);
  });
});

describe('deriveBracketStructure — clean 4-team bracket (size proves the names)', () => {
  // B1, B2 = semifinals (pool seeds); B3 = final (winners of B1, B2).
  const fourTeam = [
    { externalGameId: 'B1', homeName: 'Pool A 1st Place', awayName: 'Pool B 2nd Place', homePlaceholder: true, awayPlaceholder: true },
    { externalGameId: 'B2', homeName: 'Pool B 1st Place', awayName: 'Pool A 2nd Place', homePlaceholder: true, awayPlaceholder: true },
    { externalGameId: 'B3', homeName: 'Bracket Winner B1', awayName: 'Bracket Winner B2', homePlaceholder: true, awayPlaceholder: true },
  ];
  const slots = deriveBracketStructure(fourTeam);

  it('names depth-1 "Semifinal" and the terminal "Final" when the bracket is complete', () => {
    expect(slots.filter((s) => s.gameCode === 'B1').every((s) => s.round === 'Semifinal')).toBe(true);
    expect(slots.filter((s) => s.gameCode === 'B2').every((s) => s.round === 'Semifinal')).toBe(true);
    expect(slots.filter((s) => s.gameCode === 'B3').every((s) => s.round === 'Final')).toBe(true);
  });
  it('gives the two semifinal games distinct slot_indices within the round', () => {
    const semi = slots.filter((s) => s.round === 'Semifinal').map((s) => s.slotIndex).sort((a, b) => a - b);
    expect(semi).toEqual([0, 1, 2, 3]);
  });
  it('routes each semifinal winner to the correct final slot', () => {
    const b3home = slots.find((s) => s.gameCode === 'B3' && s.side === 'home');
    const b3away = slots.find((s) => s.gameCode === 'B3' && s.side === 'away');
    expect(slots.find((s) => s.gameCode === 'B1' && s.side === 'home').advancesTo)
      .toEqual({ round: 'Final', slotIndex: b3home.slotIndex });
    expect(slots.find((s) => s.gameCode === 'B2' && s.side === 'home').advancesTo)
      .toEqual({ round: 'Final', slotIndex: b3away.slotIndex });
  });
});
