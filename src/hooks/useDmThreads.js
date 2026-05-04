import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useDmThreads() {
  const { user, orgId } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user || !orgId) { setLoading(false); return; }
    const [threadsRes, profilesRes] = await Promise.all([
      supabase.from('dm_threads').select('*')
        .eq('org_id', orgId)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('created_at', { ascending: false }),
      supabase.rpc('get_org_user_profiles', { p_org_id: orgId }),
    ]);
    if (threadsRes.error) console.error('useDmThreads:', threadsRes.error.message);
    const raw = threadsRes.data || [];
    if (raw.length === 0) { setThreads([]); setLoading(false); return; }

    const profileMap = {};
    (profilesRes.data || []).forEach((p) => { profileMap[p.user_id] = p; });

    const threadIds = raw.map((t) => t.id);
    const { data: msgs } = await supabase.from('messages')
      .select('dm_thread_id, sender_name, body, created_at')
      .in('dm_thread_id', threadIds).eq('channel', 'dm')
      .order('created_at', { ascending: false });
    const lastMsgMap = {};
    (msgs || []).forEach((m) => { if (!lastMsgMap[m.dm_thread_id]) lastMsgMap[m.dm_thread_id] = m; });

    const enriched = raw.map((t) => {
      const otherId = t.user_a === user.id ? t.user_b : t.user_a;
      const profile = profileMap[otherId];
      return {
        ...t,
        otherId,
        otherName: profile?.display_name || 'User',
        otherRole: profile?.role || 'parent',
        lastMessage: lastMsgMap[t.id] || null,
      };
    });
    setThreads(enriched);
    setLoading(false);
  }, [user, orgId]);

  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  return { threads, loading, refetch: fetch };
}
