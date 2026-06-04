// @vitest-environment jsdom
//
// useAiDraft — conformance test for the AI-draft compose client hook
// (AIDRAFT_BUILD_SPEC §2b / P2). Mocks supabase.functions.invoke + useAuth.
// Asserts the hook shapes the REQUEST per the §1 contract (free-form vs
// auto-proposed), parses { body, card_summary, facts_used, warnings } into the
// returned shape, and exercises the error + loading paths. No UI mount.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

let orgIdValue = 'org-1';
let invokeResult = { data: null, error: null };
const invokeFn = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...a) => { invokeFn(...a); return Promise.resolve(invokeResult); },
    },
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ orgId: orgIdValue }),
}));

const { useAiDraft, AI_DRAFT_FN_SLUG } = await import('../useAiDraft');

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { orgIdValue = 'org-1'; invokeResult = { data: null, error: null }; });

describe('useAiDraft', () => {
  it('a. shapes a free-form request (gist + facts, no proposal_id)', async () => {
    invokeResult = { data: { body: 'B', card_summary: 'S', facts_used: [], warnings: [] }, error: null };
    const { result } = renderHook(() => useAiDraft());
    await act(async () => {
      await result.current.draft({ kind: 'announcement', mode: 'draft', gist: 'practice moved', facts: { note: 'x' }, audience: { team_id: 't-1' } });
    });
    expect(invokeFn).toHaveBeenCalledWith(AI_DRAFT_FN_SLUG, {
      body: { org_id: 'org-1', kind: 'announcement', mode: 'draft', audience: { team_id: 't-1' }, facts: { note: 'x' }, gist: 'practice moved' },
    });
  });

  it('b. shapes an auto-proposed request (proposalId -> proposal_id, no gist)', async () => {
    invokeResult = { data: { body: 'B', card_summary: 'S', facts_used: [], warnings: [] }, error: null };
    const { result } = renderHook(() => useAiDraft());
    await act(async () => {
      await result.current.draft({ kind: 'game_recap', mode: 'redraft', proposalId: 'p-9', audience: { team_id: 't-2' } });
    });
    expect(invokeFn).toHaveBeenCalledWith(AI_DRAFT_FN_SLUG, {
      body: { org_id: 'org-1', kind: 'game_recap', mode: 'redraft', audience: { team_id: 't-2' }, proposal_id: 'p-9' },
    });
  });

  it('c. parses { body, card_summary, facts_used, warnings } into the returned shape', async () => {
    invokeResult = { data: { body: 'Game 3. Go get it.', card_summary: '10-sec summary', facts_used: [{ k: 'record', v: '5-2' }], warnings: ['venue missing'] }, error: null };
    const { result } = renderHook(() => useAiDraft());
    let returned;
    await act(async () => { returned = await result.current.draft({ kind: 'game_day', mode: 'draft', proposalId: 'p-1', audience: {} }); });
    expect(returned).toEqual({ body: 'Game 3. Go get it.', cardSummary: '10-sec summary', factsUsed: [{ k: 'record', v: '5-2' }], warnings: ['venue missing'] });
    expect(result.current.body).toBe('Game 3. Go get it.');
    expect(result.current.cardSummary).toBe('10-sec summary');
    expect(result.current.factsUsed).toEqual([{ k: 'record', v: '5-2' }]);
    expect(result.current.warnings).toEqual(['venue missing']);
    expect(result.current.error).toBe(null);
  });

  it('d. defaults missing response fields to empty (partial body)', async () => {
    invokeResult = { data: { body: 'only a body' }, error: null };
    const { result } = renderHook(() => useAiDraft());
    await act(async () => { await result.current.draft({ kind: 'announcement', mode: 'draft', gist: 'hi', audience: {} }); });
    expect(result.current.body).toBe('only a body');
    expect(result.current.cardSummary).toBe('');
    expect(result.current.factsUsed).toEqual([]);
    expect(result.current.warnings).toEqual([]);
  });

  it('e. surfaces a body-level error from the edge fn (returns null, body stays empty)', async () => {
    invokeResult = { data: { error: 'kind not supported' }, error: null };
    const { result } = renderHook(() => useAiDraft());
    let returned;
    await act(async () => { returned = await result.current.draft({ kind: 'x', mode: 'draft', proposalId: 'p', audience: {} }); });
    expect(returned).toBe(null);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('kind not supported');
    expect(result.current.body).toBe('');
  });

  it('f. surfaces a transport (invoke) error', async () => {
    invokeResult = { data: null, error: new Error('FunctionsHttpError') };
    const { result } = renderHook(() => useAiDraft());
    await act(async () => { await result.current.draft({ kind: 'game_recap', mode: 'draft', proposalId: 'p', audience: {} }); });
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('g. errors without invoking when orgId is missing', async () => {
    orgIdValue = null;
    const { result } = renderHook(() => useAiDraft());
    let returned;
    await act(async () => { returned = await result.current.draft({ kind: 'game_recap', mode: 'draft', proposalId: 'p', audience: {} }); });
    expect(invokeFn).not.toHaveBeenCalled();
    expect(returned).toBe(null);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('h. holds loading=true while the invoke is in flight, then false', async () => {
    let resolveInvoke;
    invokeResult = new Promise((res) => { resolveInvoke = res; });
    const { result } = renderHook(() => useAiDraft());
    expect(result.current.loading).toBe(false);
    let pending;
    act(() => { pending = result.current.draft({ kind: 'game_recap', mode: 'draft', proposalId: 'p', audience: {} }); });
    await waitFor(() => expect(result.current.loading).toBe(true));
    await act(async () => {
      resolveInvoke({ data: { body: 'B', card_summary: '', facts_used: [], warnings: [] }, error: null });
      await pending;
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.body).toBe('B');
  });

  it('i. reset clears the result and error', async () => {
    invokeResult = { data: { error: 'boom' }, error: null };
    const { result } = renderHook(() => useAiDraft());
    await act(async () => { await result.current.draft({ kind: 'x', mode: 'draft', proposalId: 'p', audience: {} }); });
    expect(result.current.error).toBeInstanceOf(Error);
    act(() => { result.current.reset(); });
    expect(result.current.error).toBe(null);
    expect(result.current.body).toBe('');
  });
});
