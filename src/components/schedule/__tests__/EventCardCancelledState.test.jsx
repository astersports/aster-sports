// @vitest-environment jsdom
//
// Cancelled-event invariant test (Theme 3 from 2026-05-20 cross-surface
// review). Frank flagged: cancelled events on the schedule list still
// showed the live "in 7h 12m" countdown chip AND the Going/Maybe/Can't
// RSVP picker. Half-cancelled UI.
//
// This locks: when status='cancelled', the countdown chip is suppressed
// regardless of how close the start time is, and the RSVP picker for
// any child on the team renders disabled.
//
// Cross-surface invariant per CLAUDE.md anti-pattern #43.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventCard from '../EventCard';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ role: 'parent', myChildren: [{ playerId: 'p1', teamId: 't-1', teamIds: ['t-1'] }] }),
}));
vi.mock('../../../hooks/useNow', () => ({ useNow: () => Date.now() }));
vi.mock('../../../hooks/useMapsUrl', () => ({ useMapsUrl: () => null }));
vi.mock('../../shared/ChildRsvp', () => ({
  default: ({ disabled }) => <div data-testid="child-rsvp" data-disabled={String(!!disabled)} />,
}));

afterEach(cleanup);

const TEAM = { id: 't-1', name: '10U Blue', team_color: '#4a8fd4' };
const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();
const inTwoHours = () => new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

function renderInRouter(jsx) {
  return render(<MemoryRouter>{jsx}</MemoryRouter>);
}

describe('EventCard — cancelled state invariant', () => {
  it('cancelled event suppresses the countdown chip even when isNext + within 24h', () => {
    const event = {
      id: 'e-cancelled', team_id: 't-1', event_type: 'practice',
      start_at: inOneHour(), end_at: inTwoHours(),
      status: 'cancelled', teams: TEAM, location_name: 'Test Gym',
    };
    const { container } = renderInRouter(<EventCard event={event} isNext />);
    expect(container.textContent).not.toMatch(/in \d+h/);
    expect(container.textContent).toMatch(/Cancelled/i);
  });

  it('non-cancelled event in the countdown window still shows the chip (control)', () => {
    const event = {
      id: 'e-live', team_id: 't-1', event_type: 'practice',
      start_at: inOneHour(), end_at: inTwoHours(),
      status: 'scheduled', teams: TEAM, location_name: 'Test Gym',
    };
    const { container } = renderInRouter(<EventCard event={event} isNext />);
    expect(container.textContent).toMatch(/in \d+h|in \d+m/);
  });

  it('cancelled event renders NO RSVP picker (SD-2 strengthened: zero actionable RSVP UI on cancelled)', () => {
    // Pre-spine this invariant asserted the picker rendered disabled;
    // the spine card hides it entirely — same invariant class (no
    // live-looking RSVP on a cancelled card), stronger form.
    const event = {
      id: 'e-cancelled', team_id: 't-1', event_type: 'practice',
      start_at: inOneHour(), end_at: inTwoHours(),
      status: 'cancelled', teams: TEAM, location_name: 'Test Gym',
    };
    const { queryAllByTestId } = renderInRouter(<EventCard event={event} />);
    expect(queryAllByTestId('child-rsvp')).toHaveLength(0);

    // Control: same event un-cancelled DOES render the picker.
    const scheduled = { ...event, id: 'e-ok', status: 'scheduled' };
    const { queryAllByTestId: q2 } = renderInRouter(<EventCard event={scheduled} />);
    expect(q2('child-rsvp').length).toBeGreaterThan(0);
  });
});
