import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useHasUnread() {
  const { user, orgId } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  const check = useCallback(async () => {
    if (!user || !orgId) return;
    const { data: reads } = await supabase
      .from('message_reads').select('channel_key, last_read_at')
      .eq('user_id', user.id);
    if (!reads || reads.length === 0) {
      const { count } = await supabase.from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId).neq('sender_id', user.id);
      setHasUnread((count || 0) > 0);
      return;
    }
    const latest = reads.reduce((max, r) => r.last_read_at > max ? r.last_read_at : max, '2020-01-01');
    const { count } = await supabase.from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .neq('sender_id', user.id)
      .gt('created_at', latest);
    setHasUnread((count || 0) > 0);
  }, [user, orgId]);

  useEffect(() => { Promise.resolve().then(check); }, [check]);

  useEffect(() => {
    if (!orgId) return;
    const ch = supabase.channel('unread-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `org_id=eq.${orgId}` }, check)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId, check]);

  return hasUnread;
}
