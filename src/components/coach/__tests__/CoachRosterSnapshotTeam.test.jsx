// @vitest-environment jsdom
//
// CoachRosterSnapshotTeam — overdue gate test.
//
// Locks the §UX retrospective note from PR #236: the yellow
// missing-RSVP highlight must NOT render when the next event is
// >72h out. Without the gate, 100% of rows highlight yellow for
// a far-out event, losing scan-value.
//
// Threshold is inclusive at exactly 72h (a player with no RSVP for
// an event 72h out still highlights — coaches expect the boundary
// to fall in the warning window, not just outside it).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const HOUR_MS = 60 * 60 * 1000;
const FIXED_NOW = Date.parse('2026-05-18T14:00:00Z');

const attendanceRef = { current: { grid: [], events: [], loading: false } };

vi.mock('../../../hooks/useAttendanceData', () => ({
  useAttendanceData: () => attendanceRef.current,
}));

vi.mock('../../../hooks/useNow', () => ({
  useNow: () => FIXED_NOW,
}));

const { default: CoachRosterSnapshotTeam } = await import('../CoachRosterSnapshotTeam');

const TEAM = { id: 't-10b', name: '10U Black', team_color: '#000000' };

function makeFixture({ eventOffsetMs, rsvpState }) {
  const eventId = 'ev-1';
  const startAt = new Date(FIXED_NOW + eventOffsetMs).toISOString();
  return {
    grid: [{
      player: { id: 'p-1', first_name: 'Milo', last_name: 'S', jersey_number: '5' },
      cells: [{ eventId, state: rsvpState }],
      pct: 85,
    }],
    events: [{ id: eventId, start_at: startAt }],
    loading: false,
  };
}

beforeEach(() => {
  attendanceRef.current = { grid: [], events: [], loading: false };
});

afterEach(() => cleanup());

describe('CoachRosterSnapshotTeam — overdue gate', () => {
  it('a. event >72h out + no RSVP → NO yellow highlight', () => {
    attendanceRef.current = makeFixture({ eventOffsetMs: 96 * HOUR_MS, rsvpState: 'no_response' });
    render(<CoachRosterSnapshotTeam team={TEAM} />);
    const row = screen.getByRole('listitem');
    expect(row.style.backgroundColor).not.toContain('warning');
    expect(row.style.backgroundColor).toBe('transparent');
  });

  it('b. event <72h out + no RSVP → yellow highlight', () => {
    attendanceRef.current = makeFixture({ eventOffsetMs: 24 * HOUR_MS, rsvpState: 'no_response' });
    render(<CoachRosterSnapshotTeam team={TEAM} />);
    const row = screen.getByRole('listitem');
    expect(row.style.backgroundColor).toContain('as-warning-soft');
  });

  it('c. event <72h out + has RSVP → NO yellow highlight', () => {
    attendanceRef.current = makeFixture({ eventOffsetMs: 24 * HOUR_MS, rsvpState: 'going' });
    render(<CoachRosterSnapshotTeam team={TEAM} />);
    const row = screen.getByRole('listitem');
    expect(row.style.backgroundColor).toBe('transparent');
  });

  it('d. event EXACTLY 72h out + no RSVP → yellow (threshold inclusive)', () => {
    attendanceRef.current = makeFixture({ eventOffsetMs: 72 * HOUR_MS, rsvpState: 'no_response' });
    render(<CoachRosterSnapshotTeam team={TEAM} />);
    const row = screen.getByRole('listitem');
    expect(row.style.backgroundColor).toContain('as-warning-soft');
  });

  it('e. no next event (all past) → NO yellow highlight', () => {
    attendanceRef.current = {
      grid: [{
        player: { id: 'p-1', first_name: 'Milo', last_name: 'S', jersey_number: '5' },
        cells: [{ eventId: 'ev-past', state: 'no_response' }],
        pct: 85,
      }],
      events: [{ id: 'ev-past', start_at: new Date(FIXED_NOW - 24 * HOUR_MS).toISOString() }],
      loading: false,
    };
    render(<CoachRosterSnapshotTeam team={TEAM} />);
    const row = screen.getByRole('listitem');
    expect(row.style.backgroundColor).toBe('transparent');
  });
});
