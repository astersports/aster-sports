import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useUnreadCounts() {
  const { user } = useAuth();
  const [reads, setReads] = useState({});

  const fetchReads = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('message_reads').select('channel_key, last_read_at')
      .eq('user_id', user.id);
    const map = {};
    (data || []).forEach((r) => { map[r.channel_key] = r.last_read_at; });
    setReads(map);
  }, [user]);

  useEffect(() => { Promise.resolve().then(fetchReads); }, [fetchReads]);

  const markRead = useCallback(async (channelKey) => {
    if (!user) return;
    const now = new Date().toISOString();
    setReads((prev) => ({ ...prev, [channelKey]: now }));
    await supabase.from('message_reads').upsert(
      { user_id: user.id, channel_key: channelKey, last_read_at: now },
      { onConflict: 'user_id,channel_key' },
    );
  }, [user]);

  return { reads, markRead, refetch: fetchReads };
}
