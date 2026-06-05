// Wave 4.2-A-5 contract tests for scheduleChange resolver pair.

import { describe, expect, it } from 'vitest';
import {
  composeScheduleChange, NoActualScheduleChangeError, NoScheduleChangeError,
  resolveScheduleChange,
} from '../scheduleChange';
import { mockClient } from './mockSupabase';
import event from './fixtures/schedule_change_skills_lab/event.json';
import event_change_audit from './fixtures/schedule_change_skills_lab/event_change_audit.json';
import location from './fixtures/schedule_change_skills_lab/location.json';
import recipients from './fixtures/schedule_change_skills_lab/recipients.json';
import coaches from './fixtures/schedule_change_skills_lab/coaches.json';
import organization from './fixtures/schedule_change_skills_lab/organization.json';

function rcps(rows) { return rows.map((r) => ({ guardian_id: r.guardian_id, email: r.email, full_name: '', is_pilot_family: r.is_pilot_family, team_ids: [r.team_id], team_names: [] })); }
function pgs(rows) { const out = []; const seen = new Set(); for (const r of rows) for (const fn of r.kid_first_names) { const k = `${r.guardian_id}|${fn}`; if (seen.has(k)) continue; seen.add(k); out.push({ guardian_id: r.guardian_id, first_name: fn }); } return out; }

const EVENT_ID = '7c7cc15a-7fa8-47f9-8f7e-b68c6bfaa6c8';
const NOW = new Date('2026-05-09T15:08:51Z');
const FIXTURES = { event, event_change_audit, location, coaches, organization, recipients: rcps(recipients), player_guardians: pgs(recipients) };
const norm = (v) => JSON.parse(JSON.stringify(v));

