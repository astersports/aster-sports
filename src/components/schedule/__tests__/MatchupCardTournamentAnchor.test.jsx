// @vitest-environment jsdom
//
// MatchupCard — tournament-anchor invariant (Theme 6 from 2026-05-20
// cross-surface review). Frank flagged on Games tab: future tournament
// anchors rendered as "8:00 AM vs TBD" which read like a regular game
// admins forgot to fill out. The schedule isn't released yet — bracket
// games come once the tournament publishes them.
//
// Locks: when event_type='tournament' AND opponent is null, the card
// renders the tournament name + "Schedule pending" instead of "vs TBD",
// and suppresses the placeholder time.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MatchupCard from '../MatchupCard';

afterEach(cleanup);

const TEAM = { id: 't-11g', name: '11U Girls', team_color: '#a78bfa' };

function renderInRouter(jsx) {
  return render(<MemoryRouter>{jsx}</MemoryRouter>);
}

describe('MatchupCard — tournament-anchor invariant', () => {
  it('tournament event with no opponent renders the tournament name + "Schedule pending"', () => {
    const event = {
      id: 'e1', start_at: '2099-06-13T12:00:00Z',
      event_type: 'tournament', tournament_name: 'ZG Girls Nationals',
      opponent: null, home_away: 'home', status: 'scheduled', teams: TEAM,
    };
    const { container, queryByText } = renderInRouter(<MatchupCard event={event} />);
    expect(queryByText(/ZG Girls Nationals/)).not.toBeNull();
    expect(queryByText(/Schedule pending/)).not.toBeNull();
    expect(container.textContent).not.toMatch(/vs TBD/);
  });

  it('tournament without tournament_name falls back to "Tournament"', () => {
    const event = {
      id: 'e2', start_at: '2099-06-13T12:00:00Z',
      event_type: 'tournament', tournament_name: null,
      opponent: null, home_away: 'home', status: 'scheduled', teams: TEAM,
    };
    const { queryByText } = renderInRouter(<MatchupCard event={event} />);
    expect(queryByText('Tournament')).not.toBeNull();
    expect(queryByText(/Schedule pending/)).not.toBeNull();
  });

  it('tournament with a real opponent (bracket released) renders normally (control)', () => {
    const event = {
      id: 'e3', start_at: '2099-06-13T12:00:00Z',
      event_type: 'tournament', tournament_name: 'ZG Girls Nationals',
      opponent: 'CT Northstars', home_away: 'home', status: 'scheduled', teams: TEAM,
    };
    const { container } = renderInRouter(<MatchupCard event={event} />);
    expect(container.textContent).toMatch(/vs CT Northstars/);
    expect(container.textContent).not.toMatch(/Schedule pending/);
  });

  it('regular game with no opponent still shows "vs TBD" (only tournaments get the new treatment)', () => {
    const event = {
      id: 'e4', start_at: '2099-06-13T12:00:00Z',
      event_type: 'game', opponent: null, home_away: 'home',
      status: 'scheduled', teams: TEAM,
    };
    const { container } = renderInRouter(<MatchupCard event={event} />);
    expect(container.textContent).toMatch(/vs TBD/);
    expect(container.textContent).not.toMatch(/Schedule pending/);
  });
});
