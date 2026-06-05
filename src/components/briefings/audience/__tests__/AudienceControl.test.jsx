// @vitest-environment jsdom
//
// Audience one-control fix (item 1a) — AudienceControl render test.
// Asserts: the single chip shows the kind's default; "Change" opens a
// sheet listing ONLY the valid modes for the kind; the recipient preview
// stays visible; locked kinds render a disabled (no-Change) state with a
// reason. The Recent/Favorites + team hooks are mocked.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../../hooks/useRecentAudiences', () => ({
  useRecentAudiences: () => ({ recents: [], loading: false }),
}));
vi.mock('../../../../hooks/useFavoriteAudiences', () => ({
  useFavoriteAudiences: () => ({ favorites: [], loading: false, add: vi.fn(), remove: vi.fn() }),
}));
vi.mock('../../../../hooks/useOrgTeams', () => ({
  useOrgTeams: () => ({ teams: [
    { id: 't-10b', name: '10U Black', sort_order: 2 },
    { id: 't-11g', name: '11U Girls', sort_order: 1 },
  ], loading: false }),
}));

const { default: AudienceControl } = await import('../AudienceControl');

const base = {
  audienceType: 'org_all',
  audienceFilter: null,
  audience: { filtered: 12, total: 12, mode: 'standard', pilotModeOn: false },
  recipientsLoading: false,
  onPick: () => {},
};

afterEach(cleanup);

describe('AudienceControl — chip + recipient preview', () => {
  it('shows the smart-default chip label + recipient preview', () => {
    render(<AudienceControl {...base} kind="announcement" />);
    expect(screen.getByTestId('audience-chip')).toHaveTextContent('All families');
    expect(screen.getByTestId('audience-recipient-preview')).toHaveTextContent(/12 families/);
  });

  it('resolves team_ids to the team name on the chip', () => {
    render(<AudienceControl {...base} kind="announcement" audienceType="team" audienceFilter={{ team_ids: ['t-10b'] }} />);
    expect(screen.getByTestId('audience-chip')).toHaveTextContent('10U Black');
  });
});

describe('AudienceControl — Change sheet lists only valid modes', () => {
  it('announcement → team + All families only', async () => {
    const user = userEvent.setup();
    render(<AudienceControl {...base} kind="announcement" />);
    await user.click(screen.getByTestId('audience-change'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Send to Single team')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Send to All families')).toBeInTheDocument();
    // announcement excludes tournament/event/player modes
    expect(within(dialog).queryByLabelText('Send to Tournament')).toBeNull();
    expect(within(dialog).queryByLabelText('Send to Event RSVPs')).toBeNull();
    expect(within(dialog).queryByLabelText('Send to Specific player(s)')).toBeNull();
  });

  it('coach_roundup → Coach only is offered as the first option', async () => {
    const user = userEvent.setup();
    render(<AudienceControl {...base} kind="coach_roundup" audienceType="coach_self" />);
    await user.click(screen.getByTestId('audience-change'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Send to Coach only')).toBeInTheDocument();
  });

  it('picking a non-team mode applies it and closes the sheet', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<AudienceControl {...base} kind="announcement" onPick={onPick} />);
    await user.click(screen.getByTestId('audience-change'));
    await user.click(within(screen.getByRole('dialog')).getByLabelText('Send to All families'));
    expect(onPick).toHaveBeenCalledWith('org_all', null);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('AudienceControl — locked kinds', () => {
  it('games_recap renders a locked chip with a reason and no Change', () => {
    render(<AudienceControl {...base} kind="games_recap" audienceType="multi_event_attendees" />);
    expect(screen.getByTestId('audience-chip')).toHaveTextContent(/Selected games/i);
    expect(screen.getByTestId('audience-locked-reason')).toHaveTextContent(/games/i);
    expect(screen.queryByTestId('audience-change')).toBeNull();
  });

  it('schedule_change is locked to event attendees', () => {
    render(<AudienceControl {...base} kind="schedule_change" audienceType="event_attendees" />);
    expect(screen.getByTestId('audience-chip')).toHaveTextContent('Event RSVPs');
    expect(screen.queryByTestId('audience-change')).toBeNull();
  });
});
