// @vitest-environment jsdom
//
// AauTournamentCard — one row of the no-login Hub directory (R1·PR-A). The
// invariant worth locking (AP #46 / AP #43): date-only YYYY-MM-DD values from
// get_public_tournament_directory() must render in the parsed calendar day,
// NOT drift to the prior day via `new Date(ymd)` UTC-midnight parsing — the
// recurring timezone bug class (AP #43 timezone audit). Plus the meta line
// composition (circuit · states · division count) and missing-field grace.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import AauTournamentCard from '../AauTournamentCard';

afterEach(cleanup);

describe('AauTournamentCard', () => {
  it('renders name, date range, circuit, states, and division count', () => {
    const t = {
      id: 't1', name: 'Spring Showcase', circuit: 'Zero Gravity',
      states: ['NY', 'CT'], start_date: '2026-04-11', end_date: '2026-04-12',
      divisions: [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }],
    };
    const { container } = render(<AauTournamentCard tournament={t} />);
    expect(container.textContent).toMatch(/Spring Showcase/);
    expect(container.textContent).toMatch(/Apr 11 – Apr 12/);
    expect(container.textContent).toMatch(/Zero Gravity/);
    expect(container.textContent).toMatch(/NY, CT/);
    expect(container.textContent).toMatch(/3 divisions/);
  });

  it('date-only values render in the parsed day — no UTC-midnight drift (AP #43)', () => {
    // `new Date('2026-04-11')` is UTC midnight → Apr 10 in America/New_York.
    // The card must show Apr 11 regardless of the runner's timezone.
    const t = { id: 't2', name: 'Single Day', start_date: '2026-04-11', end_date: '2026-04-11' };
    const { container } = render(<AauTournamentCard tournament={t} />);
    expect(container.textContent).toMatch(/Apr 11/);
    expect(container.textContent).not.toMatch(/Apr 10/);
  });

  it('collapses an identical start/end to a single date (no range dash)', () => {
    const t = { id: 't3', name: 'One Day', start_date: '2026-05-03', end_date: '2026-05-03' };
    const { container } = render(<AauTournamentCard tournament={t} />);
    expect(container.textContent).toMatch(/May 3/);
    expect(container.textContent).not.toMatch(/–/);
  });

  it('handles missing dates, states, divisions, and circuit without crashing', () => {
    const { container } = render(<AauTournamentCard tournament={{ id: 't4', name: 'Bare' }} />);
    expect(container.textContent).toMatch(/Bare/);
    expect(container.textContent).toMatch(/Dates TBD/);
    // No meta line emitted when circuit/states/divisions are all absent.
    expect(container.textContent).not.toMatch(/·/);
  });

  it('singularizes "1 division" and falls back to a title for an unnamed tournament', () => {
    const t = { id: 't5', divisions: [{ id: 'd1' }], start_date: '2026-06-01', end_date: '2026-06-02' };
    const { container } = render(<AauTournamentCard tournament={t} />);
    expect(container.textContent).toMatch(/1 division\b/);
    expect(container.textContent).not.toMatch(/1 divisions/);
    expect(container.textContent).toMatch(/Untitled tournament/);
  });

  it('renders the meta line in the darker secondary token, not the AA-failing tertiary', () => {
    // WCAG AA: tertiary (#8896AB) is 3.8:1 and fails for text; the circuit ·
    // states · division-count meta must use secondary (#4A5568). Locks the
    // tournament-card half of the #1163 contrast fix (Copilot caught this card
    // was missed in the first pass).
    const t = {
      id: 't6', name: 'Contrast Check', circuit: 'Zero Gravity',
      states: ['NY'], divisions: [{ id: 'd1' }, { id: 'd2' }],
    };
    const { container } = render(<AauTournamentCard tournament={t} />);
    const meta = [...container.querySelectorAll('p')].find((p) => /Zero Gravity/.test(p.textContent));
    const style = meta?.getAttribute('style') || '';
    expect(style).toMatch(/--as-text-secondary/);
    expect(style).not.toMatch(/--as-text-tertiary/);
  });
});
