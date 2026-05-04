import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useDmThreads() {
  const { user, orgId } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user || !orgId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('dm_threads').select('*')
      .eq('org_id', orgId)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (error) console.error('useDmThreads:', error.message);
    const raw = data || [];
    const enriched = await Promise.all(raw.map(async (t) => {
      const otherId = t.user_a === user.id ? t.user_b : t.user_a;
      const { data: lastMsg } = await supabase
        .from('messages').select('sender_name, body, created_at')
        .eq('dm_thread_id', t.id).order('created_at', { ascending: false }).limit(1);
      const { data: roleRow } = await supabase
        .from('user_roles').select('role').eq('user_id', otherId).maybeSingle();
      return {
        ...t,
        otherId,
        otherName: lastMsg?.[0]?.sender_name || 'User',
        otherRole: roleRow?.role || 'parent',
        lastMessage: lastMsg?.[0] || null,
      };
    }));
    setThreads(enriched);
    setLoading(false);
  }, [user, orgId]);

  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  return { threads, loading, refetch: fetch };
}
