// Wave 4.2-A-1 snapshot test — locks behavior parity against
// production weekly_digest row 3b431eb1-3a1f-4fe0-bdb7-42e8f105ceb9
// (May 11-17 digest, sent 2026-05-09 14:13:44 UTC, test send to
// admin@ with sample = lowest guardian_id pilot family).
//
// Sample family: Stephanie Samaritano (guardian
// 8de4a7b8-d795-4179-a66e-476d947b642a), kids Charlie (11U Girls) +
// Milo (8U Boys). Pilot mode was on.

import { describe, expect, it } from 'vitest';
import { composeWeeklyDigest, resolveWeeklyDigest } from '../weeklyDigest';
import { mockClient } from './mockSupabase';
import events from './fixtures/weekly_digest_may_11_17/events.json';
import tournaments from './fixtures/weekly_digest_may_11_17/tournaments.json';
import event_rsvps from './fixtures/weekly_digest_may_11_17/event_rsvps.json';
import recipients from './fixtures/weekly_digest_may_11_17/recipients.json';
import coaches from './fixtures/weekly_digest_may_11_17/coaches.json';
import team_staff from './fixtures/weekly_digest_may_11_17/team_staff.json';
import organization from './fixtures/weekly_digest_may_11_17/organization.json';
import player_guardians from './fixtures/weekly_digest_may_11_17/player_guardians.json';
import expectedContentSections from './fixtures/weekly_digest_may_11_17/expected_content_sections.json';

const ORG_ID = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
const PERIOD = { start: new Date('2026-05-11T04:00:00Z'), end: new Date('2026-05-17T04:00:00Z') };
const NOW = new Date('2026-05-09T14:13:44Z');
const FIXTURES = { events, tournaments, event_rsvps, recipients, coaches, team_staff, organization, player_guardians };

describe('weekly_digest resolver — snapshot vs production row 3b431eb1', () => {
  it('slices[0] is Stephanie Samaritano (lowest guardian_id under ASC ordering)', async () => {
    const { slices } = await resolveWeeklyDigest(
      { orgId: ORG_ID, period: PERIOD, pilotOnly: true },
      { supabase: mockClient(FIXTURES), now: NOW },
    );
    expect(slices).toHaveLength(2);
    expect(slices[0].guardian_id).toBe('8de4a7b8-d795-4179-a66e-476d947b642a');
    expect(slices[0].email).toBe('cocosamaritano@gmail.com');
    expect(slices[0].kid_first_names).toEqual(['Charlie', 'Milo']);
    expect(slices[0].team_ids.length).toBe(2);
  });

  it('compose for slices[0] reproduces production row 3b431eb1 content_sections', async () => {
    const { context, slices } = await resolveWeeklyDigest(
      { orgId: ORG_ID, period: PERIOD, pilotOnly: true },
      { supabase: mockClient(FIXTURES), now: NOW },
    );
    const { subject, content_sections } = composeWeeklyDigest(context, slices[0]);
    expect(subject).toBe('Week ahead: May 11–17');
    // Normalize: tests serialize through JSON so Map -> object equivalence works
    const normalize = (v) => JSON.parse(JSON.stringify(v));
    expect(normalize(content_sections)).toEqual(expectedContentSections);
  });
});
