// @vitest-environment jsdom
//
// §4.C Sprint C TournamentWeekendBanner render contract.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TournamentWeekendBanner from '../TournamentWeekendBanner';

afterEach(() => cleanup());

function withRouter(node) {
  return <MemoryRouter>{node}</MemoryRouter>;
}

const T = (over = {}) => ({
  id: 't-1',
  name: 'Zero Gravity NY Metro Showdown',
  start_date: '2026-05-23',
  end_date: '2026-05-24',
  primary_venue: 'Randall\'s Island, NYC',
  primary_venue_address: '20 Randalls Island Park, New York, NY',
  tourney_url: null,
  hotel_url: null,
  archived_at: null,
  ...over,
});

describe('TournamentWeekendBanner', () => {
  it('renders nothing when tournament is null', () => {
    const { container } = render(withRouter(<TournamentWeekendBanner tournament={null} />));
    expect(container.firstChild).toBeNull();
  });

  it('renders tournament name + dates + venue', () => {
    render(withRouter(<TournamentWeekendBanner tournament={T()} />));
    expect(screen.getByText('Zero Gravity NY Metro Showdown')).toBeInTheDocument();
    expect(screen.getByText(/May 23–24/)).toBeInTheDocument();
    expect(screen.getByText(/Randall's Island, NYC/)).toBeInTheDocument();
  });

  it('renders single-day tournament without range', () => {
    render(withRouter(<TournamentWeekendBanner tournament={T({ start_date: '2026-05-23', end_date: '2026-05-23' })} />));
    expect(screen.getByText(/May 23/)).toBeInTheDocument();
    expect(screen.queryByText(/–/)).not.toBeInTheDocument();
  });

  it('renders cross-month range', () => {
    render(withRouter(<TournamentWeekendBanner tournament={T({ start_date: '2026-04-30', end_date: '2026-05-01' })} />));
    expect(screen.getByText(/Apr 30 – May 1/)).toBeInTheDocument();
  });

  it('link target is /tournaments/<id>', () => {
    render(withRouter(<TournamentWeekendBanner tournament={T({ id: 'tourn-abc' })} />));
    expect(screen.getByRole('link').getAttribute('href')).toBe('/tournaments/tourn-abc');
  });

  it('renders eyebrow + trophy', () => {
    render(withRouter(<TournamentWeekendBanner tournament={T()} />));
    expect(screen.getByText(/Tournament weekend/i)).toBeInTheDocument();
  });

  it('hides venue line when missing', () => {
    render(withRouter(<TournamentWeekendBanner tournament={T({ primary_venue: null })} />));
    expect(screen.queryByText(/Randall's Island/)).not.toBeInTheDocument();
    // Date alone still renders
    expect(screen.getByText(/May 23–24/)).toBeInTheDocument();
  });
});
