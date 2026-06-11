// @vitest-environment jsdom
//
// AP#43 cross-surface invariant: the parent "My Family" surface AND the Home
// "Open for registration · For <kids>" lane (both fed by useFamilyPrograms)
// must show ONLY the parent's OWN children — never teammates.
//
// Origin (P0 privacy bug, 2026-06-11): the hook read `.from('players')`
// unfiltered, trusting the players RLS to return own kids. But players RLS
// ORs in `players_select_parent_team` (teammate visibility for roster lists),
// so a parent saw all 48 teammate-visible kids as "my family" + in the
// registration lane. Fix: scope to own children via player_guardians
// (RLS-scoped to current_user_guardian_id()). This test pins that scope: the
// `players` dataset includes a teammate, and the hook must NOT surface it.

import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ orgId: 'o' }) }));

// players RLS would return own kids UNION teammates — model that: k1/k2 own,
// tX a teammate. player_guardians is own-scoped (k1/k2 only), the safe source.
const datasets = {
  player_guardians: [{ player_id: 'k1' }, { player_id: 'k2' }],
  players: [
    { id: 'k1', first_name: 'Milo', last_name: 'S', grade: 3 },
    { id: 'k2', first_name: 'Charlie', last_name: 'S', grade: 5 },
    { id: 'tX', first_name: 'Teammate', last_name: 'Z', grade: 3 },
  ],
  roster_members: [],
  registrations: [],
  family_balances: [],
  programs: [],
  teams: [],
};

function makeBuilder(rows) {
  let data = [...rows];
  const b = {
    select: () => b,
    eq: (col, val) => { data = data.filter((r) => r[col] === val); return b; },
    neq: (col, val) => { data = data.filter((r) => r[col] !== val); return b; },
    is: (col, val) => { data = data.filter((r) => (val === null ? r[col] == null : r[col] === val)); return b; },
    in: (col, vals) => { const s = new Set(vals); data = data.filter((r) => s.has(r[col])); return b; },
    order: () => b,
    then: (resolve) => Promise.resolve({ data, error: null }).then(resolve),
  };
  return b;
}

vi.mock('../../lib/supabase', () => ({
  supabase: { from: (t) => makeBuilder(datasets[t] || []) },
}));

const { useFamilyPrograms } = await import('../useFamilyPrograms');

describe('useFamilyPrograms — own-children scope (P0 privacy invariant)', () => {
  it('surfaces only the parent\'s own children, never teammates', async () => {
    const { result } = renderHook(() => useFamilyPrograms());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const children = result.current.data?.children || [];
    const ids = children.map((c) => c.id).sort();
    expect(ids).toEqual(['k1', 'k2']);              // own kids only
    expect(ids).not.toContain('tX');                // teammate must NOT leak
    expect(children.map((c) => c.firstName).sort()).toEqual(['Charlie', 'Milo']);
  });
});
