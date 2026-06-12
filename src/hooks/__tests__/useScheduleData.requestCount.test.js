// @vitest-environment jsdom
//
// VF-11 HARD LOCK (SCHEDULE_L99_BUILD_SPEC §2 + §8): the schedule batch
// hook issues a CONSTANT number of requests regardless of list length.
// Always-on RSVP (PR-B') ungates over this hook — if per-row fetches
// creep back in, every parent detonates a 47–92-request N+1. The §8
// acceptance gate: request count for a 3-event list === request count
// for a 30-event list.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { useScheduleData } from '../useScheduleData';

// Stable references — an inline-object mock regenerates myTeamIds/user
// per render, which destabilizes useActivities' refetch identity and
// loops the effect (the very class this test guards against).
const h = vi.hoisted(() => ({
  fromCalls: [], eventsData: [], orgId: 'org-a',
  user: { id: 'u-1' },
  myChildren: [{ playerId: 'p-1', teamId: 't-1', teamIds: ['t-1'] }],
  myTeamIds: ['t-1'],
}));

vi.mock('../../lib/supabase', () => {
  const makeQuery = (table) => {
    const result = () => ({ data: table === 'events' ? h.eventsData.slice() : [], error: null });
    const q = {};
    ['select', 'eq', 'in', 'order', 'is', 'not'].forEach((m) => { q[m] = () => q; });
    q.maybeSingle = () => Promise.resolve({ data: null, error: null });
    q.then = (res, rej) => Promise.resolve(result()).then(res, rej);
    return q;
  };
  return { supabase: { from: (t) => { h.fromCalls.push(t); return makeQuery(t); } } };
});
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ orgId: h.orgId, role: 'parent', guardianId: 'g-1', user: h.user, myChildren: h.myChildren, myTeamIds: h.myTeamIds }),
}));
vi.mock('../../context/SeasonContext', () => ({
  useSeason: () => ({ activeSeason: { id: 's-1' } }),
}));

afterEach(cleanup);

const makeEvents = (n) => Array.from({ length: n }, (_, i) => ({
  id: `e-${i}`, team_id: 't-1', event_type: 'practice', status: 'scheduled',
  start_at: new Date(Date.now() + (i + 1) * 3600000).toISOString(),
  teams: { id: 't-1', org_id: h.orgId, season_id: 's-1', name: '10U Blue', roster_visibility_override: null },
}));

async function requestCountFor(n, orgId) {
  h.fromCalls.length = 0;
  h.eventsData = makeEvents(n);
  h.orgId = orgId; // distinct org busts the useActivities module cache between runs
  const { result, unmount } = renderHook(() => useScheduleData());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await waitFor(() => expect(result.current.activities.length).toBe(n));
  // 'programs' is the last query in the composed batch — once seen, the
  // full constant set has been issued for this cycle.
  await waitFor(() => expect(h.fromCalls).toContain('programs'));
  const count = h.fromCalls.length;
  unmount();
  return count;
}

describe('useScheduleData — request count does not scale with list length (VF-11)', () => {
  it('3-event list and 30-event list issue the same number of requests', async () => {
    const small = await requestCountFor(3, 'org-a');
    const large = await requestCountFor(30, 'org-b');
    expect(small).toBeGreaterThan(0);
    expect(large).toBe(small);
  });
});
