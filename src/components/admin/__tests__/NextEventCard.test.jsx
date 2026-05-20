// @vitest-environment jsdom
//
// NextEventCard — renders the next-event hero used by admin, coach, and
// (as of 2026-05-20) parent home pages. Frank flagged parent home was
// missing the countdown hero that admin/coach had — same component now
// renders across all three surfaces.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import NextEventCard from '../NextEventCard';

vi.mock('../../../hooks/useNow', () => ({ useNow: () => Date.now() }));

afterEach(cleanup);

const inHours = (h) => new Date(Date.now() + h * 60 * 60 * 1000).toISOString();

describe('NextEventCard', () => {
  it('renders title, team name, date/time, and a live countdown', () => {
    const event = {
      id: 'e1', start_at: inHours(8),
      event_type: 'game', opponent: 'Holy Family-NR 4AB',
      location: 'CYO Spellman', teams: { name: '10U Blue' },
    };
    const { container } = render(<NextEventCard event={event} weather={{ icon: '☁', temp: 64 }} />);
    expect(container.textContent).toMatch(/10U Blue/);
    expect(container.textContent).toMatch(/CYO Spellman/);
    expect(container.textContent).toMatch(/64°/);
    // Countdown chip uses tabular-nums; just assert SOME h-m-s pattern.
    expect(container.textContent).toMatch(/\d+h \d+m/);
  });

  it('renders null when event is missing (parent home with no upcoming events)', () => {
    const { container } = render(<NextEventCard event={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles event with no team gracefully (no crash)', () => {
    const event = { id: 'e2', start_at: inHours(2), event_type: 'practice', teams: null };
    const { container } = render(<NextEventCard event={event} />);
    expect(container.firstChild).not.toBeNull();
  });
});
