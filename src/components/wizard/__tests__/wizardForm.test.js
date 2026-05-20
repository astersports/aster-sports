// buildSaveDiff — regression coverage for the opponent path.
// Frank 2026-05-20: 11U Girls championship game updated TBD →
// PHD-McCurdy; Notify families threw NoActualScheduleChangeError
// because opponent wasn't tracked in before/after.

import { describe, expect, it } from 'vitest';
import { buildSaveDiff } from '../wizardForm';

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
});
