import { useCallback, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// Optimistic "mark all read" for the parent inbox (§16.1).
// Reuses the existing useInboxList API (markOpened, refetch) rather than
// adding a method to the hook — keeps the hook's public surface intact.
//
// Flow: clear every unread row in-place via markOpened (instant), then a
// single batched persist write. On persist failure, refetch to roll the
// list back to server truth and surface a kindness toast (§16.3). One write
// for N rows (no await-in-loop, AP #4).
//
// Returns { busy, status, run } — status is null | 'done' | 'error', the
// page maps it to a Toast and clears it.

export function useMarkAllRead({ items, markOpened, refetch }) {
  const { guardianId } = useAuth();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  const run = useCallback(async () => {
    if (busy) return;
    const unreadIds = items.filter((it) => !it.opened_at).map((it) => it.id);
    if (unreadIds.length === 0 || !guardianId) return;
    setBusy(true);
    setStatus(null);
    // Optimistic in-place clear — the dots vanish before the network call.
    unreadIds.forEach((id) => markOpened(id));
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('comms_message_recipients')
      .update({ opened_at: nowIso })
      .eq('guardian_id', guardianId)
      .is('opened_at', null)
      .in('id', unreadIds);
    if (error) {
      // Roll back to server truth so the optimistic clear can't lie.
      await refetch();
      setStatus('error');
    } else {
      setStatus('done');
    }
    setBusy(false);
  }, [busy, items, guardianId, markOpened, refetch]);

  const clearStatus = useCallback(() => setStatus(null), []);

  return { busy, status, run, clearStatus };
}
