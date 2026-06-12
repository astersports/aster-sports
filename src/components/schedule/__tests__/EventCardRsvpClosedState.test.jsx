// @vitest-environment jsdom
//
// SD-11 closed-state treatment (SCHEDULE_L99_BUILD_SPEC §5 parent +
// §6 render): once an event is live, the parent card shows the quiet
// "RSVP closed" line — never an actionable (or disabled-button) RSVP
// control. Upcoming cards keep the live control. Cross-surface
// invariant per CLAUDE.md anti-pattern #43.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventCard from '../EventCard';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ role: 'parent', myChildren: [{ playerId: 'p1', teamId: 't-1', teamIds: ['t-1'], firstName: 'Charlie' }] }),
}));
vi.mock('../../../hooks/useNow', () => ({ useNow: () => Date.now() }));
vi.mock('../../../hooks/useMapsUrl', () => ({ useMapsUrl: () => null }));
vi.mock('../../shared/ChildRsvp', () => ({
  default: () => <div data-testid="child-rsvp" />,
}));

afterEach(cleanup);

const TEAM = { id: 't-1', name: '11U Girls', team_color: '#a78bfa' };
const HOUR = 60 * 60 * 1000;

function renderCard(event) {
  return render(<MemoryRouter><EventCard event={event} /></MemoryRouter>);
}

describe('EventCard — SD-11 RSVP closed state', () => {
  it('live event shows "RSVP closed" and no RSVP control', () => {
    const { container, queryAllByTestId } = renderCard({
      id: 'e-live', team_id: 't-1', event_type: 'game', status: 'scheduled',
      start_at: new Date(Date.now() - HOUR).toISOString(),
      end_at: new Date(Date.now() + HOUR).toISOString(),
      teams: TEAM, location_name: 'Gym',
    });
    expect(container.textContent).toContain('RSVP closed');
    expect(queryAllByTestId('child-rsvp')).toHaveLength(0);
  });

  it('upcoming event shows the control and no closed line', () => {
    const { container, queryAllByTestId } = renderCard({
      id: 'e-up', team_id: 't-1', event_type: 'game', status: 'scheduled',
      start_at: new Date(Date.now() + HOUR).toISOString(),
      end_at: new Date(Date.now() + 2 * HOUR).toISOString(),
      teams: TEAM, location_name: 'Gym',
    });
    expect(queryAllByTestId('child-rsvp').length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain('RSVP closed');
  });

  it('completed event shows neither control nor closed line', () => {
    const { container, queryAllByTestId } = renderCard({
      id: 'e-done', team_id: 't-1', event_type: 'game', status: 'scheduled',
      start_at: new Date(Date.now() - 4 * HOUR).toISOString(),
      end_at: new Date(Date.now() - 2 * HOUR).toISOString(),
      teams: TEAM, location_name: 'Gym',
    });
    expect(queryAllByTestId('child-rsvp')).toHaveLength(0);
    expect(container.textContent).not.toContain('RSVP closed');
  });
});
