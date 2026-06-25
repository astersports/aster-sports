// @vitest-environment jsdom
//
// Audit fix — useHasUnread high-water-mark.
//   The nav badge previously read `readMap.global_last_check`, a key no writer
//   sets (markRead in useUnreadCounts writes one last_read_at per channel_key).
//   So the count was always vs '2020-01-01' and the badge never cleared. The
//   fix rebases the threshold on the user's MAX last_read_at across channels;
//   once every channel is read, the badge goes false.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

// Per-channel read rows + the message timeline the count query filters against.
let readRows = [];
let messages = [];

function buildQuery(table) {
  if (table === 'message_reads') {
    return {
      select: () => ({ eq: () => Promise.resolve({ data: readRows, error: null }) }),
    };
  }
  // messages: chain ends with .gt('created_at', highWater) -> count of newer rows
  let threshold = '2020-01-01';
  const q = {
    select: () => q,
    eq: () => q,
    neq: () => q,
    gt: (_col, value) => {
      threshold = value;
      const count = messages.filter((m) => m.created_at > threshold).length;
      return Promise.resolve({ count, error: null });
    },
  };
  return q;
}

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table) => buildQuery(table),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-1' }, orgId: 'org-1' }),
}));

const { useHasUnread } = await import('../useHasUnread');

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('useHasUnread — high-water-mark (audit fix)', () => {
  it('is true when a message is newer than the user\'s max last_read_at', async () => {
    readRows = [
      { channel_key: 'announcement', last_read_at: '2026-06-01T00:00:00Z' },
      { channel_key: 'dm-7', last_read_at: '2026-06-02T00:00:00Z' },
    ];
    messages = [{ created_at: '2026-06-03T00:00:00Z' }]; // newer than max (06-02)
    const { result } = renderHook(() => useHasUnread());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('is false after every channel is marked read (badge clears)', async () => {
    readRows = [
      { channel_key: 'announcement', last_read_at: '2026-06-05T00:00:00Z' },
      { channel_key: 'dm-7', last_read_at: '2026-06-05T00:00:00Z' },
    ];
    messages = [
      { created_at: '2026-06-03T00:00:00Z' },
      { created_at: '2026-06-04T00:00:00Z' },
    ]; // all older than the high-water mark
    const { result } = renderHook(() => useHasUnread());
    await waitFor(() => expect(result.current).toBe(false));
  });
});
