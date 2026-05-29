import { describe, expect, it } from 'vitest';
import { composeChangeAlert, isUrgentChange, URGENT_CHANGES } from '../eventChangeAlerts.js';

// change_summary shapes mirror what the migration-027 triggers stamp
// (verified against production trg_event_* function bodies, 2026-05-29).
const cancelled = { change_summary: { change: 'event_cancelled', title: '10U Black vs Riverside', start_at: '2026-05-30T18:30:00Z', reason: 'Gym flooded' } };
const rescheduled = { change_summary: { change: 'rescheduled', title: '9U Boys Practice', old_start_at: '2026-05-30T22:00:00Z', new_start_at: '2026-05-31T22:00:00Z' } };
const relocated = { change_summary: { change: 'relocated', title: '11U Girls vs THE COURT', start_at: '2026-05-30T20:40:00Z', old_location: 'WCC', new_location: 'Wheaton College' } };
const added = { change_summary: { change: 'event_added', title: 'New tournament game', start_at: '2026-05-30T18:30:00Z' } };
const mention = { change_summary: { change: 'coach_message', preview: 'Bring water' } };

describe('isUrgentChange', () => {
  it('classifies the 3 urgent change types and excludes in_app-only ones', () => {
    expect(isUrgentChange(cancelled)).toBe(true);
    expect(isUrgentChange(rescheduled)).toBe(true);
    expect(isUrgentChange(relocated)).toBe(true);
    expect(isUrgentChange(added)).toBe(false);
    expect(isUrgentChange(mention)).toBe(false);
  });

  it('the urgent set matches the trigger p_urgent=true rows exactly', () => {
    expect(URGENT_CHANGES).toEqual(['event_cancelled', 'rescheduled', 'relocated']);
  });

  it('is null-safe on a row with no change_summary', () => {
    expect(isUrgentChange({})).toBe(false);
    expect(isUrgentChange(null)).toBe(false);
  });
});

describe('composeChangeAlert', () => {
  it('cancellation: headline + ET time + reason', () => {
    const c = composeChangeAlert(cancelled);
    expect(c.title).toBe('Cancelled: 10U Black vs Riverside');
    expect(c.pushBody).toContain('Sat, May 30 · 2:30 PM');
    expect(c.pushBody).toContain('this event has been cancelled.');
    expect(c.pushBody).toContain('Reason: Gym flooded');
    expect(c.html).toContain('Cancelled: 10U Black vs Riverside');
  });

  it('reschedule: shows new time with old in parens, ET-pinned', () => {
    const c = composeChangeAlert(rescheduled);
    expect(c.title).toBe('New time: 9U Boys Practice');
    expect(c.pushBody).toBe('Moved to Sun, May 31 · 6:00 PM (was Sat, May 30 · 6:00 PM).');
  });

  it('relocation: shows new location with old in parens', () => {
    const c = composeChangeAlert(relocated);
    expect(c.title).toBe('New location: 11U Girls vs THE COURT');
    expect(c.pushBody).toContain('now at Wheaton College (was WCC).');
  });

  it('is pure: same input -> deeply-equal output', () => {
    expect(composeChangeAlert(cancelled)).toEqual(composeChangeAlert(cancelled));
  });

  it('falls back gracefully on missing title / unknown change', () => {
    const c = composeChangeAlert({ change_summary: { change: 'mystery' } });
    expect(c.title).toBe('Update: Your event');
  });

  it('cancellation without a reason omits the Reason clause', () => {
    const c = composeChangeAlert({ change_summary: { change: 'event_cancelled', title: 'Game', start_at: '2026-05-30T18:30:00Z' } });
    expect(c.pushBody).not.toContain('Reason:');
  });
});
