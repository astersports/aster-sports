// @vitest-environment jsdom
//
// useActivePrograms — the multi-program foundation (Phase 1). Mocks supabase +
// useAuth via vi.mock; exercises the hook via renderHook + waitFor. Locks the
// NO-REGRESSION invariant: with one active program the set has exactly one
// entry, resolving identically to the prior singular useSeason().activeSeason.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

let auth = { orgId: 'org-1', role: 'admin', myTeamIds: [] };
let programsData = { data: [], error: null };
let teamsData = { data: [], error: null };

// Thenable builder: every chain method returns the builder, and awaiting it at
// any point resolves to the table's mock result ({ data, error }).
function builder(result) {
  const b = {
    select: () => b,
    eq: () => b,
    in: () => b,
    then: (res, rej) => Promise.resolve(result).then(res, rej),
  };
  return b;
}

vi.mock('../../lib/supabase', () => ({
  supabase: { from: (table) => builder(table === 'programs' ? programsData : teamsData) },
}));

vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }));

const { useActivePrograms } = await import('../useActivePrograms');

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => {
  auth = { orgId: 'org-1', role: 'admin', myTeamIds: [] };
  programsData = { data: [], error: null };
  teamsData = { data: [], error: null };
});

describe('useActivePrograms', () => {
  it('a. returns ONE entry for the single-program case (no-regression)', async () => {
    programsData = { data: [
      { id: 'pr-1', name: 'Spring 2026', program_type: 'season', status: 'active', start_date: '2026-03-23', end_date: '2026-06-14' },
    ], error: null };
    teamsData = { data: [{ id: 't-1', season_id: 'pr-1' }, { id: 't-2', season_id: 'pr-1' }], error: null };
    const { result } = renderHook(() => useActivePrograms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.programs).toHaveLength(1);
    expect(result.current.programs[0]).toMatchObject({ id: 'pr-1', programType: 'season', name: 'Spring 2026', endDate: '2026-06-14' });
    expect(result.current.programs[0].teamIds).toEqual(['t-1', 't-2']);
    expect(result.current.teamIds).toEqual(['t-1', 't-2']);
  });

  it('b. scopes coach/parent to programs whose teams they touch (myTeamIds)', async () => {
    auth = { orgId: 'org-1', role: 'coach', myTeamIds: ['t-2'] };
    programsData = { data: [
      { id: 'pr-1', name: 'Spring 2026', program_type: 'season', status: 'active', start_date: 'a', end_date: 'b' },
      { id: 'pr-2', name: 'Active Roster Lab', program_type: 'camp', status: 'active', start_date: 'a', end_date: 'b' },
    ], error: null };
    teamsData = { data: [{ id: 't-1', season_id: 'pr-1' }, { id: 't-2', season_id: 'pr-2' }], error: null };
    const { result } = renderHook(() => useActivePrograms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.programs).toHaveLength(1);
    expect(result.current.programs[0].id).toBe('pr-2');
    expect(result.current.programs[0].teamIds).toEqual(['t-2']);
  });

  it('c. admin sees all active programs across types', async () => {
    programsData = { data: [
      { id: 'pr-1', name: 'Spring 2026', program_type: 'season', status: 'active', start_date: 'a', end_date: 'b' },
      { id: 'pr-2', name: 'Active Roster Lab', program_type: 'camp', status: 'active', start_date: 'a', end_date: 'b' },
    ], error: null };
    teamsData = { data: [{ id: 't-1', season_id: 'pr-1' }, { id: 't-2', season_id: 'pr-2' }], error: null };
    const { result } = renderHook(() => useActivePrograms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.programs.map((p) => p.id).sort()).toEqual(['pr-1', 'pr-2']);
  });

  it('d. returns empty + loading=false when orgId is null', async () => {
    auth = { orgId: null, role: 'admin', myTeamIds: [] };
    const { result } = renderHook(() => useActivePrograms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.programs).toEqual([]);
  });

  it('e. surfaces a query error as an empty set (AP#36 — not swallowed silently)', async () => {
    programsData = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useActivePrograms());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.programs).toEqual([]);
  });
});
