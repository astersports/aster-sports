// @vitest-environment jsdom
//
// SD-5 / SD-8 / VF-12b gate (SCHEDULE_L99_BUILD_SPEC §8 PR-C'):
// WeekStrip is ABSENT in Games mode. Pre-fix it rendered above the
// viewMode branch — mounted but dead (day taps scrolled a list that
// wasn't on screen).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/useScheduleData', () => ({
  useScheduleData: () => ({
    orgId: 'org-1', role: 'admin', activities: [], loading: false, error: null,
    refetch: () => {}, counts: {}, rideCounts: {}, dutyCounts: {}, gameResults: {},
    childRsvpMap: {}, activatedMap: {}, commitments: {}, countSuppressedByTeam: {},
    onRsvpSaved: () => {},
  }),
}));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ orgId: 'org-1', role: 'admin', myChildren: [] }),
}));
vi.mock('../../hooks/useDensity', () => ({ useDensity: () => ({ density: 'minimal' }) }));
vi.mock('../../hooks/usePreferences', () => ({ usePreferences: () => ({ preferences: null, updatePreference: () => Promise.resolve() }) }));
vi.mock('../../hooks/useWeather', () => ({ useWeather: () => null, getWeatherForTime: () => null }));
vi.mock('../../hooks/useRefetchOnVisible', () => ({ useRefetchOnVisible: () => {} }));
vi.mock('../../components/schedule/WeekStrip', () => ({ default: () => <div data-testid="week-strip" /> }));
vi.mock('../../components/schedule/GamesView', () => ({ default: () => <div data-testid="games-view" /> }));
vi.mock('../../components/schedule/ScheduleListSections', () => ({ default: () => <div data-testid="list-sections" /> }));

const viewToggle = vi.hoisted(() => ({ onChange: null }));
vi.mock('../../components/schedule/ViewToggle', () => ({
  default: ({ value, onChange }) => { viewToggle.onChange = onChange; return <div data-testid="view-toggle" data-mode={value} />; },
}));

import SchedulePage from '../SchedulePage';
import { act } from 'react';

afterEach(cleanup);

describe('SchedulePage — WeekStrip absent in Games mode (VF-12b)', () => {
  it('list mode renders the strip; games mode removes it', async () => {
    const { queryAllByTestId } = render(<MemoryRouter><SchedulePage /></MemoryRouter>);
    expect(queryAllByTestId('week-strip')).toHaveLength(1);
    expect(queryAllByTestId('games-view')).toHaveLength(0);

    await act(async () => { viewToggle.onChange('games'); });
    expect(queryAllByTestId('week-strip')).toHaveLength(0);
    expect(queryAllByTestId('games-view')).toHaveLength(1);

    await act(async () => { viewToggle.onChange('all'); });
    expect(queryAllByTestId('week-strip')).toHaveLength(1);
  });
});
