// Wave 4.2-A-6 snapshot test — rsvpNudge resolver pair output for
// event 2cf635fb (10U Black Skills Lab, Monday May 11 7:35 PM,
// 21 unresponded families). Lowest guardian_id 07ec4308 (medelman83,
// kid Hudson). Forward-looking snapshot — no production rsvp_nudge
// has ever been sent.

import { describe, expect, it } from 'vitest';
import { composeRsvpNudge, resolveRsvpNudge } from '../rsvpNudge';
import { mockClient } from './mockSupabase';
import event from './fixtures/rsvp_nudge_10u_black_skills_lab/event.json';
import location from './fixtures/rsvp_nudge_10u_black_skills_lab/location.json';
import team_players from './fixtures/rsvp_nudge_10u_black_skills_lab/team_players.json';
import event_rsvps from './fixtures/rsvp_nudge_10u_black_skills_lab/event_rsvps.json';
import player_guardians from './fixtures/rsvp_nudge_10u_black_skills_lab/player_guardians.json';
import coaches from './fixtures/rsvp_nudge_10u_black_skills_lab/coaches.json';
import organization from './fixtures/rsvp_nudge_10u_black_skills_lab/organization.json';
import expectedContentSections from './fixtures/rsvp_nudge_10u_black_skills_lab/expected_content_sections.json';

const EVENT_ID = '2cf635fb-f1e5-4184-b21d-7e2f049a39e6';
const NOW = new Date('2026-05-10T14:00:00Z');
const FIXTURES = { event, location, team_players, event_rsvps, player_guardians, coaches, organization };
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('rsvp_nudge resolver — snapshot vs hand-authored expected', () => {
  it('compose for slices[0] matches hand-authored expected', async () => {
    const { context, slices } = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(slices.length).toBe(21);
    expect(slices[0].guardian_id).toBe('07ec4308-e3ab-4d13-be5e-a5796f506ce3');
    expect(slices[0].email).toBe('medelman83@me.com');
    expect(slices[0].team_id).toBe('6abb0447-8866-461c-bd78-1c58eebf9551');
    expect(slices[0].unresponded_kids).toHaveLength(1);
    expect(slices[0].unresponded_kids[0].first_name).toBe('Hudson');
    expect(slices[0].unresponded_kids[0].player_id).toBeTruthy();
    expect(context.urgency.day_label).toBe('Tomorrow (Monday)');
    expect(context.urgency.time_label).toBe('7:35 PM');
    expect(context.rsvp_summary).toEqual({ total_roster: 11, responded_count: 0, unresponded_count: 11 });
    const { subject, content_sections } = composeRsvpNudge(context, slices[0], {});
    expect(subject).toBe('RSVP needed for Hudson: 10U Black Skills Lab');
    expect(norm(content_sections)).toEqual(expectedContentSections);
  });
});
