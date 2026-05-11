// @vitest-environment jsdom
//
// Wave 4.4-B Session 5d-b-2 — RecentAndFavorites component test.
// Mocks the three hooks (useRecentAudiences, useFavoriteAudiences,
// useOrgTeams) to assert chip render, click-to-apply, star toggle,
// X toggle, and empty-state behavior.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const recentsRef = { current: [] };
const favoritesRef = { current: [] };
const addFn = vi.fn();
const removeFn = vi.fn();

vi.mock('../../../../hooks/useRecentAudiences', () => ({
  useRecentAudiences: () => ({ recents: recentsRef.current, loading: false }),
}));
vi.mock('../../../../hooks/useFavoriteAudiences', () => ({
  useFavoriteAudiences: () => ({ favorites: favoritesRef.current, loading: false, add: addFn, remove: removeFn }),
}));
vi.mock('../../../../hooks/useOrgTeams', () => ({
  useOrgTeams: () => ({ teams: [
    { id: 't-10b', name: '10U Black', sort_order: 2 },
    { id: 't-11g', name: '11U Girls', sort_order: 1 },
  ], loading: false }),
}));

const { default: RecentAndFavorites } = await import('../RecentAndFavorites');

afterEach(() => {
  cleanup();
  recentsRef.current = []; favoritesRef.current = [];
  addFn.mockReset(); removeFn.mockReset();
});

describe('RecentAndFavorites', () => {
  it('a. renders RECENT header + 3 chips when recents has 3 entries', () => {
    recentsRef.current = [
      { audience_type: 'org_all', audience_filter: null, last_sent: '2026-05-11T22:01Z' },
      { audience_type: 'team', audience_filter: { team_ids: ['t-10b'] }, last_sent: '2026-05-11T21:46Z' },
      { audience_type: 'team', audience_filter: { team_ids: ['t-11g'] }, last_sent: '2026-05-11T20:00Z' },
    ];
    render(<RecentAndFavorites onApply={() => {}} />);
    expect(screen.getByText(/Recent/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('recent-chip-body')).toHaveLength(3);
    expect(screen.getByText('All families')).toBeInTheDocument();
    expect(screen.getByText('10U Black')).toBeInTheDocument();
    expect(screen.getByText('11U Girls')).toBeInTheDocument();
  });

  it('b. renders nothing when both recents and favorites are empty', () => {
    recentsRef.current = []; favoritesRef.current = [];
    const { container } = render(<RecentAndFavorites onApply={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('c. clicking a recent chip body fires onApply with audience_type + audience_filter', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    recentsRef.current = [{ audience_type: 'team', audience_filter: { team_ids: ['t-10b'] }, last_sent: '2026-05-11T21:46Z' }];
    render(<RecentAndFavorites onApply={onApply} />);
    await user.click(screen.getByTestId('recent-chip-body'));
    expect(onApply).toHaveBeenCalledWith('team', { team_ids: ['t-10b'] });
  });

  it('d. clicking the star on a non-favorited recent calls add()', async () => {
    const user = userEvent.setup();
    recentsRef.current = [{ audience_type: 'team', audience_filter: { team_ids: ['t-10b'] }, last_sent: '2026-05-11T21:46Z' }];
    favoritesRef.current = [];
    render(<RecentAndFavorites onApply={() => {}} />);
    await user.click(screen.getByTestId('recent-star'));
    expect(addFn).toHaveBeenCalledWith('team', { team_ids: ['t-10b'] }, '10U Black');
    expect(removeFn).not.toHaveBeenCalled();
  });

  it('e. clicking the X on a favorite chip calls remove() with the id', async () => {
    const user = userEvent.setup();
    favoritesRef.current = [
      { id: 'f-1', label: 'My team', audience_type: 'team', audience_filter: { team_ids: ['t-10b'] } },
    ];
    render(<RecentAndFavorites onApply={() => {}} />);
    const favStrip = screen.getByTestId('favorites-strip');
    const x = within(favStrip).getByTestId('favorite-x');
    await user.click(x);
    expect(removeFn).toHaveBeenCalledWith('f-1');
  });
});
