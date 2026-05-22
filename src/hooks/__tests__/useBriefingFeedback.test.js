// @vitest-environment jsdom
//
// Cutover PR 7b-3 — useBriefingFeedback hook unit tests.
// Mocks supabase to verify per-message and rolling-window aggregation.

import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const queryState = {
  messageRows: [],
  feedbackRows: [],
  messageError: null,
  feedbackError: null,
};

function makeChain(table) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    not: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => {
      if (table === 'comms_messages') {
        return Promise.resolve({ data: queryState.messageRows, error: queryState.messageError });
      }
      return Promise.resolve({ data: [], error: null });
    }),
    in: vi.fn(() => {
      if (table === 'briefing_feedback') {
        return Promise.resolve({ data: queryState.feedbackRows, error: queryState.feedbackError });
      }
      return Promise.resolve({ data: [], error: null });
    }),
  };
  // When called as terminal .eq for per-message fetch (no .in/.limit), it
  // needs to resolve. Override via a then.
  chain.then = (resolve) => {
    if (table === 'briefing_feedback') {
      return Promise.resolve({ data: queryState.feedbackRows, error: queryState.feedbackError }).then(resolve);
    }
    return Promise.resolve({ data: [], error: null }).then(resolve);
  };
  return chain;
}

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn((table) => makeChain(table)) },
}));

const { useBriefingFeedback, CUTOVER_GATE_THRESHOLD } = await import('../useBriefingFeedback');

describe('useBriefingFeedback', () => {
  it('1. CUTOVER_GATE_THRESHOLD exported at 4.0', () => {
    expect(CUTOVER_GATE_THRESHOLD).toBe(4.0);
  });

  it('2. per-message: mean + count from latest-per-recipient', async () => {
    queryState.feedbackRows = [
      { rating: 4, recipient_email: 'a@x', submitted_at: '2026-05-22T10:00:00Z' },
      { rating: 5, recipient_email: 'a@x', submitted_at: '2026-05-22T11:00:00Z' }, // later wins
      { rating: 3, recipient_email: 'b@x', submitted_at: '2026-05-22T10:30:00Z' },
    ];
    const { result } = renderHook(() => useBriefingFeedback({ messageId: 'm-1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ratingCount).toBe(2); // dedupe
    expect(result.current.meanRating).toBe(4); // (5+3)/2
    expect(result.current.distribution).toEqual({ 1: 0, 2: 0, 3: 1, 4: 0, 5: 1 });
  });

  it('3. per-message: empty feedback → meanRating null + ratingCount 0', async () => {
    queryState.feedbackRows = [];
    const { result } = renderHook(() => useBriefingFeedback({ messageId: 'm-empty' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.meanRating).toBeNull();
    expect(result.current.ratingCount).toBe(0);
  });

  it('4. rolling cutover-gate: mean across last N message rows', async () => {
    queryState.messageRows = [{ id: 'm-1' }, { id: 'm-2' }, { id: 'm-3' }, { id: 'm-4' }, { id: 'm-5' }];
    queryState.feedbackRows = [
      { rating: 5, recipient_email: 'a@x', message_id: 'm-1', submitted_at: '2026-05-22T10:00:00Z' },
      { rating: 4, recipient_email: 'b@x', message_id: 'm-1', submitted_at: '2026-05-22T10:00:00Z' },
      { rating: 4, recipient_email: 'a@x', message_id: 'm-2', submitted_at: '2026-05-22T11:00:00Z' },
    ];
    const { result } = renderHook(() => useBriefingFeedback({ orgId: 'org-1', rolling: 5 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messageCount).toBe(5);
    expect(result.current.ratingCount).toBe(3); // distinct (msg,email)
    expect(result.current.meanRating).toBeCloseTo(13 / 3, 5);
    expect(result.current.atOrAboveThreshold).toBe(true);
  });

  it('5. rolling cutover-gate: meanRating below 4.0 → atOrAboveThreshold false', async () => {
    queryState.messageRows = [{ id: 'm-1' }];
    queryState.feedbackRows = [
      { rating: 3, recipient_email: 'a@x', message_id: 'm-1', submitted_at: '2026-05-22T10:00:00Z' },
      { rating: 3, recipient_email: 'b@x', message_id: 'm-1', submitted_at: '2026-05-22T10:00:00Z' },
    ];
    const { result } = renderHook(() => useBriefingFeedback({ orgId: 'org-1', rolling: 5 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.meanRating).toBe(3);
    expect(result.current.atOrAboveThreshold).toBe(false);
  });

  it('6. rolling cutover-gate: no sent messages → all-zero result', async () => {
    queryState.messageRows = [];
    queryState.feedbackRows = [];
    const { result } = renderHook(() => useBriefingFeedback({ orgId: 'org-1', rolling: 5 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.meanRating).toBeNull();
    expect(result.current.ratingCount).toBe(0);
    expect(result.current.messageCount).toBe(0);
    expect(result.current.atOrAboveThreshold).toBe(false);
  });

  it('7. rolling cutover-gate: meanRating exactly 4.0 → atOrAboveThreshold true (≥, not >)', async () => {
    queryState.messageRows = [{ id: 'm-1' }];
    queryState.feedbackRows = [
      { rating: 4, recipient_email: 'a@x', message_id: 'm-1', submitted_at: '2026-05-22T10:00:00Z' },
    ];
    const { result } = renderHook(() => useBriefingFeedback({ orgId: 'org-1', rolling: 5 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.meanRating).toBe(4);
    expect(result.current.atOrAboveThreshold).toBe(true);
  });

  it('8. no args (neither messageId nor orgId/rolling) → stays loading (no-op)', async () => {
    const { result } = renderHook(() => useBriefingFeedback({}));
    // Hook returns initial { loading: true } and does nothing.
    expect(result.current.loading).toBe(true);
    await act(async () => { await Promise.resolve(); });
    expect(result.current.loading).toBe(true);
  });
});
