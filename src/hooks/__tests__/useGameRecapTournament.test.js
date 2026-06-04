// @vitest-environment jsdom
//
// useGameRecapTournament — extracted from BriefingComposer (P4). Locks the
// branching: no query off the game_recap/event/anchor happy path, and the
// stale-anchor guard (a lookup resolved for a prior anchor must not leak into
// the derived boolean after the anchor changes).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

let maybeSingleResult = { data: null };
const maybeSingleFn = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => { maybeSingleFn(); return Promise.resolve(maybeSingleResult); } }) }) }),
  },
}));

const { useGameRecapTournament } = await import('../useGameRecapTournament');

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { maybeSingleResult = { data: null }; });

describe('useGameRecapTournament', () => {
  it('a. returns false and does not query when kind is not game_recap', () => {
    const { result } = renderHook(() => useGameRecapTournament({ kind: 'weekly_digest', anchor_kind: 'event', anchor_id: 'e1' }));
    expect(result.current).toBe(false);
    expect(maybeSingleFn).not.toHaveBeenCalled();
  });

  it('b. returns false and does not query when anchor_id is missing', () => {
    const { result } = renderHook(() => useGameRecapTournament({ kind: 'game_recap', anchor_kind: 'event', anchor_id: null }));
    expect(result.current).toBe(false);
    expect(maybeSingleFn).not.toHaveBeenCalled();
  });

  it('c. returns true once the lookup resolves with a parent tournament', async () => {
    maybeSingleResult = { data: { tournament_id: 't-9' } };
    const { result } = renderHook(() => useGameRecapTournament({ kind: 'game_recap', anchor_kind: 'event', anchor_id: 'e1' }));
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('d. stays false when the event has no parent tournament', async () => {
    maybeSingleResult = { data: { tournament_id: null } };
    const { result } = renderHook(() => useGameRecapTournament({ kind: 'game_recap', anchor_kind: 'event', anchor_id: 'e1' }));
    await waitFor(() => expect(maybeSingleFn).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it('e. stale-anchor guard: a lookup resolved for a prior anchor does not apply after the anchor changes', async () => {
    maybeSingleResult = { data: { tournament_id: 't-9' } };
    const { result, rerender } = renderHook(({ s }) => useGameRecapTournament(s), {
      initialProps: { s: { kind: 'game_recap', anchor_kind: 'event', anchor_id: 'e1' } },
    });
    await waitFor(() => expect(result.current).toBe(true));
    // Anchor changes to e2; the stored lookup still carries anchorId 'e1', so the
    // derived boolean must read false until the new lookup resolves.
    rerender({ s: { kind: 'game_recap', anchor_kind: 'event', anchor_id: 'e2' } });
    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
  });
});
