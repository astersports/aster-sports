// @vitest-environment jsdom
//
// AauSearchResults — grouped results for the no-login Hub search (R1·PR-A).
// Locks the field mapping off search_public_aau() (camelCase: teamKey,
// tournamentId, gradeLabel, record{w,l}), the gender label mapping, the
// singular/plural counts, and the no-match empty state.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import AauSearchResults from '../AauSearchResults';

afterEach(cleanup);

const RESULTS = {
  teams: [
    { teamKey: 'bearpack:M:5th', name: 'Bearpack Basketball', gender: 'M', gradeLabel: '5th',
      record: { w: 3, l: 1 }, divisionName: 'Boys - 5th', tournamentName: 'Zero Gravity NY Grand Finale', isLive: false },
  ],
  tournaments: [
    { tournamentId: 't1', name: 'Westchester Summer League', circuit: 'League Play', divisionCount: 1, isLive: true },
  ],
  divisions: [
    { divisionId: 'd1', divisionName: 'Boys - 4th', teamCount: 12, tournamentName: 'Westchester Summer League' },
  ],
};

describe('AauSearchResults', () => {
  it('renders a team with grade, gender, record, division, and tournament', () => {
    const { container } = render(<AauSearchResults results={{ ...RESULTS, tournaments: [], divisions: [] }} />);
    expect(container.textContent).toMatch(/Bearpack Basketball/);
    expect(container.textContent).toMatch(/Boys · 5th/);
    expect(container.textContent).toMatch(/3–1/);            // record W–L
    expect(container.textContent).toMatch(/Zero Gravity NY Grand Finale/);
    expect(container.textContent).toMatch(/Boys - 5th/);
    expect(container.textContent).toMatch(/Teams · 1/);
  });

  it('singularizes "1 division" on a tournament result', () => {
    const { container } = render(<AauSearchResults results={{ teams: [], divisions: [], tournaments: RESULTS.tournaments }} />);
    expect(container.textContent).toMatch(/Westchester Summer League/);
    expect(container.textContent).toMatch(/1 division\b/);
    expect(container.textContent).not.toMatch(/1 divisions/);
  });

  it('pluralizes team count on a division result', () => {
    const { container } = render(<AauSearchResults results={{ teams: [], tournaments: [], divisions: RESULTS.divisions }} />);
    expect(container.textContent).toMatch(/Boys - 4th/);
    expect(container.textContent).toMatch(/12 teams/);
  });

  it('shows the no-match notice when every group is empty', () => {
    const { container } = render(<AauSearchResults results={{ teams: [], divisions: [], tournaments: [] }} />);
    expect(container.textContent).toMatch(/No matches yet/);
  });

  it('tolerates a null results prop without crashing', () => {
    const { container } = render(<AauSearchResults results={null} />);
    expect(container.textContent).toMatch(/No matches yet/);
  });
});
