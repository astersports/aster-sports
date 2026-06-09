// Wave 4.2-A-6 contract tests for rsvpNudge resolver pair.

import { describe, expect, it } from 'vitest';
import {
  composeRsvpNudge, EventAlreadyStartedError,
  EventHasNoTeamError, resolveRsvpNudge,
} from '../rsvpNudge';
import { mockClient } from './mockSupabase';
import event from './fixtures/rsvp_nudge_10u_black_skills_lab/event.json';
import location from './fixtures/rsvp_nudge_10u_black_skills_lab/location.json';
import team_players from './fixtures/rsvp_nudge_10u_black_skills_lab/team_players.json';
import event_rsvps from './fixtures/rsvp_nudge_10u_black_skills_lab/event_rsvps.json';
import player_guardians from './fixtures/rsvp_nudge_10u_black_skills_lab/player_guardians.json';
import coaches from './fixtures/rsvp_nudge_10u_black_skills_lab/coaches.json';
import organization from './fixtures/rsvp_nudge_10u_black_skills_lab/organization.json';

const EVENT_ID = '2cf635fb-f1e5-4184-b21d-7e2f049a39e6';
const NOW = new Date('2026-05-10T14:00:00Z');
const FIXTURES = { event, location, team_players, event_rsvps, player_guardians, coaches, organization };
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('rsvp_nudge resolver — contract', () => {
  it('1. resolver pure', async () => {
    const a = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const b = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(norm(a)).toEqual(norm(b));
  });

  it('2. compose pure', async () => {
    const { context, slices } = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const o = { coach_note: 'gym closed' };
    const a = composeRsvpNudge(context, slices[0], o);
    const b = composeRsvpNudge(context, slices[0], o);
    expect(norm(a)).toEqual(norm(b));
  });

  it('3. slice ordering: guardian_id ASC, unresponded_kids ASC by first_name within slice', async () => {
    const reversed = { ...FIXTURES, player_guardians: [...player_guardians].reverse() };
    const { slices } = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(reversed), now: NOW });
    const ids = slices.map((s) => s.guardian_id);
    expect(ids).toEqual([...ids].sort());
    for (const s of slices) {
      const names = s.unresponded_kids.map((k) => k.first_name);
      expect(names).toEqual([...names].sort());
    }
  });

  it('4. pilot mode filter: only pilot guardians when pilotOnly=true', async () => {
    const withPilot = player_guardians.map((r) => r.guardian_id === '07ec4308-e3ab-4d13-be5e-a5796f506ce3' ? { ...r, guardians: { ...r.guardians, is_pilot_family: true } } : r);
    // D-5(a) — pilot gate now goes through get_digest_recipients RPC; mock
    // fixtures.recipients must include the pilot guardian for the test to
    // simulate the post-cutover allowlist behavior.
    const recipients = [{ guardian_id: '07ec4308-e3ab-4d13-be5e-a5796f506ce3', email: 'medelman83@me.com', is_pilot_family: true, team_ids: [] }];
    const { slices } = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: true }, { supabase: mockClient({ ...FIXTURES, player_guardians: withPilot, recipients }), now: NOW });
    expect(slices.length).toBe(1);
    expect(slices[0].guardian_id).toBe('07ec4308-e3ab-4d13-be5e-a5796f506ce3');
  });

  it('5. pilot empty when no pilots: production fixture pilotOnly=true -> []', async () => {
    const { slices } = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: true }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(slices).toEqual([]);
  });

  it('5b. REDIRECT mode (synthetic rows): pilotOnly=true builds real slices, not [] (no "No recipients" bug)', async () => {
    // Pre-cutover pilot REDIRECT: get_digest_recipients returns synthetic
    // per-team rows (guardian_id null, email=pilot_test_recipient_email) and
    // NO real-guardian rows. The per-player kind must NOT drop to empty (that
    // was the "No recipients for this anchor" bug) — it builds the real slices
    // so a TEST send can deliver the sample to the pilot inbox.
    const redirectRecipients = [{ guardian_id: null, email: 'olivejuiceinc1@gmail.com', is_pilot_family: true, team_ids: [] }];
    const open = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const redirect = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: true }, { supabase: mockClient({ ...FIXTURES, recipients: redirectRecipients }), now: NOW });
    expect(open.slices.length).toBeGreaterThan(0);
    expect(redirect.slices.length).toBe(open.slices.length);
  });

  it('6. all responded -> empty slices', async () => {
    const allResponded = team_players.map((tp) => ({ event_id: EVENT_ID, player_id: tp.player_id, response: 'going' }));
    const { slices, context } = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event_rsvps: allResponded }), now: NOW });
    expect(slices).toEqual([]);
    expect(context.rsvp_summary.unresponded_count).toBe(0);
  });

  it('7. some responded -> partial slices (Hudson responded, his guardians excluded)', async () => {
    const someResponded = [{ event_id: EVENT_ID, player_id: '36c54719-e610-46c2-a778-72efc7ccdbb1', response: 'going' }];
    const { slices } = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event_rsvps: someResponded }), now: NOW });
    expect(slices.length).toBe(19);
    expect(slices.find((s) => s.guardian_id === '07ec4308-e3ab-4d13-be5e-a5796f506ce3')).toBeUndefined();
    expect(slices.find((s) => s.guardian_id === 'f50e9714-cc9c-4c23-8042-db88731cc932')).toBeUndefined();
  });

  it('8. multi-kid same team: slice has both names; subject uses Oxford comma for 3+', async () => {
    const extraPg = [
      { guardian_id: '07ec4308-e3ab-4d13-be5e-a5796f506ce3', player_id: 'fa384908-7441-447d-b23a-eea152b37a59', players: { first_name: 'Aubtin' }, guardians: { id: '07ec4308-e3ab-4d13-be5e-a5796f506ce3', email: 'medelman83@me.com', is_pilot_family: false } },
      { guardian_id: '07ec4308-e3ab-4d13-be5e-a5796f506ce3', player_id: '1bdea839-6a57-42ab-9d78-a8a6436cf11b', players: { first_name: 'Frankie' }, guardians: { id: '07ec4308-e3ab-4d13-be5e-a5796f506ce3', email: 'medelman83@me.com', is_pilot_family: false } },
    ];
    const { context, slices } = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, player_guardians: [...player_guardians, ...extraPg] }), now: NOW });
    const target = slices.find((s) => s.guardian_id === '07ec4308-e3ab-4d13-be5e-a5796f506ce3');
    expect(target.unresponded_kids.map((k) => k.first_name)).toEqual(['Aubtin', 'Frankie', 'Hudson']);
    const { subject, content_sections } = composeRsvpNudge(context, target, {});
    expect(subject).toBe('RSVP needed for Aubtin, Frankie, and Hudson: 10U Black Skills Lab');
    const requestSections = content_sections.filter((s) => s.kind === 'rsvp_request');
    expect(requestSections).toHaveLength(3);
    expect(requestSections.map((s) => s.kid_first_name)).toEqual(['Aubtin', 'Frankie', 'Hudson']);
    expect(requestSections.every((s) => !!s.player_id)).toBe(true);
  });

  it('9. event has no team_id -> EventHasNoTeamError', async () => {
    const noTeam = { ...event, team_id: null, teams: null };
    await expect(resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event: noTeam }), now: NOW }))
      .rejects.toBeInstanceOf(EventHasNoTeamError);
  });

  it('10. event already started -> EventAlreadyStartedError', async () => {
    const after = new Date('2026-05-12T00:00:00Z');
    await expect(resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: after }))
      .rejects.toBeInstanceOf(EventAlreadyStartedError);
  });

  it('11. urgency formatter coverage: Today / Tomorrow (Weekday) / Weekday / Month Day', async () => {
    // Today: now ~30 min before event start (same NY date)
    const today = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: new Date('2026-05-11T23:00:00Z') });
    expect(today.context.urgency.day_label).toBe('Today');
    // Tomorrow (Monday): default fixture (now=2026-05-10 UTC, event=Mon May 11)
    const tomorrow = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(tomorrow.context.urgency.day_label).toBe('Tomorrow (Monday)');
    // Weekday only (3 days out): now=2026-05-08 UTC, event=Mon May 11
    const weekday = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: new Date('2026-05-08T14:00:00Z') });
    expect(weekday.context.urgency.day_label).toBe('Monday');
    // Month Day (8 days out): now=2026-05-03 UTC, event=Mon May 11
    const farOut = await resolveRsvpNudge({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: new Date('2026-05-03T14:00:00Z') });
    expect(farOut.context.urgency.day_label).toBe('May 11');
  });
});
