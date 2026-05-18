// @vitest-environment jsdom
//
// Cross-surface invariant test per CLAUDE.md anti-pattern #43.
//
// Per-player attendance % renders with a consistent "Going" label
// across all surfaces (Coach Home roster snapshot + admin/parent
// PlayerRow). Same underlying value (goingCount / totalPast from
// useAttendanceData.js:130), same label semantic everywhere.
//
// L99 audit origin (B3 / A11 / P4): CoachRosterSnapshotTeam.jsx
// rendered the bare "{pct}%" without a label. PlayerRow.jsx
// rendered specific labels per RSVP category ("Going", "Maybe",
// "No", "NR"). Same data, two surfaces, different labeling. Users
// reading the bare "%" on Coach Home couldn't tell what metric it
// represented — and given the check-in workflow gap (no arrivals
// recorded), the bare "%" was effectively RSVP-going-rate without
// telling the user.
//
// Fix: CoachRosterSnapshotTeam now renders "{pct}% Going" matching
// PlayerRow's label convention. This test locks the invariant —
// any future PR that reverts to a bare "%" label, or introduces a
// new surface rendering the same metric with a different label,
// fails this test.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'fs';

const FIXED_NOW = Date.parse('2026-05-18T18:00:00Z');

const attendanceRef = { current: { grid: [], events: [], loading: false } };

vi.mock('../../../hooks/useAttendanceData', () => ({
  useAttendanceData: () => attendanceRef.current,
}));

vi.mock('../../../hooks/useNow', () => ({
  useNow: () => FIXED_NOW,
}));

const { default: CoachRosterSnapshotTeam } = await import('../CoachRosterSnapshotTeam');

const TEAM = { id: 't-10b', name: '10U Black', team_color: '#000000' };

afterEach(cleanup);

describe('Cross-surface invariant — per-player "Going" label (anti-pattern #43)', () => {
  it('a. CoachRosterSnapshotTeam renders "{pct}% Going" not bare "{pct}%"', () => {
    attendanceRef.current = {
      grid: [{
        player: { id: 'p-1', first_name: 'Milo', last_name: 'S', jersey_number: '5' },
        cells: [],
        pct: 85,
      }],
      events: [],
      loading: false,
    };
    render(<CoachRosterSnapshotTeam team={TEAM} />);
    expect(screen.getByText('85% Going')).toBeInTheDocument();
    // Bare "{pct}%" form must NOT appear — that was the B3 audit catch.
    expect(screen.queryByText(/^85%$/)).toBeNull();
  });

  it('b. null pct renders "—" placeholder (no label appended)', () => {
    attendanceRef.current = {
      grid: [{
        player: { id: 'p-1', first_name: 'Milo', last_name: 'S', jersey_number: '5' },
        cells: [],
        pct: null,
      }],
      events: [],
      loading: false,
    };
    render(<CoachRosterSnapshotTeam team={TEAM} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText(/Going/)).toBeNull();
  });

  it('c. PlayerRow renders "Going" label paired with goingCount (static-grep)', () => {
    const src = readFileSync('src/components/roster/PlayerRow.jsx', 'utf8');
    // PlayerRow uses JSX template closure: `${...}'%'} Going` — the
    // rendered text is "{N}% Going" or "{N} Going" depending on useCount.
    expect(src).toMatch(/\}\s*Going\b/);
    expect(src).toMatch(/goingCount/);
  });

  it('d. MyChildSpotlight renders "Going" label paired with goingCount (static-grep)', () => {
    const src = readFileSync('src/components/roster/MyChildSpotlight.jsx', 'utf8');
    expect(src).toMatch(/\}\s*Going\b/);
    expect(src).toMatch(/goingCount/);
  });

  it('e. CoachRosterSnapshotTeam locks the new "% Going" label (static-grep)', () => {
    const src = readFileSync('src/components/coach/CoachRosterSnapshotTeam.jsx', 'utf8');
    expect(src).toMatch(/% Going/);
    // The pre-fix bare-percentage pattern must NOT re-appear.
    expect(src).not.toMatch(/\$\{row\.pct\}%`/);
  });
});
