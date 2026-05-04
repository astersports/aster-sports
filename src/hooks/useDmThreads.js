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
    if (raw.length === 0) { setThreads([]); setLoading(false); return; }

    const otherIds = raw.map((t) => t.user_a === user.id ? t.user_b : t.user_a);
    const threadIds = raw.map((t) => t.id);

    const [guardianRes, roleRes, msgRes] = await Promise.all([
      supabase.from('guardians').select('user_id, first_name, last_name').in('user_id', otherIds),
      supabase.from('user_roles').select('user_id, role').in('user_id', otherIds),
      supabase.from('messages').select('dm_thread_id, sender_name, body, created_at')
        .in('dm_thread_id', threadIds).eq('channel', 'dm')
        .order('created_at', { ascending: false }),
    ]);

    const guardianMap = {};
    (guardianRes.data || []).forEach((g) => { guardianMap[g.user_id] = `${g.first_name} ${g.last_name}`; });
    const roleMap = {};
    (roleRes.data || []).forEach((r) => { roleMap[r.user_id] = r.role; });
    const lastMsgMap = {};
    (msgRes.data || []).forEach((m) => {
      if (!lastMsgMap[m.dm_thread_id]) lastMsgMap[m.dm_thread_id] = m;
    });

    const enriched = raw.map((t) => {
      const otherId = t.user_a === user.id ? t.user_b : t.user_a;
      return {
        ...t,
        otherId,
        otherName: guardianMap[otherId] || (roleMap[otherId] === 'coach' ? 'Coach' : roleMap[otherId] === 'admin' ? 'Admin' : 'User'),
        otherRole: roleMap[otherId] || 'parent',
        lastMessage: lastMsgMap[t.id] || null,
      };
    });
    setThreads(enriched);
    setLoading(false);
  }, [user, orgId]);

  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  return { threads, loading, refetch: fetch };
}
