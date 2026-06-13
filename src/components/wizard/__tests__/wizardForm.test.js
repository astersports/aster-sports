// buildSaveDiff — regression coverage for the opponent path.
// Frank 2026-05-20: 11U Girls championship game updated TBD →
// PHD-McCurdy; Notify families threw NoActualScheduleChangeError
// because opponent wasn't tracked in before/after.

import { describe, expect, it } from 'vitest';
import { buildSaveDiff, EMPTY_FORM, eventToForm } from '../wizardForm';

const baseForm = {
  date: '2026-05-30', startTime: '08:00', endTime: '09:30',
  location: 'House of Sports', opponent: '',
};
const baseEvent = {
  id: 'evt-1', start_at: new Date('2026-05-30T08:00').toISOString(),
  end_at: new Date('2026-05-30T09:30').toISOString(),
  location: 'House of Sports', opponent: null,
};

describe('buildSaveDiff', () => {
  it('returns null when nothing notify-worthy changed', () => {
    expect(buildSaveDiff({ editEvent: baseEvent, form: baseForm, editMode: 'single' })).toBeNull();
  });

  it('opponent-only change returns diff with changeKind=other and opponent populated', () => {
    const form = { ...baseForm, opponent: 'PHD - McCurdy' };
    const diff = buildSaveDiff({ editEvent: baseEvent, form, editMode: 'single' });
    expect(diff).not.toBeNull();
    expect(diff.changeKind).toBe('other');
    expect(diff.before.opponent).toBeNull();
    expect(diff.after.opponent).toBe('PHD - McCurdy');
  });

  it('time-only change still returns changeKind=time (backward compat)', () => {
    const form = { ...baseForm, startTime: '09:00' };
    const diff = buildSaveDiff({ editEvent: baseEvent, form, editMode: 'single' });
    expect(diff.changeKind).toBe('time');
    expect(diff.before.opponent).toBeNull();
    expect(diff.after.opponent).toBeNull();
  });

  it('location-only change still returns changeKind=location (backward compat)', () => {
    const form = { ...baseForm, location: 'Westchester County Center' };
    const diff = buildSaveDiff({ editEvent: baseEvent, form, editMode: 'single' });
    expect(diff.changeKind).toBe('location');
  });

  it('opponent whitespace-only treated as null (no diff)', () => {
    const form = { ...baseForm, opponent: '   ' };
    expect(buildSaveDiff({ editEvent: baseEvent, form, editMode: 'single' })).toBeNull();
  });

  // F1 (events-wizard L99 audit 2026-06-13): a late-night edit crosses
  // midnight; without the +1-day bump the after.end_at landed ~24h before
  // after.start_at. Mirrors useCreateActivity.withTime.
  it('cross-midnight edit bumps after.end_at to the next day (end > start)', () => {
    const form = { ...baseForm, startTime: '22:00', endTime: '01:00' };
    const diff = buildSaveDiff({ editEvent: baseEvent, form, editMode: 'single' });
    expect(diff.changeKind).toBe('time');
    expect(new Date(diff.after.end_at).getTime()).toBeGreaterThan(new Date(diff.after.start_at).getTime());
  });
});

// 2026-06-13 locations audit: the wizard form carries the venue FK so
// events stop shipping text-only (name-search directions mis-resolved
// in Waze — ECS&F → Rippowam, operator-caught).
describe('wizard form — location_id FK', () => {
  it('EMPTY_FORM carries locationId (null)', () => {
    expect(EMPTY_FORM).toHaveProperty('locationId', null);
  });

  it('eventToForm maps event.location_id into the form', () => {
    const form = eventToForm({ ...baseEvent, event_type: 'game', location_id: 'loc-9' });
    expect(form.locationId).toBe('loc-9');
    expect(form.location).toBe('House of Sports');
  });

  it('eventToForm defaults locationId to null for legacy text-only events', () => {
    expect(eventToForm({ ...baseEvent, event_type: 'game' }).locationId).toBeNull();
  });
});
