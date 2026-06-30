// @vitest-environment jsdom
//
// trackingStore — anon localStorage "tracked teams" for the no-login Hub
// (R1·PR-A). Locks toggle add/remove semantics, isTeamTracked, untrack, the
// change-event broadcast, and corruption tolerance.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTrackedTeams, isHubSignedIn, isTeamTracked, toggleTrackedTeam, TRACKED_CHANGE_EVENT, untrackTeam,
} from '../trackingStore';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('trackingStore', () => {
  it('starts empty and toggles a team on then off', () => {
    expect(getTrackedTeams()).toEqual([]);
    expect(toggleTrackedTeam({ teamKey: 'a:M:5th', name: 'A' })).toBe(true);   // now tracked
    expect(isTeamTracked('a:M:5th')).toBe(true);
    expect(getTrackedTeams()).toEqual([{ teamKey: 'a:M:5th', name: 'A' }]);
    expect(toggleTrackedTeam({ teamKey: 'a:M:5th', name: 'A' })).toBe(false);  // untracked
    expect(isTeamTracked('a:M:5th')).toBe(false);
  });

  it('defaults the display name to the teamKey when none is given', () => {
    toggleTrackedTeam({ teamKey: 'b:F:4th' });
    expect(getTrackedTeams()).toEqual([{ teamKey: 'b:F:4th', name: 'b:F:4th' }]);
  });

  it('untrackTeam removes only the named team', () => {
    toggleTrackedTeam({ teamKey: 'a', name: 'A' });
    toggleTrackedTeam({ teamKey: 'b', name: 'B' });
    untrackTeam('a');
    expect(getTrackedTeams().map((t) => t.teamKey)).toEqual(['b']);
  });

  it('broadcasts a change event on every mutation', () => {
    const spy = vi.fn();
    window.addEventListener(TRACKED_CHANGE_EVENT, spy);
    toggleTrackedTeam({ teamKey: 'a', name: 'A' });
    untrackTeam('a');
    window.removeEventListener(TRACKED_CHANGE_EVENT, spy);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('is in anon/local mode by default (no DB sync until sign-in)', () => {
    expect(isHubSignedIn()).toBe(false);
    toggleTrackedTeam({ teamKey: 'a:M:5th', name: 'A' });
    // anon writes land in localStorage and read back fresh (not an in-memory cache)
    expect(JSON.parse(localStorage.getItem('aau:tracked-teams:v1'))).toEqual([{ teamKey: 'a:M:5th', name: 'A' }]);
  });

  it('ignores a no-key toggle and tolerates corrupted storage', () => {
    expect(toggleTrackedTeam({})).toBe(false);
    expect(getTrackedTeams()).toEqual([]);
    localStorage.setItem('aau:tracked-teams:v1', '{not json');
    expect(getTrackedTeams()).toEqual([]);
  });
});
