// Sections L99 audit P0-2 regression: editing an event with volunteer slots
// must NOT duplicate event_duties on re-save, and must never delete a
// CLAIMED slot. reconcileEventDuties diffs desired vs existing.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = { existing: [], deleted: [], inserted: [] };

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: state.existing, error: null }) }),
      delete: () => ({ in: (_col, ids) => { state.deleted.push(...ids); return Promise.resolve({ error: null }); } }),
      insert: (rows) => { state.inserted.push(...rows); return Promise.resolve({ error: null }); },
    }),
  },
}));

import { reconcileEventDuties } from '../dutyReconcile';

beforeEach(() => { state.existing = []; state.deleted = []; state.inserted = []; });
afterEach(() => vi.clearAllMocks());

const unclaimed = (id, name) => ({ id, duty_name: name, claimed_by_name: null, guardian_id: null });

describe('reconcileEventDuties', () => {
  it('re-saving identical duties is idempotent — no duplication (the P0-2 bug)', async () => {
    state.existing = [unclaimed('a', 'Scorekeeper'), unclaimed('b', 'Scorekeeper')];
    await reconcileEventDuties('e1', [{ duty_name: 'Scorekeeper', slots_needed: 2 }]);
    expect(state.inserted).toEqual([]);
    expect(state.deleted).toEqual([]);
  });

  it('increasing slots inserts only the delta', async () => {
    state.existing = [unclaimed('a', 'Scorekeeper')];
    await reconcileEventDuties('e1', [{ duty_name: 'Scorekeeper', slots_needed: 3 }]);
    expect(state.inserted).toHaveLength(2);
    expect(state.inserted.every((r) => r.event_id === 'e1' && r.duty_name === 'Scorekeeper')).toBe(true);
    expect(state.deleted).toEqual([]);
  });

  it('decreasing slots deletes only unclaimed rows, never a claimed one', async () => {
    state.existing = [
      { id: 'a', duty_name: 'Scorekeeper', claimed_by_name: 'Mom', guardian_id: null },
      unclaimed('b', 'Scorekeeper'),
    ];
    await reconcileEventDuties('e1', [{ duty_name: 'Scorekeeper', slots_needed: 1 }]);
    expect(state.deleted).toEqual(['b']);
    expect(state.inserted).toEqual([]);
  });

  it('removing a duty entirely deletes its rows', async () => {
    state.existing = [unclaimed('a', 'Scorekeeper'), unclaimed('c', 'Clock')];
    await reconcileEventDuties('e1', [{ duty_name: 'Scorekeeper', slots_needed: 1 }]);
    expect(state.deleted).toEqual(['c']);
    expect(state.inserted).toEqual([]);
  });

  it('a claimed slot below the requested count is preserved (claim floor)', async () => {
    state.existing = [{ id: 'a', duty_name: 'Scorekeeper', claimed_by_name: null, guardian_id: 'g1' }];
    await reconcileEventDuties('e1', [{ duty_name: 'Scorekeeper', slots_needed: 0 }]);
    expect(state.deleted).toEqual([]);
    expect(state.inserted).toEqual([]);
  });
});
