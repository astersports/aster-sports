// @vitest-environment jsdom
//
// AauSearchResults — grouped results for the no-login Hub search (R1·PR-A).
// Locks the field mapping off search_public_aau() (camelCase: teamKey,
// tournamentId, gradeLabel, record{w,l}), the gender label mapping, the
// singular/plural counts, the team→schedule link, and the no-match empty state.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AauSearchResults from '../AauSearchResults';

afterEach(cleanup);

// Team cards render <Link>, so renders need a Router context.
const renderResults = (results) => render(<MemoryRouter><AauSearchResults results={results} /></MemoryRouter>);

const RESULTS = {
  teams: [
    { teamKey: 'bearpack basketball:M:5th', name: 'Bearpack Basketball', gender: 'M', gradeLabel: '5th',
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
    const { container } = renderResults({ ...RESULTS, tournaments: [], divisions: [] });
    expect(container.textContent).toMatch(/Bearpack Basketball/);
    expect(container.textContent).toMatch(/Boys · 5th/);
    expect(container.textContent).toMatch(/3–1/);            // record W–L
    expect(container.textContent).toMatch(/Zero Gravity NY Grand Finale/);
    expect(container.textContent).toMatch(/Boys - 5th/);
    expect(container.textContent).toMatch(/Teams · 1/);
  });

  it('links a team to its schedule with the encoded teamKey (qkey) as the route param', () => {
    const { container } = renderResults({ ...RESULTS, tournaments: [], divisions: [] });
    const link = container.querySelector('a[href]');
    expect(link).not.toBeNull();
    // Spaces + colons in the qkey must be percent-encoded into the path.
    expect(link.getAttribute('href')).toBe('/hub/team/bearpack%20basketball%3AM%3A5th');
  });

  it('renders a team without a teamKey as a non-link card (no crash)', () => {
    const { container } = renderResults({ teams: [{ name: 'Keyless', gender: 'F', gradeLabel: '4th' }], tournaments: [], divisions: [] });
    expect(container.textContent).toMatch(/Keyless/);
    expect(container.querySelector('a[href]')).toBeNull();
  });

  it('links a tournament result to its detail page by tournamentId', () => {
    const { container } = renderResults({ teams: [], divisions: [], tournaments: RESULTS.tournaments });
    const link = container.querySelector('a[href]');
    expect(link.getAttribute('href')).toBe('/hub/tournament/t1');
  });

  it('renders Tournaments before Teams so a tournament search is not buried under the team list', () => {
    const { container } = renderResults({ ...RESULTS, divisions: [] });
    const text = container.textContent;
    expect(text.indexOf('Tournaments ·')).toBeGreaterThanOrEqual(0);
    expect(text.indexOf('Teams ·')).toBeGreaterThan(text.indexOf('Tournaments ·'));
  });

  it('singularizes "1 division" on a tournament result', () => {
    const { container } = renderResults({ teams: [], divisions: [], tournaments: RESULTS.tournaments });
    expect(container.textContent).toMatch(/Westchester Summer League/);
    expect(container.textContent).toMatch(/1 division\b/);
    expect(container.textContent).not.toMatch(/1 divisions/);
  });

  it('pluralizes team count on a division result', () => {
    const { container } = renderResults({ teams: [], tournaments: [], divisions: RESULTS.divisions });
    expect(container.textContent).toMatch(/Boys - 4th/);
    expect(container.textContent).toMatch(/12 teams/);
  });

  it('shows the no-match notice when every group is empty', () => {
    const { container } = renderResults({ teams: [], divisions: [], tournaments: [] });
    expect(container.textContent).toMatch(/No matches yet/);
  });

  it('tolerates a null results prop without crashing', () => {
    const { container } = renderResults(null);
    expect(container.textContent).toMatch(/No matches yet/);
  });
});
