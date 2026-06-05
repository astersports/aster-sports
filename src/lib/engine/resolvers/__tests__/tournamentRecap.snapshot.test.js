// Wave 4.2-A-4 snapshot tests — tournament_recap resolver pair output
// for ZG Chase for the Chain NY (Apr 11-12, 2026), 13 events,
// 3 teams (11U Girls Champions, 10U Black Champions, 8U Boys Finalists).

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
import team_staff from './fixtures/tournament_recap_chase_for_the_chain/team_staff.json';
import organization from './fixtures/tournament_recap_chase_for_the_chain/organization.json';
import expected11uGirlsBare from './fixtures/tournament_recap_chase_for_the_chain/expected_content_sections_11u_girls_bare.json';
import expected8uBoysBare from './fixtures/tournament_recap_chase_for_the_chain/expected_content_sections_8u_boys_bare.json';
import expected8uBoysWithOverrides from './fixtures/tournament_recap_chase_for_the_chain/expected_content_sections_8u_boys_with_overrides.json';

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
  coaches, team_staff, organization,
  recipients: recipientsToRpcShape(recipients),
  player_guardians: buildPlayerGuardians(recipients),
};
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('tournament_recap resolver — snapshot', () => {
  it('11U Girls Champions, no overrides — bare snapshot', async () => {
    const { context, slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(slices.length).toBe(3);
    expect(slices[0].team_name).toBe('11U Girls');
    expect(slices[0].recipient_guardians.length).toBe(22);
    expect(slices[0].recipient_guardians[0].guardian_id).toBe('077e7660-3aba-4699-bcb6-ef9682fc9b67');
    const { subject, content_sections } = composeTournamentRecap(context, slices[0], {});
    expect(subject).toBe('11U Girls: ZG Chase for the Chain NY Recap');
    expect(norm(content_sections)).toEqual(expected11uGirlsBare);
  });

  it('8U Boys Finalists, rich game data, no overrides — bare snapshot', async () => {
    const { context, slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(slices[2].team_name).toBe('8U Boys');
    expect(slices[2].recipient_guardians.length).toBe(24);
    const { content_sections } = composeTournamentRecap(context, slices[2], {});
    expect(norm(content_sections)).toEqual(expected8uBoysBare);
  });

  it('8U Boys with overrides renders standout_moments + coach_reflection', async () => {
    const { context, slices } = await resolveTournamentRecap({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const overrides = { standout_moments: 'First win of the spring.', coach_reflection: 'We were right there in the final.' };
    const { content_sections } = composeTournamentRecap(context, slices[2], overrides);
    expect(norm(content_sections)).toEqual(expected8uBoysWithOverrides);
  });
});
