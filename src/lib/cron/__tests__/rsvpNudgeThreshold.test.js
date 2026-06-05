import { describe, expect, it } from 'vitest';
import {
  RSVP_MIN_GOING_DEFAULT,
  rsvpMinGoingThreshold,
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
