// Wave 4.2-A-7 snapshot test — academy_callup_notice resolver pair.
// Synthetic anchor: Jake Perkiel (futures_academy on 10U Black) called
// up to 10U Blue Practice on Tuesday May 12. 2 guardians; lowest is
// 0896bcd1 (rissa.perkiel). Cross-team callup case.

import { describe, expect, it } from 'vitest';
import { composeAcademyCallupNotice, resolveAcademyCallupNotice } from '../academyCallupNotice';
import { mockClient } from './mockSupabase';
import event from './fixtures/academy_callup_jake_perkiel/event.json';
import player from './fixtures/academy_callup_jake_perkiel/player.json';
import team_players from './fixtures/academy_callup_jake_perkiel/team_players.json';
import player_guardians from './fixtures/academy_callup_jake_perkiel/player_guardians.json';
import location from './fixtures/academy_callup_jake_perkiel/location.json';
import coaches from './fixtures/academy_callup_jake_perkiel/coaches.json';
import organization from './fixtures/academy_callup_jake_perkiel/organization.json';
import expectedContentSections from './fixtures/academy_callup_jake_perkiel/expected_content_sections.json';

const EVENT_ID = '0dd75745-a540-44d9-b16a-9cf0ac1ac819';
const PLAYER_ID = '4e361e9b-4cfa-46b7-bae8-48552f9841e0';
const NOW = new Date('2026-05-10T14:00:00Z');
const FIXTURES = { event, player, team_players, player_guardians, location, coaches, organization };
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('academy_callup_notice resolver — snapshot vs hand-authored expected', () => {
  it('compose for slices[0] matches hand-authored expected output (cross-team callup)', async () => {
    const { context, slices } = await resolveAcademyCallupNotice(
      { eventId: EVENT_ID, playerId: PLAYER_ID, pilotOnly: false },
      { supabase: mockClient(FIXTURES), now: NOW },
    );
    expect(slices.length).toBe(2);
    expect(slices[0].guardian_id).toBe('0896bcd1-4b11-4ccc-a9ce-f03c29eb1d03');
    expect(slices[0].email).toBe('rissa.perkiel@gmail.com');
    expect(slices[0].kid_first_name).toBe('Jake');
    expect(slices[0].player_id).toBe(PLAYER_ID);
    expect(slices[0].team_id).toBe('13abc98d-5e88-4fe0-8929-690add6e2bdd');
    expect(context.urgency.day_label).toBe('Tuesday');
    expect(context.response.hours_to_respond).toBeCloseTo(2, 1);
    const { subject, content_sections } = composeAcademyCallupNotice(context, slices[0], {});
    expect(subject).toBe('Call-up: Jake for 10U Blue Practice');
    expect(norm(content_sections)).toEqual(expectedContentSections);
  });
});
