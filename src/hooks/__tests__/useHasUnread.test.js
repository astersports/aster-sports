// @vitest-environment jsdom
//
// Audit fix — useHasUnread per-channel comparison.
//   The nav badge previously read `readMap.global_last_check`, a key no writer
//   sets (markRead in useUnreadCounts writes one last_read_at per channel_key),
//   so the badge never cleared. A first fix rebased on the MAX last_read_at
//   across channels — but that produces a FALSE NEGATIVE: reading one channel
//   recently suppresses the badge for an unread message in a channel read less
//   recently, and disagrees with ChannelList's per-channel dot. This fix
//   compares each channel's newest non-self message against THAT channel's
//   last_read_at. The third test locks the false-negative case.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

let readRows = [];
let messages = []; // newest-first, each { channel, team_id?, dm_thread_id?, created_at }

function buildQuery(table) {
  if (table === 'message_reads') {
    return { select: () => ({ eq: () => Promise.resolve({ data: readRows, error: null }) }) };
  }
  // messages: chain ends with .order(...).limit(n) -> rows (newest-first)
  const q = {
    select: () => q,
    eq: () => q,
    neq: () => q,
    order: () => q,
    limit: () => Promise.resolve({ data: messages, error: null }),
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

describe('useHasUnread — per-channel comparison (audit fix)', () => {
  it('is true when a channel has a message newer than its own last_read_at', async () => {
    readRows = [{ channel_key: 'announcements', last_read_at: '2026-06-01T00:00:00Z' }];
    messages = [{ channel: 'announcement', created_at: '2026-06-03T00:00:00Z' }];
    const { result } = renderHook(() => useHasUnread());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('is false after every channel is read (badge clears)', async () => {
    readRows = [
      { channel_key: 'announcements', last_read_at: '2026-06-05T00:00:00Z' },
      { channel_key: 'dm-7', last_read_at: '2026-06-05T00:00:00Z' },
    ];
    messages = [
      { channel: 'announcement', created_at: '2026-06-04T00:00:00Z' },
      { channel: 'dm', dm_thread_id: '7', created_at: '2026-06-03T00:00:00Z' },
    ];
    const { result } = renderHook(() => useHasUnread());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('LOCK: stays true when one channel was read recently but another has an older unread message', async () => {
    // The MAX-across-channels approach would mark this FALSE (team-9's read row
    // raises the high-water mark above the unread announcement). Per-channel is
    // correct: the announcement is unread relative to its OWN read time.
    readRows = [
      { channel_key: 'announcements', last_read_at: '2026-06-01T00:00:00Z' },
      { channel_key: 'team-9', last_read_at: '2026-06-10T00:00:00Z' },
    ];
    messages = [
      { channel: 'team', team_id: '9', created_at: '2026-06-09T00:00:00Z' }, // read
      { channel: 'announcement', created_at: '2026-06-05T00:00:00Z' },        // UNREAD vs 06-01
    ];
    const { result } = renderHook(() => useHasUnread());
    await waitFor(() => expect(result.current).toBe(true));
  });
});
