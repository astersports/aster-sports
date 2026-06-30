// @vitest-environment jsdom
//
// AauStandingsTable — one pool's standings on the Hub division page (R1·PR-A).
// Locks the columns (W/L/PD/PA/PS), the +/- point-diff formatting, the own-team
// star, and the team→schedule link.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AauStandingsTable from '../AauStandingsTable';

afterEach(cleanup);

const teams = [
  { team_key: 'hoop kings::', name: 'Hoop Kings', wins: 1, losses: 0, diff: 35, pointsFor: 50, pointsAgainst: 15, isOurs: false },
  { team_key: 'legacy::', name: 'Legacy', wins: 0, losses: 1, diff: -3, pointsFor: 32, pointsAgainst: 35, isOurs: true },
];
const renderTable = (props) => render(<MemoryRouter><AauStandingsTable {...props} /></MemoryRouter>);

describe('AauStandingsTable', () => {
  it('renders the pool header, records, point-diff signs, and links a team to its schedule', () => {
    const { container, getByRole } = renderTable({ pool: 'National Maroon', teams });
    expect(container.textContent).toMatch(/National Maroon/);
    expect(container.textContent).toMatch(/Hoop Kings/);
    expect(container.textContent).toMatch(/\+35/); // positive diff prefixed
    expect(container.textContent).toMatch(/-3/);    // negative diff
    expect(getByRole('link', { name: /Hoop Kings/ }).getAttribute('href')).toBe('/hub/team/hoop%20kings%3A%3A');
  });

  it("stars the org's own team", () => {
    const { getByText } = renderTable({ teams });
    expect(getByText(/Legacy ★/)).toBeTruthy();
  });
});
