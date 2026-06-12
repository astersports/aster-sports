// @vitest-environment jsdom
//
// SD-15 gate (SCHEDULE_L99_BUILD_SPEC §8 PR-E'): coverage badges are
// ALWAYS visible when non-zero, at EVERY density — compact included.
// Pre-spine, rides hid behind density quirks and duties only rendered
// at maximum. Cross-surface invariant per CLAUDE.md anti-pattern #43.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventCard from '../EventCard';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ role: 'coach', myChildren: [] }),
}));
vi.mock('../../../hooks/useNow', () => ({ useNow: () => Date.now() }));
vi.mock('../../shared/ChildRsvp', () => ({ default: () => null }));

afterEach(cleanup);

const TEAM = { id: 't-1', name: '10U Black', team_color: '#4a8fd4' };
const HOUR = 60 * 60 * 1000;
const upcoming = () => ({
  id: 'e-1', team_id: 't-1', event_type: 'game', status: 'scheduled', enable_rides: true,
  start_at: new Date(Date.now() + 26 * HOUR).toISOString(),
  end_at: new Date(Date.now() + 27 * HOUR).toISOString(),
  teams: TEAM, location_name: 'Gym',
});

describe('EventCard — SD-15 coverage badges at every density', () => {
  // R3 (PR-V4): the densities differ on INFORMATION, not spacing —
  // compact glances, detailed reads the operational detail.
  it('compact: D3 icon glance line (trio + amber need pairs)', () => {
    const { container } = render(
      <MemoryRouter>
        <EventCard event={upcoming()} density="minimal"
          rsvpCount={{ going: 8, denominator: 10 }}
          rideCount={{ requests: 2, offers: 1 }}
          dutyCount={{ total: 3, claimed: 1 }} />
      </MemoryRouter>
    );
    expect(container.textContent.replace(/\s+/g, '')).toContain('8of1022');
  });

  it('detailed: seat math + named open slots when available', () => {
    const { container } = render(
      <MemoryRouter>
        <EventCard event={upcoming()} density="maximum"
          rsvpCount={{ going: 8, denominator: 10, maybe: 1, not_going: 1 }}
          rideCount={{ requests: 2, offers: 1 }}
          dutyCount={{ total: 3, claimed: 1, openNames: ['Snacks', 'Carpool lead'] }} />
      </MemoryRouter>
    );
    expect(container.textContent).toContain("8 of 10 going · 1 maybe · 1 can't");
    expect(container.textContent).toContain('2 ride seats needed · 1 offered');
    expect(container.textContent).toContain('Snacks open · Carpool lead open');
  });

  it('zero-coverage cards stay quiet at compact (no amber noise)', () => {
    const { container } = render(
      <MemoryRouter>
        <EventCard event={upcoming()} density="minimal"
          rsvpCount={{ going: 10, denominator: 10 }}
          rideCount={{ requests: 0, offers: 0 }}
          dutyCount={{ total: 2, claimed: 2 }} />
      </MemoryRouter>
    );
    expect(container.textContent).not.toContain('needed');
  });
});
