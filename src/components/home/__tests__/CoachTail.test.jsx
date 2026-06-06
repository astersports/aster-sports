// @vitest-environment jsdom
//
// CoachTail C-12 grouping (anti-pattern #46 — *Tail render guard) + the
// no-regression invariant for the single-program case. With one active
// program the tail renders FLAT (no per-program headers) byte-for-byte as
// before; with two+ it renders GROUPED under per-program sub-headers.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import CoachTail from '../CoachTail';

afterEach(cleanup);

const teams = [
  { id: 't-1', name: '10U Blue', team_color: '#4a8fd4' },
  { id: 't-2', name: '9U Boys', team_color: '#16a34a' },
];
const recordsByTeam = { 't-1': { record: '8-2' }, 't-2': { record: '5-5' } };
const noop = () => {};

describe('CoachTail — C-12 grouping', () => {
  it('renders FLAT (no per-program header) for a single active program — no-regression', () => {
    const programs = [{ id: 'pr-1', programType: 'season', name: 'Spring 2026', teamIds: ['t-1', 't-2'] }];
    const { container } = render(
      <CoachTail teams={teams} recordsByTeam={recordsByTeam} recordsLoading={false} onTeamClick={noop} offSeason={false} seasonLabel="Spring 2026" programs={programs} />,
    );
    expect(container.textContent).toMatch(/10U Blue/);
    expect(container.textContent).toMatch(/8-2/);
    expect(container.textContent).not.toMatch(/Spring 2026 · teams/);
  });

  it('renders GROUPED with per-program headers for two active programs', () => {
    const programs = [
      { id: 'pr-1', programType: 'season', name: 'Spring 2026', teamIds: ['t-1'] },
      { id: 'pr-2', programType: 'camp', name: 'Active Roster Lab', teamIds: ['t-2'] },
    ];
    const { container } = render(
      <CoachTail teams={teams} recordsByTeam={recordsByTeam} recordsLoading={false} onTeamClick={noop} offSeason={false} seasonLabel="Spring 2026" programs={programs} />,
    );
    expect(container.textContent).toMatch(/Spring 2026 · teams/);
    expect(container.textContent).toMatch(/Active Roster Lab · camp/);
    expect(container.textContent).toMatch(/10U Blue/);
    expect(container.textContent).toMatch(/9U Boys/);
  });

  it('renders FLAT season-wrap when off-season even across programs', () => {
    const programs = [
      { id: 'pr-1', programType: 'season', name: 'Spring 2026', teamIds: ['t-1'] },
      { id: 'pr-2', programType: 'camp', name: 'Active Roster Lab', teamIds: ['t-2'] },
    ];
    const { container } = render(
      <CoachTail teams={teams} recordsByTeam={recordsByTeam} recordsLoading={false} onTeamClick={noop} offSeason seasonLabel="Spring 2026" programs={programs} />,
    );
    expect(container.textContent).not.toMatch(/· camp/);
    expect(container.textContent).toMatch(/Season wrapped/);
  });

  it('returns null with no teams', () => {
    const { container } = render(<CoachTail teams={[]} recordsByTeam={{}} recordsLoading={false} onTeamClick={noop} offSeason={false} programs={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
