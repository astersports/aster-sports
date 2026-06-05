// @vitest-environment jsdom
//
// EventDetailHero — render variant smoke tests (L99 PR B).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ role: 'admin', myChildren: [] }),
}));
vi.mock('../../../hooks/useNow', () => ({ useNow: () => Date.now() }));
vi.mock('../../schedule/ChildRsvp', () => ({ default: () => null }));
vi.mock('../../gameday/ParentArrivalActions', () => ({ default: () => null }));

import EventDetailHero from '../EventDetailHero';

afterEach(cleanup);

const TEAM = { id: 't-1', name: '10U Blue', team_color: '#4a8fd4' };
const future = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

function withRouter(node) { return render(<MemoryRouter>{node}</MemoryRouter>); }

describe('EventDetailHero', () => {
  it('future game (staff) renders title, location, RSVP progress, Notify + Lock buttons', () => {
    const event = {
      id: 'e1', team_id: 't-1', event_type: 'game',
      start_at: future(), opponent: 'PHD-McCurdy', home_away: 'home',
      location: 'CYO Spellman', jersey: 'Black', status: 'scheduled', teams: TEAM,
    };
    const { container } = withRouter(<EventDetailHero event={event} isStaff isPast={false} rsvps={[{ response: 'going' }, { response: 'going' }, { response: 'maybe' }]} roster={[{}, {}, {}, {}]} onNotify={vi.fn()} onLockRoster={vi.fn()} />);
    expect(container.textContent).toMatch(/PHD-McCurdy/);
    expect(container.textContent).toMatch(/CYO Spellman/);
    expect(container.textContent).toMatch(/2 going/);
    expect(container.textContent).toMatch(/Notify families/);
    expect(container.textContent).toMatch(/Lock roster/);
  });

  it('cancelled game (staff) shows CANCELLED badge + struck title + no action stack', () => {
    const event = {
      id: 'e2', team_id: 't-1', event_type: 'game',
      start_at: future(), opponent: 'PHD-McCurdy', home_away: 'home',
      location: 'CYO Spellman', status: 'cancelled', teams: TEAM,
    };
    const { container } = withRouter(<EventDetailHero event={event} isStaff isPast={false} rsvps={[]} roster={[]} onNotify={vi.fn()} onLockRoster={vi.fn()} />);
    expect(container.textContent).toMatch(/Cancelled/);
    expect(container.textContent).not.toMatch(/Notify families/);
    expect(container.textContent).not.toMatch(/Lock roster/);
  });

  it('practice (staff) renders Notify only — no Lock button', () => {
    const event = {
      id: 'e3', team_id: 't-1', event_type: 'practice',
      start_at: future(), location: 'Rippowam', status: 'scheduled', teams: TEAM,
    };
    const { container } = withRouter(<EventDetailHero event={event} isStaff isPast={false} rsvps={[]} roster={[]} onNotify={vi.fn()} />);
    expect(container.textContent).toMatch(/Notify families/);
    expect(container.textContent).not.toMatch(/Lock roster/);
  });

  it('past game (staff) renders Enter Score + Request recap trigger', () => {
    const event = {
      id: 'e4', team_id: 't-1', event_type: 'game',
      start_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      opponent: 'PHD-McCurdy', home_away: 'home',
      location: 'CYO Spellman', status: 'scheduled', teams: TEAM,
    };
    const { container } = withRouter(<EventDetailHero event={event} isStaff isPast rsvps={[]} roster={[]} onEnterScore={vi.fn()} />);
    expect(container.textContent).toMatch(/Enter Score/);
    // Coach game-recap trigger (compose entry point #3) — mirrors the
    // tournament Compose-briefing deep link.
    expect(container.textContent).toMatch(/Request recap/);
  });

  it('past tournament (staff) renders Enter Score only — no game_recap Request recap', () => {
    // game_recap is a 'game'-scoped trigger; tournaments recap via the
    // separate tournament_recap path, not the per-game Request recap.
    const event = {
      id: 'e5', team_id: 't-1', event_type: 'tournament',
      start_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      opponent: 'Zero Gravity', status: 'scheduled', teams: TEAM,
    };
    const { container } = withRouter(<EventDetailHero event={event} isStaff isPast rsvps={[]} roster={[]} onEnterScore={vi.fn()} />);
    expect(container.textContent).toMatch(/Enter Score/);
    expect(container.textContent).not.toMatch(/Request recap/);
  });

  it('Skeleton renders without props', () => {
    const { container } = render(<EventDetailHero.Skeleton />);
    expect(container.firstChild).not.toBeNull();
    expect(container.firstChild.getAttribute('aria-busy')).toBe('true');
  });
});
