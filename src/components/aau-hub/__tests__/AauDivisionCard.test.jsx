// @vitest-environment jsdom
//
// AauDivisionCard — one division on a tournament's public Hub detail (R1·PR-A).
// Locks the collapsed header (name + team count + advance cutoff) AND the
// tournament -> division -> team drill-down: expanding reveals a team list whose
// rows link to /hub/team/<team_key> so a parent can reach a team's schedule.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AauDivisionCard from '../AauDivisionCard';

afterEach(cleanup);

const withTeams = {
  id: 'd1', name: 'Boys - 5th/6th', advance_count: 2,
  teams: [
    { id: 'hoop kings', team_key: 'hoop kings::', name: 'Hoop Kings', wins: 1, losses: 0, pool: 'Boys 5/6' },
    { id: 'legacy hoopers', team_key: 'legacy hoopers:M:5th', name: 'Legacy Hoopers', wins: 0, losses: 1 },
  ],
};

describe('AauDivisionCard (collapsed header)', () => {
  it('renders the division name, team count (from teams[]), and advance cutoff', () => {
    const { container } = render(<AauDivisionCard division={withTeams} />);
    expect(container.textContent).toMatch(/Boys - 5th\/6th/);
    expect(container.textContent).toMatch(/2 teams/);
    expect(container.textContent).toMatch(/Top 2 advance/);
  });

  it('is collapsed by default — team rows are not yet rendered', () => {
    const { queryByText } = render(<AauDivisionCard division={withTeams} />);
    expect(queryByText('Hoop Kings')).toBeNull();
  });

  it('falls back to team_count when teams[] is absent, and singularizes "1 team"', () => {
    const { container } = render(<AauDivisionCard division={{ id: 'd2', name: 'Girls - 5th', team_count: 1 }} />);
    expect(container.textContent).toMatch(/1 team\b/);
    expect(container.textContent).not.toMatch(/1 teams/);
  });

  it('tolerates a bare division (name only / null) without crashing', () => {
    expect(render(<AauDivisionCard division={{ name: 'Lonely' }} />).container.textContent).toMatch(/Lonely/);
    expect(render(<AauDivisionCard division={null} />).container.textContent).toMatch(/Division/);
  });
});

describe('AauDivisionCard (drill-down)', () => {
  it('expands to a team list whose rows link to each team schedule', () => {
    const { getByRole, getAllByRole } = render(
      <MemoryRouter><AauDivisionCard division={withTeams} /></MemoryRouter>,
    );
    fireEvent.click(getByRole('button', { name: /Boys - 5th\/6th/ }));
    const links = getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toContain('/hub/team/hoop%20kings%3A%3A');
    expect(links.map((a) => a.getAttribute('href'))).toContain('/hub/team/legacy%20hoopers%3AM%3A5th');
  });

  it('shows each team record and toggles closed again', () => {
    const { getByRole, queryByText, container } = render(
      <MemoryRouter><AauDivisionCard division={withTeams} /></MemoryRouter>,
    );
    fireEvent.click(getByRole('button', { name: /Boys - 5th\/6th/ }));
    expect(container.textContent).toMatch(/1–0/);
    fireEvent.click(getByRole('button', { name: /Boys - 5th\/6th/ }));
    expect(queryByText('Hoop Kings')).toBeNull();
  });
});
