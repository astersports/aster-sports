// L99 Q3 sub helper test. Parents see Location auto-expanded only when
// (a) role is parent, (b) we're inside the game-day window, (c) a kid
// of theirs on the event's team has RSVP'd Going.

import { describe, expect, it } from 'vitest';
import { shouldAutoExpandLocation } from '../eventWindows';

const TEAM_ID = 't-1';
const startInHours = (h) => new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
const baseEvent = (h) => ({ start_at: startInHours(h) });
const KID = { playerId: 'p-1', teamIds: ['t-1'] };
const myChildren = [KID];
const rsvpGoing = [{ player_id: 'p-1', response: 'going' }];
const rsvpMaybe = [{ player_id: 'p-1', response: 'maybe' }];

describe('shouldAutoExpandLocation', () => {
  it('parent + within window + kid Going → true', () => {
    expect(shouldAutoExpandLocation({ role: 'parent', event: baseEvent(2), nowMs: Date.now(), teamId: TEAM_ID, myChildren, rsvps: rsvpGoing })).toBe(true);
  });

  it('parent + kid Maybe → false (not Going)', () => {
    expect(shouldAutoExpandLocation({ role: 'parent', event: baseEvent(2), nowMs: Date.now(), teamId: TEAM_ID, myChildren, rsvps: rsvpMaybe })).toBe(false);
  });

  it('parent + outside game-day window (>4h before) → false', () => {
    expect(shouldAutoExpandLocation({ role: 'parent', event: baseEvent(8), nowMs: Date.now(), teamId: TEAM_ID, myChildren, rsvps: rsvpGoing })).toBe(false);
  });

  it('parent + past game-day window (>3h after) → false', () => {
    expect(shouldAutoExpandLocation({ role: 'parent', event: baseEvent(-5), nowMs: Date.now(), teamId: TEAM_ID, myChildren, rsvps: rsvpGoing })).toBe(false);
  });

  it('admin/coach role → false even if other conditions met', () => {
    expect(shouldAutoExpandLocation({ role: 'admin', event: baseEvent(2), nowMs: Date.now(), teamId: TEAM_ID, myChildren, rsvps: rsvpGoing })).toBe(false);
    expect(shouldAutoExpandLocation({ role: 'coach', event: baseEvent(2), nowMs: Date.now(), teamId: TEAM_ID, myChildren, rsvps: rsvpGoing })).toBe(false);
  });

  it('parent + no kids on team → false', () => {
    expect(shouldAutoExpandLocation({ role: 'parent', event: baseEvent(2), nowMs: Date.now(), teamId: 'other-team', myChildren, rsvps: rsvpGoing })).toBe(false);
  });
});
