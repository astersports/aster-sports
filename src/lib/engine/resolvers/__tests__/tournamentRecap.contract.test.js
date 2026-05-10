// Wave 4.2-A-4 contract tests for tournamentRecap resolver pair.

import { describe, expect, it } from 'vitest';
import { composeTournamentRecap, resolveTournamentRecap } from '../tournamentRecap';
import { mockClient } from './mockSupabase';
import tournament from './fixtures/tournament_recap_chase_for_the_chain/tournament.json';
import tournament_teams from './fixtures/tournament_recap_chase_for_the_chain/tournament_teams.json';
import events from './fixtures/tournament_recap_chase_for_the_chain/events.json';
import game_results from './fixtures/tournament_recap_chase_for_the_chain/game_results.json';
import locations from './fixtures/tournament_recap_chase_for_the_chain/locations.json';
import players from './fixtures/tournament_recap_chase_for_the_chain/players.json';
import recipients from './fixtures/tournament_recap_chase_for_the_chain/recipients.json';
import coaches from './fixtures/tournament_recap_chase_for_the_chain/coaches.json';
import organization from './fixtures/tournament_recap_chase_for_the_chain/organization.json';

function recipientsToRpcShape(rows) {
  const m = new Map();
  for (const r of rows) {
    if (!m.has(r.guardian_id)) m.set(r.guardian_id, { guardian_id: r.guardian_id, email: r.email, full_name: '', is_pilot_family: r.is_pilot_family, team_ids: [], team_names: [] });
    m.get(r.guardian_id).team_ids.push(r.team_id);
  }
  return Array.from(m.values());
}

function buildPlayerGuardians(rows) {
  const out = []; const seen = new Set();
  for (const r of rows) for (const fn of r.kid_first_names) {
    const k = `${r.guardian_id}|${fn}`; if (seen.has(k)) continue; seen.add(k);
    out.push({ guardian_id: r.guardian_id, first_name: fn });
  }
  return out;
}

const TID = '61e2cbca-af87-4685-a928-57d3da06cd84';
const NOW = new Date('2026-05-07T12:00:00Z');
const FIXTURES = {
  tournament, tournament_teams, events, game_results, locations, players,
  coaches, organization,
  recipients: recipientsToRpcShape(recipients),
  player_guardians: buildPlayerGuardians(recipients),
};
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('tournament_recap resolver — contract', () => {
  it('1. resolver pure: identical inputs -> deeply-equal outputs', async () => {
    const a = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const b = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(norm(a)).toEqual(norm(b));
  });

  it('2. compose pure: same context+slice+overrides -> same content_sections', async () => {
    const { context, slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const o = { coach_reflection: 'good weekend' };
    const a = composeTournamentRecap(context, slices[0], o);
    const b = composeTournamentRecap(context, slices[0], o);
    expect(norm(a)).toEqual(norm(b));
  });

  it('3. slice ordering: sort_order ASC then team_id ASC; recipients guardian_id ASC', async () => {
    const reversed = { ...FIXTURES, tournament_teams: [...tournament_teams].reverse() };
    const { slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(reversed), now: NOW });
    expect(slices.map((s) => s.sort_order)).toEqual([1, 2, 5]);
    for (const s of slices) {
      const ids = s.recipient_guardians.map((g) => g.guardian_id);
      expect(ids).toEqual([...ids].sort());
    }
  });

  it('4. pilotOnly filters recipient_guardians within slices, not slices themselves', async () => {
    const { slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: true }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(slices.length).toBe(3);
    const byTeam = Object.fromEntries(slices.map((s) => [s.team_name, s.recipient_guardians.length]));
    expect(byTeam['11U Girls']).toBe(2);
    expect(byTeam['10U Black']).toBe(0);
    expect(byTeam['8U Boys']).toBe(2);
  });

  it('5. empty tournament_teams -> slices = []', async () => {
    const empty = { ...FIXTURES, tournament_teams: [] };
    const { slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(empty), now: NOW });
    expect(slices).toEqual([]);
  });

  it('6. no fabrication on game_log: unpublished/null POG/empty highlight', async () => {
    // Variant A: 11U Girls' first game gets published_at=null
    const grA = game_results.map((r) => r.event_id === 'bb20c869-af98-4d39-9739-9de0bbb78e4e' ? { ...r, published_at: null } : r);
    const fA = { ...FIXTURES, game_results: grA };
    const { context: cA, slices: sA } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(fA), now: NOW });
    const { content_sections: csA } = composeTournamentRecap(cA, sA[0], {});
    const log = csA.find((s) => s.kind === 'game_log');
    const unpublishedRow = log.days[0].rows[0];
    expect(unpublishedRow.status).toBe('Result not published');
    expect(unpublishedRow.result).toBeNull();
    expect(unpublishedRow.our_score).toBeUndefined();

    // Variant B: 8U Boys POG row has player_of_game_id null AND coach_highlight empty
    const grB = game_results.map((r) => r.event_id === 'a4208b85-5653-4aaf-be53-f1e47eeb707d' ? { ...r, player_of_game_id: null, coach_highlight: '' } : r);
    const fB = { ...FIXTURES, game_results: grB };
    const { context: cB, slices: sB } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(fB), now: NOW });
    const { content_sections: csB } = composeTournamentRecap(cB, sB[2], {});
    const logB = csB.find((s) => s.kind === 'game_log');
    const firstRow = logB.days[0].rows[0];
    expect(firstRow.player_of_game).toBeUndefined();
    expect(firstRow.coach_highlight).toBeUndefined();
    expect(firstRow.result).toBe('W');
  });

  it('7. no fabrication on placement: null final_place omits block; record absent if 0-0', async () => {
    // Variant A: 11U Girls final_place = null
    const ttA = tournament_teams.map((t) => t.team_id === '507d7a4e-553e-4ba7-a61c-38d6cdf2f364' ? { ...t, final_place: null } : t);
    const { context: cA, slices: sA } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, tournament_teams: ttA }), now: NOW });
    const { content_sections: csA } = composeTournamentRecap(cA, sA[0], {});
    expect(csA.find((s) => s.kind === 'placement_block')).toBeUndefined();

    // Variant B: 8U Boys final_place set but wins/losses both 0
    const ttB = tournament_teams.map((t) => t.team_id === 'e6dde2e0-38f7-46c9-ad1a-5ac253a2a570' ? { ...t, final_record_wins: 0, final_record_losses: 0 } : t);
    const { context: cB, slices: sB } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, tournament_teams: ttB }), now: NOW });
    const { content_sections: csB } = composeTournamentRecap(cB, sB[2], {});
    const placement = csB.find((s) => s.kind === 'placement_block');
    expect(placement).toBeDefined();
    expect(placement.final_place).toBe('Finalists');
    expect(placement.record).toBeUndefined();
  });

  it('8. override sections render iff provided', async () => {
    const { context, slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const empty = composeTournamentRecap(context, slices[2], {});
    expect(empty.content_sections.find((s) => s.kind === 'standout_moments')).toBeUndefined();
    expect(empty.content_sections.find((s) => s.kind === 'coach_reflection')).toBeUndefined();
    const onlyStandout = composeTournamentRecap(context, slices[2], { standout_moments: 'good' });
    expect(onlyStandout.content_sections.find((s) => s.kind === 'standout_moments')).toBeDefined();
    expect(onlyStandout.content_sections.find((s) => s.kind === 'coach_reflection')).toBeUndefined();
  });
});
