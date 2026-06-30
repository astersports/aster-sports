// @vitest-environment jsdom
//
// AauDivisionCard — one division on a tournament's public Hub detail (R1·PR-A).
// Presentational now (the tournament page links it to the division detail page);
// locks the name + team-count + advance-cutoff render.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import AauDivisionCard from '../AauDivisionCard';

afterEach(cleanup);

describe('AauDivisionCard', () => {
  it('renders the division name, team count (from teams[]), and advance cutoff', () => {
    const division = { id: 'd1', name: 'Boys - 5th', advance_count: 2, teams: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
    const { container } = render(<AauDivisionCard division={division} />);
    expect(container.textContent).toMatch(/Boys - 5th/);
    expect(container.textContent).toMatch(/3 teams/);
    expect(container.textContent).toMatch(/Top 2 advance/);
  });

  it('falls back to team_count and singularizes "1 team"', () => {
    const { container } = render(<AauDivisionCard division={{ id: 'd2', name: 'Girls - 5th', team_count: 1 }} />);
    expect(container.textContent).toMatch(/1 team\b/);
    expect(container.textContent).not.toMatch(/1 teams/);
  });

  it('omits the advance label when advance_count is absent', () => {
    const { container } = render(<AauDivisionCard division={{ id: 'd3', name: 'Boys - 4th', teams: [{ id: 'a' }, { id: 'b' }] }} />);
    expect(container.textContent).toMatch(/2 teams/);
    expect(container.textContent).not.toMatch(/advance/);
  });

  it('tolerates a bare division (name only / null) without crashing', () => {
    expect(render(<AauDivisionCard division={{ name: 'Lonely' }} />).container.textContent).toMatch(/Lonely/);
    expect(render(<AauDivisionCard division={null} />).container.textContent).toMatch(/Division/);
  });
});
