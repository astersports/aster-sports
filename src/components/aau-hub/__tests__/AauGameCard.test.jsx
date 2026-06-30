// @vitest-environment jsdom
//
// AauGameCard — one game on a team's public Hub schedule (R1·PR-A). Locks the
// home/away prefix, the final-score W/L/T derivation, the venue + directions
// links (Google/Apple from coords), and the bracket/forfeit/court badges.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import AauGameCard from '../AauGameCard';

afterEach(cleanup);

const VENUE = { name: 'Harry S. Truman High School', address: '750 Baychester Ave', city: 'Bronx', state: 'NY', lat: 40.8741506, lng: -73.8327863 };

const baseFinal = {
  gameId: 'g1', isHome: true, status: 'final', myScore: 54, oppScore: 22,
  startAt: '2026-06-27T19:35:00+00:00', court: 'Court 1', isBracket: false, isForfeit: false,
  division: 'Boys - 5th', tournament: 'Zero Gravity NY Grand Finale', opponent: 'CT Northstars', venue: VENUE,
};

describe('AauGameCard', () => {
  it('shows a home game as "vs" with the opponent', () => {
    const { container } = render(<AauGameCard game={baseFinal} />);
    expect(container.textContent).toMatch(/vs CT Northstars/);
    expect(container.textContent).not.toMatch(/@ CT Northstars/);
  });

  it('shows an away game as "@" with the opponent', () => {
    const { container } = render(<AauGameCard game={{ ...baseFinal, isHome: false }} />);
    expect(container.textContent).toMatch(/@ CT Northstars/);
  });

  it('derives a win (myScore > oppScore) as "W 54–22"', () => {
    const { container } = render(<AauGameCard game={baseFinal} />);
    expect(container.textContent).toMatch(/W\s*54–22/);
  });

  it('derives a loss as "L" with the away perspective swapped by the RPC', () => {
    const { container } = render(<AauGameCard game={{ ...baseFinal, myScore: 22, oppScore: 54 }} />);
    expect(container.textContent).toMatch(/L\s*22–54/);
  });

  it('derives a tie as "T"', () => {
    const { container } = render(<AauGameCard game={{ ...baseFinal, myScore: 40, oppScore: 40 }} />);
    expect(container.textContent).toMatch(/T\s*40–40/);
  });

  it('renders venue line + Google/Apple direction links from coords', () => {
    const { container } = render(<AauGameCard game={baseFinal} />);
    expect(container.textContent).toMatch(/Harry S\. Truman High School/);
    expect(container.textContent).toMatch(/Bronx, NY/);
    const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h.includes('google.com/maps') && h.includes('40.8741506'))).toBe(true);
    expect(hrefs.some((h) => h.startsWith('https://maps.apple.com/') && h.includes('40.8741506'))).toBe(true);
  });

  it('renders bracket / forfeit / court badges only when set', () => {
    const { container } = render(<AauGameCard game={{ ...baseFinal, isBracket: true, isForfeit: true }} />);
    expect(container.textContent).toMatch(/Bracket/);
    expect(container.textContent).toMatch(/Forfeit/);
    expect(container.textContent).toMatch(/Court 1/);
  });

  it('omits the score badge for a non-final game (no W/L)', () => {
    const { container } = render(<AauGameCard game={{ ...baseFinal, status: 'scheduled', myScore: null, oppScore: null }} />);
    expect(container.textContent).not.toMatch(/W\s*\d/);
    expect(container.textContent).not.toMatch(/L\s*\d/);
  });

  it('omits directions when the game has no venue', () => {
    const { container } = render(<AauGameCard game={{ ...baseFinal, venue: null }} />);
    expect(container.querySelector('a[href]')).toBeNull();
  });
});
