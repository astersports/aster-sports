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

  it('arrival line (#3): parent-gated via `arrival`; 15 min + "· game day" for games, 5 min for practices', () => {
    const game = render(<NextEventCard event={{ id: 'g', start_at: inHours(8), event_type: 'game', teams: { name: '10U Blue' } }} arrival />);
    expect(game.container.textContent).toMatch(/Arrive 15 minutes early · game day/);
    cleanup();
    const practice = render(<NextEventCard event={{ id: 'p', start_at: inHours(8), event_type: 'practice', teams: { name: '10U Blue' } }} arrival />);
    expect(practice.container.textContent).toMatch(/Arrive 5 minutes early/);
    expect(practice.container.textContent).not.toMatch(/game day/);
    cleanup();
    // admin/coach: no `arrival` prop → no line
    const none = render(<NextEventCard event={{ id: 'n', start_at: inHours(8), event_type: 'game', teams: { name: '10U Blue' } }} />);
    expect(none.container.textContent).not.toMatch(/Arrive/);
  });

  it('draft pill (#2): renders "May reschedule · draft" only when draft is true', () => {
    const event = { id: 't', start_at: inHours(48), event_type: 'tournament', teams: { name: '11U Girls' } };
    const on = render(<NextEventCard event={event} draft />);
    expect(on.container.textContent).toMatch(/May reschedule · draft/);
    cleanup();
    const off = render(<NextEventCard event={event} draft={false} />);
    expect(off.container.textContent).not.toMatch(/reschedule/);
  });

  it('team-color left rail: the event card edges in the team color', () => {
    const { container } = render(<NextEventCard event={{ id: 'c', start_at: inHours(8), event_type: 'game', teams: { name: '10U Blue', team_color: '#4a8fd4' } }} />);
    // jsdom normalizes the hex to rgb()
    expect(container.firstChild.style.borderLeft).toBe('3px solid rgb(74, 143, 212)');
  });
});
