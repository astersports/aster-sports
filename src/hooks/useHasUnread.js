import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// May 16 audit P2 item 10 (PR #319): the realtime channel name and
// postgres_changes filter were both global pre-fix — `unread-badge`
// shared across every connected user, and the INSERT subscription
// fired for ALL message rows regardless of org. Refactored to scope
// both the channel name and the row filter by orgId so multi-tenant
// installations don't burn channel slots or refetch on cross-org
// inserts. Single-tenant LH today: same behavior, less server work.

export function useHasUnread() {
  const { user, orgId } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  const check = useCallback(async () => {
    if (!user || !orgId) return;
    const { data: reads, error: readsErr } = await supabase
      .from('message_reads').select('channel_key, last_read_at')
      .eq('user_id', user.id);
    if (readsErr) { console.error('[useHasUnread] reads:', readsErr.message); return; }
    const readMap = {};
    (reads || []).forEach((r) => { readMap[r.channel_key] = r.last_read_at; });

    const { count, error: countErr } = await supabase.from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .neq('sender_id', user.id)
      .gt('created_at', readMap.global_last_check || '2020-01-01');
    if (countErr) { console.error('[useHasUnread] count:', countErr.message); return; }
    setHasUnread((count || 0) > 0);
  }, [user, orgId]);

  useEffect(() => { Promise.resolve().then(check); }, [check]);

  useEffect(() => {
    if (!orgId) return;
    const safeCheck = () => {
      try { check(); }
      catch (err) { console.error('[useHasUnread] realtime callback:', err); }
    };
    const ch = supabase.channel(`unread-badge-${orgId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `org_id=eq.${orgId}`,
      }, safeCheck)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId, check]);

  return hasUnread;
}
