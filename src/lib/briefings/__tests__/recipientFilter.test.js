import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  filterRecipientsByTeams,
  resolveAudience,
  resolvePlayerSpecificAudience,
} from '../recipientFilter';

const RECIPIENTS = [
  { guardian_id: 'g1', email: 'a@x', team_ids: ['t-11g', 't-8b'] },
  { guardian_id: 'g2', email: 'b@x', team_ids: ['t-8b'] },
  { guardian_id: 'g3', email: 'c@x', team_ids: ['t-10blue'] },
  { guardian_id: 'g4', email: 'd@x', team_ids: ['t-10blue'] },
  { guardian_id: 'g5', email: 'e@x', team_ids: ['t-10black', 't-11g'] },
];

describe('filterRecipientsByTeams', () => {
  it('null teamIds is pass-through (org_all)', () => {
    expect(filterRecipientsByTeams(RECIPIENTS, null)).toHaveLength(5);
  });
  it('empty teamIds returns no recipients', () => {
    expect(filterRecipientsByTeams(RECIPIENTS, [])).toEqual([]);
  });
  it('single team filters by overlap', () => {
    const out = filterRecipientsByTeams(RECIPIENTS, ['t-10blue']);
    expect(out.map((r) => r.guardian_id)).toEqual(['g3', 'g4']);
  });
  it('multi team unions across overlap', () => {
    const out = filterRecipientsByTeams(RECIPIENTS, ['t-10blue', 't-10black']);
    expect(out.map((r) => r.guardian_id).sort()).toEqual(['g3', 'g4', 'g5']);
  });
  it('guardian on multiple teams matches if any overlap', () => {
    const out = filterRecipientsByTeams(RECIPIENTS, ['t-11g']);
    expect(out.map((r) => r.guardian_id).sort()).toEqual(['g1', 'g5']);
  });
  it('defensive: missing recipients returns empty', () => {
    expect(filterRecipientsByTeams(undefined, ['t-anything'])).toEqual([]);
    expect(filterRecipientsByTeams(null, null)).toEqual([]);
  });
  it('defensive: recipient with no team_ids is excluded', () => {
    const r = [{ guardian_id: 'g0', email: 'z@x' }, ...RECIPIENTS.slice(0, 1)];
    const out = filterRecipientsByTeams(r, ['t-11g']);
    expect(out.map((g) => g.guardian_id)).toEqual(['g1']);
  });
});

// Wave 4.1d-2 §5.3 — player_specific audience resolver (G2)
describe('resolveAudience for player_specific (G2)', () => {
  it('empty player_ids returns empty audience + no team_ids', async () => {
    // No supabase touch when input is empty.
    const out = await resolveAudience({
      recipients: RECIPIENTS, audienceType: 'player_specific',
      audienceFilter: { player_ids: [] }, anchorId: null,
    });
    expect(out.audience).toEqual([]);
    expect(out.teamIds).toEqual([]);
  });

  it('missing audience_filter returns empty', async () => {
    const out = await resolveAudience({
      recipients: RECIPIENTS, audienceType: 'player_specific',
      audienceFilter: null, anchorId: null,
    });
    expect(out.audience).toEqual([]);
    expect(out.teamIds).toEqual([]);
  });

  it('non-array player_ids returns empty', async () => {
    const out = await resolveAudience({
      recipients: RECIPIENTS, audienceType: 'player_specific',
      audienceFilter: { player_ids: 'not-an-array' }, anchorId: null,
    });
    expect(out.audience).toEqual([]);
  });
});

// player_specific resolves players → teams via team_players (NOT players.team_id,
// which does not exist). A player can be on MULTIPLE teams; a guardian's team_ids
// must union across all their kids' team_players rows.
describe('resolvePlayerSpecificAudience — teams via team_players', () => {
  afterEach(() => vi.restoreAllMocks());

  // Mock shaped to the real schema: team_players(player_id, team_id) +
  // player_guardians(player_id, guardian_id, guardians(email)). No players.team_id.
  function mockSupabase({ teamPlayers, playerGuardians }) {
    const from = vi.fn((table) => {
      const data = table === 'team_players' ? teamPlayers : playerGuardians;
      const builder = {
        select: vi.fn(() => builder),
        in: vi.fn(() => Promise.resolve({ data, error: null })),
      };
      return builder;
    });
    vi.doMock('../../supabase', () => ({ supabase: { from } }));
    return { from };
  }

  it('resolves a player on 2 teams — guardian gets both team_ids; no players.team_id read', async () => {
    const { from } = mockSupabase({
      // p1 is on two teams; p2 is on one. g1 guards both p1 and p2.
      teamPlayers: [
        { player_id: 'p1', team_id: 't-a' },
        { player_id: 'p1', team_id: 't-b' },
        { player_id: 'p2', team_id: 't-c' },
      ],
      playerGuardians: [
        { player_id: 'p1', guardian_id: 'g1', guardians: { email: 'g1@x' } },
        { player_id: 'p2', guardian_id: 'g1', guardians: { email: 'g1@x' } },
        { player_id: 'p1', guardian_id: 'g2', guardians: { email: 'g2@x' } },
      ],
    });
    const out = await resolvePlayerSpecificAudience(['p1', 'p2']);

    // team_players was queried (the fix) — never players.
    expect(from).toHaveBeenCalledWith('team_players');
    expect(from).not.toHaveBeenCalledWith('players');

    const g1 = out.find((a) => a.guardian_id === 'g1');
    const g2 = out.find((a) => a.guardian_id === 'g2');
    // g1 guards p1 (t-a, t-b) and p2 (t-c) → union of all three.
    expect(g1.team_ids.sort()).toEqual(['t-a', 't-b', 't-c']);
    // g2 guards only p1 → both of p1's teams.
    expect(g2.team_ids.sort()).toEqual(['t-a', 't-b']);
  });

  it('player with no team_players rows yields a guardian with empty team_ids', async () => {
    mockSupabase({
      teamPlayers: [],
      playerGuardians: [
        { player_id: 'p9', guardian_id: 'g9', guardians: { email: 'g9@x' } },
      ],
    });
    const out = await resolvePlayerSpecificAudience(['p9']);
    expect(out).toEqual([{ guardian_id: 'g9', email: 'g9@x', team_ids: [] }]);
  });

  it('empty playerIds short-circuits without any supabase touch', async () => {
    const { from } = mockSupabase({ teamPlayers: [], playerGuardians: [] });
    expect(await resolvePlayerSpecificAudience([])).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });
});

// games_recap (G1) — multi_event_attendees audience plumbing (PR A)
describe('resolveAudience for multi_event_attendees (games_recap G1)', () => {
  it('empty / missing / non-array event_ids returns empty without supabase touch', async () => {
    for (const audienceFilter of [{ event_ids: [] }, null, { event_ids: 'nope' }]) {
      const out = await resolveAudience({
        recipients: RECIPIENTS, audienceType: 'multi_event_attendees', audienceFilter, anchorId: null,
      });
      expect(out.teamIds).toEqual([]);
      expect(out.audience).toEqual([]);
    }
  });
});
