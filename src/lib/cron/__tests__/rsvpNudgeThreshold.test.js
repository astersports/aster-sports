import { describe, expect, it } from 'vitest';
import {
  nudgeWindowEndIso,
  RSVP_MIN_GOING_DEFAULT,
  RSVP_NUDGE_WINDOW_HOURS,
  rsvpMinGoingThreshold,
  rsvpNudgesEnabled,
  shouldNudgeLowGoing,
} from '../rsvpNudgeThreshold.js';

// Stream B (§16.5) — "fewer than N confirmed going" floor, operator-locked
// 2026-06-05. Default 5. Replaces the prior <70% coverage model.

describe('rsvpMinGoingThreshold', () => {
  it('defaults to 5 when auto_notifications is unset / empty', () => {
    expect(RSVP_MIN_GOING_DEFAULT).toBe(5);
    expect(rsvpMinGoingThreshold(undefined)).toBe(5);
    expect(rsvpMinGoingThreshold(null)).toBe(5);
    expect(rsvpMinGoingThreshold({})).toBe(5);
    expect(rsvpMinGoingThreshold({ reminders_enabled: true })).toBe(5);
  });

  it('honors a per-org override', () => {
    expect(rsvpMinGoingThreshold({ rsvp_min_going: 3 })).toBe(3);
    expect(rsvpMinGoingThreshold({ rsvp_min_going: 8 })).toBe(8);
    expect(rsvpMinGoingThreshold({ rsvp_min_going: 1 })).toBe(1);
  });

  it('falls back to default on invalid (non-positive-integer) values', () => {
    expect(rsvpMinGoingThreshold({ rsvp_min_going: 0 })).toBe(5);
    expect(rsvpMinGoingThreshold({ rsvp_min_going: -2 })).toBe(5);
    expect(rsvpMinGoingThreshold({ rsvp_min_going: 4.5 })).toBe(5);
    expect(rsvpMinGoingThreshold({ rsvp_min_going: '5' })).toBe(5);
    expect(rsvpMinGoingThreshold({ rsvp_min_going: null })).toBe(5);
  });
});

// Stream B master switch (FORK A, 2026-06-09) — default OFF. Inverted from
// Stream A's default-ON reminders gate: a nudge stream needs explicit opt-in.
describe('rsvpNudgesEnabled (Stream B default-OFF gate)', () => {
  it('is OFF when auto_notifications is unset / empty / read-miss', () => {
    expect(rsvpNudgesEnabled(undefined)).toBe(false);
    expect(rsvpNudgesEnabled(null)).toBe(false);
    expect(rsvpNudgesEnabled({})).toBe(false);
  });

  it('is OFF for any non-true value (false, truthy non-boolean, only other keys set)', () => {
    expect(rsvpNudgesEnabled({ rsvp_nudges_enabled: false })).toBe(false);
    expect(rsvpNudgesEnabled({ rsvp_nudges_enabled: 'true' })).toBe(false);
    expect(rsvpNudgesEnabled({ rsvp_nudges_enabled: 1 })).toBe(false);
    expect(rsvpNudgesEnabled({ rsvp_min_going: 5, reminders_enabled: true })).toBe(false);
  });

  it('is ON only when explicitly enabled (=== true)', () => {
    expect(rsvpNudgesEnabled({ rsvp_nudges_enabled: true })).toBe(true);
  });
});

describe('shouldNudgeLowGoing', () => {
  it('nudges when going count is below the threshold (4 going, floor 5)', () => {
    expect(shouldNudgeLowGoing(4, 5)).toBe(true);
    expect(shouldNudgeLowGoing(0, 5)).toBe(true);
  });

  it('does NOT nudge when the floor is met (5 going, floor 5)', () => {
    expect(shouldNudgeLowGoing(5, 5)).toBe(false);
    expect(shouldNudgeLowGoing(6, 5)).toBe(false);
    expect(shouldNudgeLowGoing(12, 5)).toBe(false);
  });

  it('honors an org override threshold end-to-end', () => {
    const threshold = rsvpMinGoingThreshold({ rsvp_min_going: 3 });
    expect(shouldNudgeLowGoing(2, threshold)).toBe(true);
    expect(shouldNudgeLowGoing(3, threshold)).toBe(false);
  });
});

// Event-proximity window (§16.5) — operator-widened 2026-06-05 from 24h to 48h.
// nudgeWindowEndIso is the handler's `start_at <= windowEnd` upper bound; a game
// inside the window with a short roster drafts a nudge, a game beyond it does not.
describe('nudgeWindowEndIso (48h proximity window)', () => {
  const now = new Date('2026-06-05T12:00:00Z');
  // Replicates the handler gate: start_at > now AND start_at <= windowEnd.
  const inWindow = (startAt) => startAt > now && startAt <= new Date(nudgeWindowEndIso(now));

  it('is widened to 48h', () => {
    expect(RSVP_NUDGE_WINDOW_HOURS).toBe(48);
    expect(nudgeWindowEndIso(now)).toBe('2026-06-07T12:00:00.000Z');
  });

  it('a game 40h out (short roster, 4 going) is inside the window → drafts', () => {
    const game40h = new Date(now.getTime() + 40 * 3600000);
    expect(inWindow(game40h)).toBe(true);
    // 4 going against the default floor of 5 → nudge
    expect(shouldNudgeLowGoing(4, RSVP_MIN_GOING_DEFAULT)).toBe(true);
  });

  it('a game 60h out is beyond the window → does NOT draft', () => {
    const game60h = new Date(now.getTime() + 60 * 3600000);
    expect(inWindow(game60h)).toBe(false);
  });

  it('the 48h boundary is inclusive; just past it is excluded', () => {
    expect(inWindow(new Date(now.getTime() + 48 * 3600000))).toBe(true);
    expect(inWindow(new Date(now.getTime() + 48 * 3600000 + 1000))).toBe(false);
  });
});
