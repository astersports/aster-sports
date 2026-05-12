// @vitest-environment jsdom
//
// Wave 4.8 6b Session 1 — useAnchorDraftStatus contract.
// Mock pattern mirrors useOrgTeams.test.js (PR #103 RTL infra). The
// hook chains .from().select().eq().eq().eq().eq().order() — leaf()
// returns a chainable that resolves at .order() with resolveData.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

let resolveData = { data: [], error: null };

function leaf() {
  return {
    eq: () => leaf(),
    order: () => Promise.resolve(resolveData),
  };
}

vi.mock('../../lib/supabase', () => ({
  supabase: { from: () => ({ select: () => leaf() }) },
}));

const { useAnchorDraftStatus } = await import('../useAnchorDraftStatus');

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { resolveData = { data: [], error: null }; });

const args = { orgId: 'org-1', anchorKind: 'event', anchorId: 'evt-1', kind: 'game_recap' };

// The hook flips isLoading true→false asynchronously; assertions wait on
// the final data shape (which is what callers actually consume) rather
// than the isLoading transition.
describe('useAnchorDraftStatus', () => {
  it('a. returns hasDraft:false + hasSent:false when no rows', async () => {
    const { result } = renderHook(() => useAnchorDraftStatus(args));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Empty result is the initial state too — assert all 4 fields are right.
    expect(result.current.hasDraft).toBe(false);
    expect(result.current.draftId).toBe(null);
    expect(result.current.hasSent).toBe(false);
    expect(result.current.sentAt).toBe(null);
  });

  it('b. returns hasDraft:true + draftId when a draft row exists', async () => {
    resolveData = { data: [{ id: 'm-1', status: 'draft', sent_at: null }], error: null };
    const { result } = renderHook(() => useAnchorDraftStatus(args));
    await waitFor(() => expect(result.current.hasDraft).toBe(true));
    expect(result.current.draftId).toBe('m-1');
    expect(result.current.hasSent).toBe(false);
  });

  it('c. returns hasSent:true + max(sent_at) when sent rows exist', async () => {
    resolveData = { data: [
      { id: 'm-2', status: 'sent', sent_at: '2026-05-10T12:00:00Z' },
      { id: 'm-3', status: 'sent', sent_at: '2026-05-11T15:00:00Z' },
    ], error: null };
    const { result } = renderHook(() => useAnchorDraftStatus(args));
    await waitFor(() => expect(result.current.hasSent).toBe(true));
    expect(result.current.sentAt).toBe('2026-05-11T15:00:00Z');
    expect(result.current.hasDraft).toBe(false);
  });

  it('d. resets to INITIAL when required args missing (no fetch)', async () => {
    const { result } = renderHook(() => useAnchorDraftStatus({ orgId: null }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasDraft).toBe(false);
    expect(result.current.hasSent).toBe(false);
  });
});
