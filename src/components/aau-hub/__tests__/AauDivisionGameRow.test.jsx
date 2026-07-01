// @vitest-environment jsdom
//
// AauDivisionGameRow — one game on the Hub division Schedule/Bracket (R1·PR-A).
// Ships with the *Row component per AP #46. Locks: final games show both scores +
// "Final" + venue; upcoming games show the NY tip-off time (not scores) + a
// Bracket tag; a bare game degrades to "TBD" without crashing.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import AauDivisionGameRow from '../AauDivisionGameRow';

afterEach(cleanup);

describe('AauDivisionGameRow', () => {
  it('shows both teams, scores, Final, and venue for a completed game', () => {
    const { container } = render(<AauDivisionGameRow game={{ home: 'Hoop Kings', away: 'NY LOB', homeScore: 50, awayScore: 15, status: 'final', venue: { name: 'WCC' } }} />);
    expect(container.textContent).toMatch(/Hoop Kings/);
    expect(container.textContent).toMatch(/NY LOB/);
    expect(container.textContent).toMatch(/50/);
    expect(container.textContent).toMatch(/Final/);
    expect(container.textContent).toMatch(/WCC/);
  });

  it('shows the NY tip-off time (not scores) + a Bracket tag for an upcoming game', () => {
    const { container } = render(<AauDivisionGameRow game={{ home: 'A', away: 'B', status: 'scheduled', startAt: '2026-06-23T18:30:00Z', isBracket: true }} />);
    expect(container.textContent).not.toMatch(/Final/);
    expect(container.textContent).toMatch(/Bracket/);
    expect(container.textContent).toMatch(/2:30/); // 18:30Z = 2:30 PM EDT
  });

  it('degrades to TBD on a bare game', () => {
    expect(render(<AauDivisionGameRow game={{}} />).container.textContent).toMatch(/TBD/);
  });

  // §15/§27 honest-state — a scheduled game with no venue must say "Location TBD",
  // never a silent omission. Cross-surface invariant with AauGameCard (AP #43/#46).
  it('renders "Location TBD" when a scheduled game has no venue or court', () => {
    const { container } = render(<AauDivisionGameRow game={{ home: 'A', away: 'B', status: 'scheduled', startAt: '2026-08-05T21:30:00Z', venue: null, court: null }} />);
    expect(container.textContent).toMatch(/Location TBD/);
  });

  it('shows the venue (not "Location TBD") when one is present', () => {
    const { container } = render(<AauDivisionGameRow game={{ home: 'A', away: 'B', status: 'scheduled', startAt: '2026-08-05T21:30:00Z', venue: { name: 'House of Sports' }, court: 'Court 1' }} />);
    expect(container.textContent).toMatch(/House of Sports · Court 1/);
    expect(container.textContent).not.toMatch(/Location TBD/);
  });
});
