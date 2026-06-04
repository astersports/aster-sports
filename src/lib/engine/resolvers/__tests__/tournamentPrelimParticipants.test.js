// Q3 (2026-06-04) — tournament_prelim participant scoping.
// prelim is scoped to guardians of players on the tournament roster
// (Frank: prelim = traveler logistics); recap stays whole-team. No roster
// -> whole-team fallback. Synthetic pilot-redirect rows (no guardian_id)
// always pass so the pilot test keeps sending.

import { describe, expect, it } from 'vitest';
import { buildTeamSlices, fetchParticipantGuardiansByTeam } from '../tournamentPrelimHelpers';

const TEAMS = [
  { team_id: 'A', team_name: 'Team A', team_color: '#111', sort_order: 1 },
  { team_id: 'B', team_name: 'Team B', team_color: '#222', sort_order: 2 },
];
const RECIPIENTS = [
  { guardian_id: 'g1', email: 'g1@x', kid_first_names: ['Al'], team_ids: ['A'] },
  { guardian_id: 'g2', email: 'g2@x', kid_first_names: ['Bo'], team_ids: ['A'] },
  { guardian_id: 'g3', email: 'g3@x', kid_first_names: ['Cy'], team_ids: ['B'] },
];
const ids = (slice) => slice.recipient_guardians.map((r) => r.guardian_id ?? r.email);

function sb(tables) {
  return {
    from(table) {
      const rows = tables[table] || [];
      const chain = {
        select: () => chain, eq: () => chain, in: () => chain,
        then: (res) => Promise.resolve({ data: rows, error: null }).then(res),
      };
      return chain;
    },
  };
}

describe('buildTeamSlices participant scoping', () => {
  it('null participantsByTeam -> whole team (unchanged)', () => {
    const slices = buildTeamSlices(TEAMS, RECIPIENTS, null);
    expect(ids(slices[0])).toEqual(['g1', 'g2']); // team A
    expect(ids(slices[1])).toEqual(['g3']); // team B
  });

  it('scopes each team to its participant guardians', () => {
    const participants = new Map([['A', new Set(['g1'])], ['B', new Set(['g3'])]]);
    const slices = buildTeamSlices(TEAMS, RECIPIENTS, participants);
    expect(ids(slices[0])).toEqual(['g1']); // g2 dropped — not a participant
    expect(ids(slices[1])).toEqual(['g3']);
  });

  it('a team with no participants yields zero real recipients', () => {
    const participants = new Map([['A', new Set()], ['B', new Set(['g3'])]]);
    const slices = buildTeamSlices(TEAMS, RECIPIENTS, participants);
    expect(slices[0].recipient_guardians).toEqual([]);
    expect(ids(slices[1])).toEqual(['g3']);
  });

  it('synthetic pilot-redirect rows (no guardian_id) always pass the scope', () => {
    const withRedirect = [
      { guardian_id: null, email: 'pilot@x', kid_first_names: [], team_ids: ['A'] },
      ...RECIPIENTS,
    ];
    const participants = new Map([['A', new Set(['g1'])]]);
    const slices = buildTeamSlices(TEAMS, withRedirect, participants);
    expect(ids(slices[0])).toEqual(['g1', 'pilot@x']); // redirect kept + participant
  });
});

describe('fetchParticipantGuardiansByTeam', () => {
  it('returns null when the tournament has no roster rows (whole-team fallback)', async () => {
    const result = await fetchParticipantGuardiansByTeam(sb({ tournament_rosters: [] }), 't-1');
    expect(result).toBeNull();
  });

  it('maps each team to its participant guardian set', async () => {
    const client = sb({
      tournament_rosters: [
        { team_id: 'A', player_id: 'p1' },
        { team_id: 'A', player_id: 'p2' },
        { team_id: 'B', player_id: 'p3' },
      ],
      player_guardians: [
        { player_id: 'p1', guardian_id: 'g1' },
        { player_id: 'p2', guardian_id: 'g2' },
        { player_id: 'p3', guardian_id: 'g3' },
      ],
    });
    const result = await fetchParticipantGuardiansByTeam(client, 't-1');
    expect([...result.get('A')].sort()).toEqual(['g1', 'g2']);
    expect([...result.get('B')]).toEqual(['g3']);
  });
});
