// Wave 4.2-A-5 snapshot test — schedule_change resolver pair output
// for event 7c7cc15a (11U Girls Skills Lab, end_at extended 30 min).
// Locks the bug fix: production audit row had timezone-string drift
// (+00:00 vs Z) that the legacy compose treated as differences,
// emitting "moved from 7:35 PM to 7:35 PM" gibberish.

import { describe, expect, it } from 'vitest';
import { composeScheduleChange, resolveScheduleChange } from '../scheduleChange';
import { mockClient } from './mockSupabase';
import event from './fixtures/schedule_change_skills_lab/event.json';
import event_change_audit from './fixtures/schedule_change_skills_lab/event_change_audit.json';
import location from './fixtures/schedule_change_skills_lab/location.json';
import recipients from './fixtures/schedule_change_skills_lab/recipients.json';
import coaches from './fixtures/schedule_change_skills_lab/coaches.json';
import organization from './fixtures/schedule_change_skills_lab/organization.json';
import expectedContentSections from './fixtures/schedule_change_skills_lab/expected_content_sections.json';

function recipientsToRpcShape(rows) {
  return rows.map((r) => ({ guardian_id: r.guardian_id, email: r.email, full_name: '', is_pilot_family: r.is_pilot_family, team_ids: [r.team_id], team_names: [] }));
}

function buildPlayerGuardians(rows) {
  const out = []; const seen = new Set();
  for (const r of rows) for (const fn of r.kid_first_names) {
    const k = `${r.guardian_id}|${fn}`; if (seen.has(k)) continue; seen.add(k);
    out.push({ guardian_id: r.guardian_id, first_name: fn });
  }
  return out;
}

const EVENT_ID = '7c7cc15a-7fa8-47f9-8f7e-b68c6bfaa6c8';
const NOW = new Date('2026-05-09T15:08:51Z');
const FIXTURES = {
  event, event_change_audit, location, coaches, organization,
  recipients: recipientsToRpcShape(recipients),
  player_guardians: buildPlayerGuardians(recipients),
};
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('schedule_change resolver — snapshot vs hand-authored expected', () => {
  it('compose for slices[0] matches hand-authored expected (corrects production bug)', async () => {
    const { context, slices } = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(slices.length).toBe(22);
    expect(slices[0].guardian_id).toBe('077e7660-3aba-4699-bcb6-ef9682fc9b67');
    expect(slices[0].email).toBe('junhata7700@hotmail.com');
    expect(slices[0].team_id).toBe('507d7a4e-553e-4ba7-a61c-38d6cdf2f364');
    expect(context.diff.changed_fields).toEqual(['end_at']);
    const { subject, content_sections } = composeScheduleChange(context, slices[0], {});
    expect(subject).toBe('Schedule update — 11U Girls Skills Lab');
    expect(norm(content_sections)).toEqual(expectedContentSections);
  });
});
