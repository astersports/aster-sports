// @vitest-environment jsdom
//
// Invariant test for the /admin/programs index row (anti-pattern #46 + the
// timezone-pin regression guard). Locks: date-only columns render the STORED
// day with no off-by-one (UTC pin), the type badge + counts render, and the row
// links to the program detail route.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProgramIndexRow from '../ProgramIndexRow';

afterEach(cleanup);

const renderRow = (program) =>
  render(<MemoryRouter><ProgramIndexRow program={program} /></MemoryRouter>);

const base = {
  id: 'p1', name: 'Spring 2026', programType: 'season', status: 'active',
  startDate: '2026-03-23', endDate: '2026-06-14', teamCount: 5, playerCount: 63,
};

describe('ProgramIndexRow', () => {
  it('renders name, type badge, date range, and counts', () => {
    renderRow(base);
    expect(screen.getByText('Spring 2026')).toBeInTheDocument();
    expect(screen.getByText('Season')).toBeInTheDocument();
    expect(screen.getByText(/Mar 23/)).toBeInTheDocument();
    expect(screen.getByText(/Jun 14/)).toBeInTheDocument();
    expect(screen.getByText(/5 teams · 63 players/)).toBeInTheDocument();
  });

  it('date-only value renders the stored day regardless of timezone (UTC pin, no off-by-one)', () => {
    renderRow({ ...base, startDate: '2026-03-23', endDate: null, teamCount: 0, playerCount: 0 });
    expect(screen.getByText('Mar 23')).toBeInTheDocument();
    expect(screen.queryByText('Mar 22')).toBeNull();
  });

  it('links to the program detail route', () => {
    renderRow(base);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/admin/programs/p1');
  });
});
