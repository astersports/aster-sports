// Wave 4.2-A-3 snapshot test — tournament_prelim resolver pair output
// for ZG Rumble for the Ring CT (May 16-17, 2026), 3 participating
// teams (11U Girls, 10U Black, 8U Boys). Bare + with-overrides
// variants. Hand-authored expected fixtures lock the contract.

import { describe, expect, it } from 'vitest';
import { composeTournamentPrelim, resolveTournamentPrelim } from '../tournamentPrelim';
import { mockClient } from './mockSupabase';
import tournament from './fixtures/tournament_prelim_rumble_for_the_ring/tournament.json';
import tournament_teams from './fixtures/tournament_prelim_rumble_for_the_ring/tournament_teams.json';
import events from './fixtures/tournament_prelim_rumble_for_the_ring/events.json';
import locations from './fixtures/tournament_prelim_rumble_for_the_ring/locations.json';
import recipients from './fixtures/tournament_prelim_rumble_for_the_ring/recipients.json';
import coaches from './fixtures/tournament_prelim_rumble_for_the_ring/coaches.json';
import organization from './fixtures/tournament_prelim_rumble_for_the_ring/organization.json';
import expectedBare from './fixtures/tournament_prelim_rumble_for_the_ring/expected_content_sections_bare.json';
import expectedWithOverrides from './fixtures/tournament_prelim_rumble_for_the_ring/expected_content_sections_with_overrides.json';

// recipients.json is a flat per-team list; transform to RPC shape
// (each guardian's team_ids array). Same guardian on multiple teams
// gets multiple team_ids.
function recipientsToRpcShape(rows) {
  const m = new Map();
  for (const r of rows) {
    if (!m.has(r.guardian_id)) m.set(r.guardian_id, { guardian_id: r.guardian_id, email: r.email, full_name: '', is_pilot_family: r.is_pilot_family, team_ids: [], team_names: [] });
    m.get(r.guardian_id).team_ids.push(r.team_id);
  }
  return Array.from(m.values());
}

function buildPlayerGuardians(rows) {
  const out = [];
  const seen = new Set();
  for (const r of rows) {
    for (const fn of r.kid_first_names) {
      const key = `${r.guardian_id}|${fn}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ guardian_id: r.guardian_id, first_name: fn });
    }
  }
  return out;
}

const TID = '196e595d-6b35-4b5e-8253-502b122cb5cb';
const NOW = new Date('2026-05-10T14:00:00Z');
const FIXTURES = {
  tournament, tournament_teams, events, locations, coaches, organization,
  recipients: recipientsToRpcShape(recipients),
  player_guardians: buildPlayerGuardians(recipients),
};
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('tournament_prelim resolver — snapshot vs hand-authored expected', () => {
  it('slices ordered sort_order ASC: 11U Girls, 10U Black, 8U Boys', async () => {
    const { slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(slices.length).toBe(3);
    expect(slices[0].team_name).toBe('11U Girls');
    expect(slices[0].team_color).toBe('#a78bfa');
    expect(slices[0].sort_order).toBe(1);
    expect(slices[0].recipient_guardians.length).toBe(22);
    expect(slices[0].recipient_guardians[0].guardian_id).toBe('077e7660-3aba-4699-bcb6-ef9682fc9b67');
    expect(slices[0].recipient_guardians[0].email).toBe('junhata7700@hotmail.com');
    expect(slices[1].team_name).toBe('10U Black');
    expect(slices[2].team_name).toBe('8U Boys');
  });

  it('compose for slices[0] (11U Girls) bare matches expected', async () => {
    const { context, slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const { subject, content_sections } = composeTournamentPrelim(context, slices[0], {});
    expect(subject).toBe('11U Girls — ZG Rumble for the Ring CT Weekend');
    expect(norm(content_sections)).toEqual(expectedBare);
  });

  it('compose with survival_guide + coach_keys overrides renders those sections', async () => {
    const { context, slices } = await resolveTournamentPrelim({ tournamentId: TID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const overrides = { survival_guide: 'Hydrate. Bring extra layers.', coach_keys: 'Defense first.' };
    const { content_sections } = composeTournamentPrelim(context, slices[0], overrides);
    expect(norm(content_sections)).toEqual(expectedWithOverrides);
  });
});
