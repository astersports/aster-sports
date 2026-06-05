// @vitest-environment jsdom
//
// Audit fix — useInboxList ordering + optimistic mark-as-read.
//   - Ordering: items sort by joined comms_messages.sent_at DESC JS-side
//     (PostgREST foreignTable order can't sort parent rows — AP #48).
//     Null sent_at (drafts/queued) sort to the top.
//   - markOpened(id): optimistically clears the unread dot in-place (§16.1)
//     without a refetch.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

// Rows as PostgREST would return them (unsorted-by-sent_at; ordered by id
// desc from the fetch). r-3 has no sent_at (draft) -> should sort first.
let queryRows = [];

function buildQuery() {
  const q = {
    select: () => q,
    eq: () => q,
    order: () => q,
    // terminal: limit() resolves the query
    limit: () => Promise.resolve({ data: queryRows, error: null }),
  };
  return q;
}

vi.mock('../../lib/supabase', () => ({
  supabase: { from: () => buildQuery() },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ guardianId: 'g-1' }),
}));

const { useInboxList } = await import('../useInboxList');

afterEach(() => { cleanup(); vi.clearAllMocks(); });

function row(id, sentAtIso, openedAt = null) {
  return {
    id,
    message_id: `m-${id}`,
    opened_at: openedAt,
    subject_rendered: `Subject ${id}`,
    teams_included: [],
    comms_messages: { kind: 'weekly_digest', subject: `S${id}`, sent_at: sentAtIso, anchor_kind: null, anchor_id: null, team_id: null, teams: null },
  };
}

describe('useInboxList — ordering by sent_at (AP #48)', () => {
  beforeEach(() => {
    // Intentionally NOT pre-sorted by sent_at. Newest = r-2 (today),
    // then r-1 (yesterday); r-3 is a draft (null sent_at) -> sorts first.
    queryRows = [
      row('r-1', '2026-06-01T12:00:00Z'),
      row('r-2', '2026-06-04T12:00:00Z'),
      row('r-3', null),
    ];
  });

  it('sorts by sent_at DESC with null (draft) first', async () => {
    const { result } = renderHook(() => useInboxList());
    await waitFor(() => expect(result.current.items.length).toBe(3));
    expect(result.current.items.map((i) => i.id)).toEqual(['r-3', 'r-2', 'r-1']);
  });
});

describe('useInboxList — markOpened optimistic clear (§16.1)', () => {
  beforeEach(() => {
    queryRows = [
      row('r-1', '2026-06-04T12:00:00Z', null), // unread
      row('r-2', '2026-06-03T12:00:00Z', '2026-06-03T13:00:00Z'), // already read
    ];
  });

  it('clears the unread state of one row in-place without refetch', async () => {
    const { result } = renderHook(() => useInboxList());
    await waitFor(() => expect(result.current.items.length).toBe(2));
    expect(result.current.items.find((i) => i.id === 'r-1').opened_at).toBe(null);

    act(() => { result.current.markOpened('r-1'); });

    const r1 = result.current.items.find((i) => i.id === 'r-1');
    expect(r1.opened_at).not.toBe(null);
    // other rows untouched
    expect(result.current.items.find((i) => i.id === 'r-2').opened_at).toBe('2026-06-03T13:00:00Z');
  });

  it('leaves an already-opened row untouched (idempotent)', async () => {
    const { result } = renderHook(() => useInboxList());
    await waitFor(() => expect(result.current.items.length).toBe(2));
    const before = result.current.items.find((i) => i.id === 'r-2').opened_at;
    act(() => { result.current.markOpened('r-2'); });
    expect(result.current.items.find((i) => i.id === 'r-2').opened_at).toBe(before);
  });
});
