// @vitest-environment jsdom
//
// Cross-surface invariant test per CLAUDE.md anti-pattern #43 +
// the schedule review-process item (1) recommended 2026-05-20.
//
// MatchupCard renders both upcoming and past states in the Games view.
// Frank-reported 2026-05-20: past-state cards visibly taller than
// upcoming-state cards even after PR #351 matched the result score
// font to the upcoming time font (17px). Root cause: opponent column
// rendered a 2-line stack (opponent on top, date below) in past state
// versus a single-line "vs Opp" in upcoming state.
//
// PR #358 follow-up inlined the date next to the opponent on a single
// row. This test locks the invariant so a future refactor can't
// silently re-stack the date.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MatchupCard from '../MatchupCard';

afterEach(cleanup);

const TEAM = { id: 't-10b', name: '10U Black', team_color: '#4a8fd4' };
const FUTURE_EVENT = {
  id: 'e1', start_at: '2099-12-31T20:00:00Z',
  opponent: 'Sample Opp', home_away: 'home', status: 'scheduled', teams: TEAM,
};
const PAST_EVENT = {
  id: 'e2', start_at: '2020-01-15T20:00:00Z',
  opponent: 'Sample Opp', home_away: 'home', status: 'scheduled', teams: TEAM,
};
const PAST_RESULT = {
  result: 'W', our_score: 50, opponent_score: 30,
  published_at: '2020-01-16T00:00:00Z',
};

function renderInRouter(jsx) {
  return render(<MemoryRouter>{jsx}</MemoryRouter>);
}

describe('MatchupCard row-rhythm invariant (anti-pattern #43)', () => {
  it('upcoming + past both render their primary signal at fontSize 17px', () => {
    const upcoming = renderInRouter(<MatchupCard event={FUTURE_EVENT} />);
    // Time is class="font-bold" with explicit fontSize 17.
    const time = upcoming.container.querySelector('.font-bold');
    expect(time).not.toBeNull();
    expect(time.style.fontSize).toBe('17px');
    cleanup();

    const past = renderInRouter(<MatchupCard event={PAST_EVENT} gameResult={PAST_RESULT} />);
    // After PR #351 the W/L letter renders at fontSize 17 — locked here.
    const wLetter = Array.from(past.container.querySelectorAll('span'))
      .find((el) => el.textContent === 'W');
    expect(wLetter).not.toBeNull();
    expect(wLetter.style.fontSize).toBe('17px');
  });

  it('past-state opponent column inlines the date (no nested block for two-line stack)', () => {
    const { container } = renderInRouter(<MatchupCard event={PAST_EVENT} gameResult={PAST_RESULT} />);
    // Both pieces of content render.
    expect(container.textContent).toContain('Sample Opp');
    expect(container.textContent).toContain('Jan 15');

    // The opponent + date should be siblings inside a flex row container
    // — not a div-wrapped two-line stack. Locate the flex row by its
    // distinctive style and confirm both pieces of content appear inside
    // the SAME container (not the date in a separate child div).
    const flexRow = container.querySelector('div[style*="flex-wrap: wrap"]');
    expect(flexRow).not.toBeNull();
    expect(flexRow.textContent).toContain('Sample Opp');
    expect(flexRow.textContent).toContain('Jan 15');
    // No nested div inside the flex row (regression guard against the
    // old layout where the date sat in <div>{date}</div> on a new line).
    expect(flexRow.querySelectorAll('div').length).toBe(0);
  });

  it('upcoming and past render the team name at the same fontSize (15px)', () => {
    const upcoming = renderInRouter(<MatchupCard event={FUTURE_EVENT} />);
    const upcomingTeam = Array.from(upcoming.container.querySelectorAll('span'))
      .find((el) => el.textContent === '10U Black');
    expect(upcomingTeam).not.toBeNull();
    expect(upcomingTeam.style.fontSize).toBe('15px');
    cleanup();

    const past = renderInRouter(<MatchupCard event={PAST_EVENT} gameResult={PAST_RESULT} />);
    const pastTeam = Array.from(past.container.querySelectorAll('span'))
      .find((el) => el.textContent === '10U Black');
    expect(pastTeam).not.toBeNull();
    expect(pastTeam.style.fontSize).toBe('15px');
  });
});
