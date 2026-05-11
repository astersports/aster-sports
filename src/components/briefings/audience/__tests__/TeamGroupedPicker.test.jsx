// @vitest-environment jsdom
//
// Wave 4.4-B Session 5d-b-1 — TeamGroupedPicker component test.
// 6 assertions covering bucket render, search filter, single/multi
// select, select-all-by-bucket, and group-axis switch.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamGroupedPicker from '../TeamGroupedPicker';

afterEach(cleanup);

// Live LH 5-team data from 5d-a Supabase MCP audit.
const LH_TEAMS = [
  { id: 't-11g', name: '11U Girls', age_group: '11U', division: null,    circuit: 'aau',         sort_order: 1, team_color: '#7C3AED' },
  { id: 't-10b', name: '10U Black', age_group: '10U', division: 'Black', circuit: 'aau',         sort_order: 2, team_color: '#18181B' },
  { id: 't-10u', name: '10U Blue',  age_group: '10U', division: 'Blue',  circuit: 'league_play', sort_order: 3, team_color: '#2563EB' },
  { id: 't-9b',  name: '9U Boys',   age_group: '9U',  division: null,    circuit: 'league_play', sort_order: 4, team_color: '#DC2626' },
  { id: 't-8b',  name: '8U Boys',   age_group: '8U',  division: null,    circuit: 'aau',         sort_order: 5, team_color: '#EA580C' },
];

describe('TeamGroupedPicker', () => {
  it('a. renders 5 chips under age_group default with 4 bucket headers (11U/10U/9U/8U)', () => {
    render(<TeamGroupedPicker teams={LH_TEAMS} value={[]} onChange={() => {}} mode="team" />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
    expect(screen.getByText('11U')).toBeInTheDocument();
    expect(screen.getByText('10U')).toBeInTheDocument();
    expect(screen.getByText('9U')).toBeInTheDocument();
    expect(screen.getByText('8U')).toBeInTheDocument();
  });

  it('b. search filters chips case-insensitively by name', async () => {
    const user = userEvent.setup();
    render(<TeamGroupedPicker teams={LH_TEAMS} value={[]} onChange={() => {}} mode="team" />);
    await user.type(screen.getByLabelText('Search teams'), 'GIRLS');
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getByText('11U Girls')).toBeInTheDocument();
  });

  it('c. mode=team — clicking unselected chip fires onChange with [chipId]', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TeamGroupedPicker teams={LH_TEAMS} value={[]} onChange={onChange} mode="team" />);
    await user.click(screen.getByText('11U Girls'));
    expect(onChange).toHaveBeenCalledWith(['t-11g']);
  });

  it('d. mode=multi_team — toggle adds then removes on second click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<TeamGroupedPicker teams={LH_TEAMS} value={[]} onChange={onChange} mode="multi_team" />);
    await user.click(screen.getByText('11U Girls'));
    expect(onChange).toHaveBeenLastCalledWith(['t-11g']);
    rerender(<TeamGroupedPicker teams={LH_TEAMS} value={['t-11g']} onChange={onChange} mode="multi_team" />);
    await user.click(screen.getByText('11U Girls'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('e. "Select all" in multi_team toggles all chips in a bucket', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TeamGroupedPicker teams={LH_TEAMS} value={[]} onChange={onChange} mode="multi_team" />);
    // 10U bucket contains t-10b + t-10u
    const tenU = screen.getByText('10U').closest('[data-bucket]');
    const selectAll = within(tenU).getByRole('button', { name: /Select all 10U/i });
    await user.click(selectAll);
    expect(onChange).toHaveBeenCalledWith(['t-10b', 't-10u']);
  });

  it('f. switching axis age_group → circuit re-buckets into 2 buckets (aau, league_play)', async () => {
    const user = userEvent.setup();
    render(<TeamGroupedPicker teams={LH_TEAMS} value={[]} onChange={() => {}} mode="team" />);
    await user.click(screen.getByRole('tab', { name: /Circuit/i }));
    expect(screen.getByText('aau')).toBeInTheDocument();
    expect(screen.getByText('league_play')).toBeInTheDocument();
    // age-group buckets gone
    expect(screen.queryByText('11U')).not.toBeInTheDocument();
  });
});
