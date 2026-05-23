// @vitest-environment jsdom
//
// §4.AI Option C PR A — useAvailableDrafts query shape lock.
// Asserts the hook fires the expected supabase chain (org_id first
// per AP #37, status='draft', last_edited_at >= NOW-7d, limit).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

const calls = [];

function makeChain(rows) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn((col, val) => { calls.push(['eq', col, val]); return chain; }),
    gte: vi.fn((col, val) => { calls.push(['gte', col, val]); return chain; }),
    order: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve({ data: rows, error: null })),
  };
  return chain;
}

let nextRows = [];
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => { calls.push(['from', table]); return makeChain(nextRows); }),
  },
}));

const { useAvailableDrafts } = await import('../useAvailableDrafts');

afterEach(() => {
  cleanup();
  calls.length = 0;
  nextRows = [];
});

describe('useAvailableDrafts', () => {
  it('1. no orgId → returns empty + loading false', async () => {
    const { result } = renderHook(() => useAvailableDrafts({ orgId: null }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.drafts).toEqual([]);
  });

  it('2. queries comms_messages with org_id first, status=draft, 7-day window', async () => {
    nextRows = [{ id: 'd1', kind: 'game_recap', subject: 'X', last_edited_at: new Date().toISOString() }];
    const { result } = renderHook(() => useAvailableDrafts({ orgId: 'org-1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(calls[0]).toEqual(['from', 'comms_messages']);
    expect(calls[1]).toEqual(['eq', 'org_id', 'org-1']); // AP #37 — org_id first
    expect(calls[2]).toEqual(['eq', 'status', 'draft']);
    expect(calls[3][0]).toBe('gte');
    expect(calls[3][1]).toBe('last_edited_at');
    expect(result.current.drafts).toHaveLength(1);
  });

  it('3. propagates error and returns empty drafts on failure', async () => {
    nextRows = null;
    // Inject error path
    const { result } = renderHook(() => useAvailableDrafts({ orgId: 'org-1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    // nextRows=null returns {data:null, error:null}; drafts stays []
    expect(result.current.drafts).toEqual([]);
  });
});