describe('schedule_change resolver — contract', () => {
  it('1. resolver pure', async () => {
    const a = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const b = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    expect(norm(a)).toEqual(norm(b));
  });

  it('2. compose pure', async () => {
    const { context, slices } = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const a = composeScheduleChange(context, slices[0], { coach_note: 'gym double-booked' });
    const b = composeScheduleChange(context, slices[0], { coach_note: 'gym double-booked' });
    expect(norm(a)).toEqual(norm(b));
  });

  it('3. slice ordering: guardian_id ASC, stable under permutation', async () => {
    const reversed = { ...FIXTURES, recipients: rcps([...recipients].reverse()) };
    const { slices } = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(reversed), now: NOW });
    const ids = slices.map((s) => s.guardian_id);
    expect(ids).toEqual([...ids].sort());
  });

  it('4. pilotOnly empty slices when no pilot guardians', async () => {
    const noPilots = recipients.map((r) => ({ ...r, is_pilot_family: false }));
    const { slices } = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: true }, { supabase: mockClient({ ...FIXTURES, recipients: rcps(noPilots) }), now: NOW });
    expect(slices).toEqual([]);
  });

  it('5. no audit row -> NoScheduleChangeError on compose', async () => {
    const { context, slices } = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event_change_audit: [] }), now: NOW });
    expect(context.audit).toBeNull();
    expect(() => composeScheduleChange(context, slices[0], {})).toThrow(NoScheduleChangeError);
  });

  it('6. no actual change (timezone-string false positive) -> NoActualScheduleChangeError [BUG REGRESSION LOCK]', async () => {
    const audit = [{ ...event_change_audit[0], before_jsonb: { start_at: '2026-05-11T23:35:00+00:00', end_at: '2026-05-12T01:05:00+00:00', location: "St. Patrick's" }, after_jsonb: { start_at: '2026-05-11T23:35:00.000Z', end_at: '2026-05-12T01:05:00.000Z', location: "St. Patrick's" } }];
    const { context, slices } = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event_change_audit: audit }), now: NOW });
    expect(context.diff.changed_fields).toEqual([]);
    expect(() => composeScheduleChange(context, slices[0], {})).toThrow(NoActualScheduleChangeError);
  });

  it('7. time-only change (production anchor): end_at-only narrative + diff', async () => {
    const { context, slices } = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient(FIXTURES), now: NOW });
    const { content_sections } = composeScheduleChange(context, slices[0], {});
    const narrative = content_sections.find((s) => s.kind === 'stats_narrative');
    expect(narrative.body).toBe('Practice on Monday, May 11 now ends at 9:05 PM instead of 8:35 PM.');
    const diff = content_sections.find((s) => s.kind === 'schedule_change_diff');
    expect(diff.changed_fields).toEqual(['end_at']);
  });

  it('8. location-only change: venue narrative + diff', async () => {
    const audit = [{ ...event_change_audit[0], change_kind: 'location', before_jsonb: { start_at: '2026-05-11T23:35:00+00:00', end_at: '2026-05-12T01:05:00+00:00', location: "St. Patrick's" }, after_jsonb: { start_at: '2026-05-11T23:35:00+00:00', end_at: '2026-05-12T01:05:00+00:00', location: 'Westchester County Center' } }];
    const { context, slices } = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event_change_audit: audit }), now: NOW });
    expect(context.diff.changed_fields).toEqual(['location']);
    const { content_sections } = composeScheduleChange(context, slices[0], {});
    const narrative = content_sections.find((s) => s.kind === 'stats_narrative');
    expect(narrative.body).toContain('Venue has changed from');
    expect(narrative.body).toContain('Westchester County Center');
    expect(content_sections.find((s) => s.kind === 'schedule_change_diff').changed_fields).toEqual(['location']);
  });

  it('9. cancellation: CANCELLED headline + Cancelled subject + PR-D cancellation_card, no diff/narrative', async () => {
    const audit = [{ ...event_change_audit[0], change_kind: 'cancelled', before_jsonb: { status: 'scheduled' }, after_jsonb: { status: 'cancelled', cancellation_reason: 'Gym closed' } }];
    const { context, slices } = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event_change_audit: audit }), now: NOW });
    const { subject, content_sections } = composeScheduleChange(context, slices[0], {});
    expect(subject).toBe('Cancelled: 11U Girls Skills Lab');
    const header = content_sections.find((s) => s.kind === 'header');
    expect(header.headline).toBe('CANCELLED');
    expect(content_sections.find((s) => s.kind === 'schedule_change_diff')).toBeUndefined();
    // PR-D: cancellation emits a cancellation_card (warn-tone, no actions) in
    // place of the free-text narrative line.
    expect(content_sections.find((s) => s.kind === 'stats_narrative')).toBeUndefined();
    const card = content_sections.find((s) => s.kind === 'cancellation_card');
    expect(card).toBeTruthy();
    expect(card.title).toBe('11U Girls Skills Lab');
    expect(card.reason).toContain('cancelled');
  });

  it('9b. cancellation_card uses overrides.cancellation_reason verbatim when provided', async () => {
    const audit = [{ ...event_change_audit[0], change_kind: 'cancelled', before_jsonb: { status: 'scheduled', start_at: '2026-05-11T23:35:00+00:00', end_at: '2026-05-12T01:05:00+00:00' }, after_jsonb: { status: 'cancelled' } }];
    const { context, slices } = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event_change_audit: audit }), now: NOW });
    const { content_sections } = composeScheduleChange(context, slices[0], { cancellation_reason: 'Sportsplex double-booked. Back to normal Thursday.' });
    const card = content_sections.find((s) => s.kind === 'cancellation_card');
    expect(card.reason).toBe('Sportsplex double-booked. Back to normal Thursday.');
    expect(card.old_time).toBeTruthy();
  });

  it('10a. opponent-only change: opponent narrative + diff (Frank 11U Girls championship, 2026-05-20)', async () => {
    const audit = [{ ...event_change_audit[0], change_kind: 'other', before_jsonb: { start_at: '2026-05-11T23:35:00+00:00', end_at: '2026-05-12T01:05:00+00:00', location: "St. Patrick's", opponent: null }, after_jsonb: { start_at: '2026-05-11T23:35:00+00:00', end_at: '2026-05-12T01:05:00+00:00', location: "St. Patrick's", opponent: 'PHD - McCurdy' } }];
    const { context, slices } = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event_change_audit: audit }), now: NOW });
    expect(context.diff.changed_fields).toEqual(['opponent']);
    const { content_sections } = composeScheduleChange(context, slices[0], {});
    const narrative = content_sections.find((s) => s.kind === 'stats_narrative');
    expect(narrative.body).toContain('Opponent has changed from');
    expect(narrative.body).toContain('PHD - McCurdy');
    const diff = content_sections.find((s) => s.kind === 'schedule_change_diff');
    expect(diff.changed_fields).toEqual(['opponent']);
    expect(diff.after.opponent).toBe('PHD - McCurdy');
    expect(diff.before.opponent).toBeNull();
  });

  it('10. recurrence_scope=series: narrative prepended with "All future {team} {type}s: "', async () => {
    const audit = [{ ...event_change_audit[0], recurrence_scope: 'series' }];
    const { context, slices } = await resolveScheduleChange({ eventId: EVENT_ID, pilotOnly: false }, { supabase: mockClient({ ...FIXTURES, event_change_audit: audit }), now: NOW });
    const { content_sections } = composeScheduleChange(context, slices[0], {});
    const narrative = content_sections.find((s) => s.kind === 'stats_narrative');
    expect(narrative.body.startsWith('All future 11U Girls practices: ')).toBe(true);
  });
});
