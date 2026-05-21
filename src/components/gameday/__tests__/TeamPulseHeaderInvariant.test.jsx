// @vitest-environment jsdom
//
// Cross-surface invariant test per CLAUDE.md anti-pattern #43.
//
// TeamHeatmap renders a header pill that summarizes the team's RSVP
// pulse — historically "Team Pulse · 3% Going" even when only 1 of 13
// families had responded across all past events. The bare % misled
// because the underlying signal was sparse (% of NR not % of responses).
//
// L99 Teams audit B1 origin: header MUST NOT show a numeric % when
// either of these holds:
//   (a) responseRate < 50% (fewer than half of past events have any
//       response from any visible player), OR
//   (b) totalPast < 2 (not enough events to compute a trend).
//
// 2026-05-21 (Bug 1 follow-up) — qualifier "· Not enough data yet"
// dropped per CLAUDE.md §16.3 kindness microcopy mandate. Below
// threshold the header is just "{label}" with no qualifier — the
// grid itself surfaces the data shape (empty cells when truly zero
// data; populated cells when partial data). Range/filter chips stay.
//
// This test locks the invariant — any future change that re-introduces
// the "Not enough data yet" copy OR an unguarded numeric % render fails.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

const attendanceRef = { current: { grid: [], events: [], loading: false } };
const authRef = { current: { role: 'admin', myChildren: [] } };

vi.mock('../../../hooks/useAttendanceData', () => ({
  useAttendanceData: () => attendanceRef.current,
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => authRef.current,
}));

const { default: TeamHeatmap } = await import('../TeamHeatmap');

afterEach(() => {
  cleanup();
  authRef.current = { role: 'admin', myChildren: [] };
});

function gridRow({ totalPast, goingCount = 0, maybeCount = 0, declinedCount = 0 }) {
  return {
    player: { id: `p-${Math.random()}`, first_name: 'Test', jersey_number: '0' },
    cells: [],
    pct: null,
    streak: 0,
    totalPast, goingCount, maybeCount, declinedCount, noResponseCount: 0,
  };
}

describe('TeamPulseHeader invariant — gated % per anti-pattern #43 (B1)', () => {
  it('a. sparse data (1 response across 5 events) renders bare "Team Pulse" without qualifier', () => {
    attendanceRef.current = {
      grid: [gridRow({ totalPast: 5, goingCount: 1 })],
      events: [], loading: false,
    };
    const { container } = render(<TeamHeatmap teamId="t-1" />);
    expect(container.textContent).toMatch(/Team Pulse/);
    expect(container.textContent).not.toMatch(/Not enough data yet/);
    expect(container.textContent).not.toMatch(/\d+%\s*Going/);
  });

  it('b. zero past events (0 totalPast) renders bare "Team Pulse" without qualifier', () => {
    attendanceRef.current = {
      grid: [gridRow({ totalPast: 0 })],
      events: [], loading: false,
    };
    const { container } = render(<TeamHeatmap teamId="t-1" />);
    expect(container.textContent).toMatch(/Team Pulse/);
    expect(container.textContent).not.toMatch(/Not enough data yet/);
    expect(container.textContent).not.toMatch(/\d+%\s*Going/);
  });

  it('c. 1 past event (totalPast=1, fully responded) still renders bare "Team Pulse" (totalPast < 2 floor)', () => {
    attendanceRef.current = {
      grid: [gridRow({ totalPast: 1, goingCount: 1 })],
      events: [], loading: false,
    };
    const { container } = render(<TeamHeatmap teamId="t-1" />);
    expect(container.textContent).toMatch(/Team Pulse/);
    expect(container.textContent).not.toMatch(/Not enough data yet/);
    expect(container.textContent).not.toMatch(/\d+%\s*Going/);
  });

  it('d. enough data (responseRate>=50% AND totalPast>=2) DOES render the numeric % header', () => {
    attendanceRef.current = {
      grid: [
        gridRow({ totalPast: 4, goingCount: 3 }),
        gridRow({ totalPast: 4, goingCount: 1, maybeCount: 1 }),
      ],
      events: [], loading: false,
    };
    const { container } = render(<TeamHeatmap teamId="t-1" />);
    expect(container.textContent).toMatch(/\d+%\s*Going/);
    expect(container.textContent).not.toMatch(/Not enough data yet/);
  });

  it('e. parent view uses "RSVP Pulse" label and inherits the same gate (bare label below threshold)', () => {
    authRef.current = { role: 'parent', myChildren: [{ playerId: 'p-1' }] };
    attendanceRef.current = {
      grid: [{ ...gridRow({ totalPast: 5, goingCount: 0 }), player: { id: 'p-1', first_name: 'Kid', jersey_number: '0' } }],
      events: [], loading: false,
    };
    const { container } = render(<TeamHeatmap teamId="t-1" />);
    expect(container.textContent).toMatch(/RSVP Pulse/);
    expect(container.textContent).not.toMatch(/Not enough data yet/);
  });
});
