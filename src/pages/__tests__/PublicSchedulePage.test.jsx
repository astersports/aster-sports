// @vitest-environment jsdom
//
// P0 lane STEP 5b (2026-06-12) — public-page regression locks.
//
// Locks the two halves of the XS-1/DB-2 incident:
//  1. A failed events/teams fetch renders the error strip — NEVER the
//     "No upcoming events scheduled." false-empty that hid the 42703 for
//     two weeks (AP #36 swallowed-error shape).
//  2. The success path renders the venue from the aliased
//     `location_name:location` select (the events table has no
//     location_name column).

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const state = {
  teamRes: { data: null, error: null },
  eventsRes: { data: [], error: null },
  rpcRes: { data: [], error: null },
};

function thenable(result) {
  const chain = {};
  const self = () => chain;
  for (const m of ['select', 'eq', 'neq', 'gte', 'order', 'limit']) chain[m] = self;
  chain.maybeSingle = () => Promise.resolve(state.teamRes);
  chain.then = (resolve) => Promise.resolve(result()).then(resolve);
  return chain;
}

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table) => thenable(() => (table === 'teams' ? state.teamRes : state.eventsRes)),
    rpc: () => Promise.resolve(state.rpcRes),
  },
}));
vi.mock('../../components/shared/SubscribeSheet', () => ({ default: () => null }));
vi.mock('../../components/shared/ShareScheduleButton', () => ({ default: () => null }));
vi.mock('../../lib/icalHelpers', () => ({ downloadTeamIcs: vi.fn() }));

import PublicSchedulePage from '../PublicSchedulePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/schedule/team-1']}>
      <Routes>
        <Route path="/schedule/:teamId" element={<PublicSchedulePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  state.teamRes = { data: { id: 'team-1', name: '10U Black', team_color: '#4a8fd4', org_id: 'org-1' }, error: null };
  state.eventsRes = { data: [], error: null };
  state.rpcRes = { data: [{ feed_token: 'tok-1', org_display_name: 'Aster AAU' }], error: null };
});

describe('PublicSchedulePage (P0 STEP 5b locks)', () => {
  it('renders the error strip — not the false empty state — when the events fetch fails', async () => {
    state.eventsRes = { data: null, error: { message: 'column events.location_name does not exist' } };
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Couldn.t load this schedule/i)).toBeTruthy();
    });
    expect(screen.queryByText(/No upcoming events scheduled/i)).toBeNull();
    expect(screen.queryByText(/Team not found/i)).toBeNull();
  });

  it('renders events with the venue from the aliased location field on success', async () => {
    state.eventsRes = {
      data: [{
        id: 'e1', title: null, event_type: 'practice',
        start_at: '2026-06-14T13:00:00Z', end_at: '2026-06-14T14:30:00Z',
        opponent: null, location_name: 'WCC Gym 2', status: 'scheduled',
      }],
      error: null,
    };
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('10U Black')).toBeTruthy();
    });
    expect(screen.getByText('WCC Gym 2')).toBeTruthy();
    expect(screen.getByText('Aster AAU')).toBeTruthy();
    expect(screen.queryByText(/No upcoming events scheduled/i)).toBeNull();
  });
});
