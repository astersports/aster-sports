// @vitest-environment jsdom
//
// EventCard — tournament-draft DRAFT pill invariant (L99 Q2 follow-up
// to PR #382). Tournament-anchor events with no opponent yet render
// a DRAFT pill so parents don't mistake placeholders for confirmed
// games. Matches the treatment shipped on MatchupCard (Games tab).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const auth = vi.hoisted(() => ({ role: 'admin' }));
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ role: auth.role, myChildren: [] }),
}));
vi.mock('../../../hooks/useNow', () => ({ useNow: () => Date.now() }));
vi.mock('../../../hooks/useMapsUrl', () => ({ useMapsUrl: () => null }));
vi.mock('../../shared/ChildRsvp', () => ({ default: () => null }));

import EventCard from '../EventCard';

afterEach(cleanup);

const TEAM = { id: 't-1', name: '11U Girls', team_color: '#a78bfa' };
const inWeeks = (w) => new Date(Date.now() + w * 7 * 24 * 60 * 60 * 1000).toISOString();

function renderInRouter(jsx) { return render(<MemoryRouter>{jsx}</MemoryRouter>); }

describe('EventCard — tournament DRAFT pill invariant', () => {
  it('tournament event with null opponent renders the DRAFT pill', () => {
    const event = {
      id: 'e1', team_id: 't-1', event_type: 'tournament',
      start_at: inWeeks(2), opponent: null,
      status: 'scheduled', teams: TEAM, location_name: 'TBD',
    };
    const { container } = renderInRouter(<EventCard event={event} />);
    expect(container.textContent).toMatch(/Draft/);
  });

  it('tournament event with a real opponent does NOT render the DRAFT pill', () => {
    const event = {
      id: 'e2', team_id: 't-1', event_type: 'tournament',
      start_at: inWeeks(2), opponent: 'CT Northstars',
      status: 'scheduled', teams: TEAM, location_name: 'Insports Center',
    };
    const { container } = renderInRouter(<EventCard event={event} />);
    expect(container.textContent).not.toMatch(/Draft/);
  });

  it('regular game with null opponent does NOT render the DRAFT pill (only tournaments)', () => {
    const event = {
      id: 'e3', team_id: 't-1', event_type: 'game',
      start_at: inWeeks(2), opponent: null,
      status: 'scheduled', teams: TEAM, location_name: 'Home',
    };
    const { container } = renderInRouter(<EventCard event={event} />);
    expect(container.textContent).not.toMatch(/Draft/);
  });

  it('practice never renders the DRAFT pill', () => {
    const event = {
      id: 'e4', team_id: 't-1', event_type: 'practice',
      start_at: inWeeks(1), status: 'scheduled', teams: TEAM,
    };
    const { container } = renderInRouter(<EventCard event={event} />);
    expect(container.textContent).not.toMatch(/Draft/);
  });

  it('UX-11: parents never see the DRAFT pill (staff-only chip)', () => {
    auth.role = 'parent';
    const event = {
      id: 'e5', team_id: 't-1', event_type: 'tournament',
      start_at: inWeeks(2), opponent: null,
      status: 'scheduled', teams: TEAM, location_name: 'TBD',
    };
    const { container } = renderInRouter(<EventCard event={event} />);
    expect(container.textContent).not.toMatch(/Draft/);
    auth.role = 'admin';
  });
});
