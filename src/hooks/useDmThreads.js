import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// L99 perf audit (TIER 2) — batched recipient + last-message resolution.
// Old shape: 1 + 3*N queries (3 sequential awaits per thread for lastMsg +
// user_roles + guardians/staff_profiles). New: 1 + 2 + 2 = 5 total queries
// regardless of thread count.
//
// AP #36 — every supabase chain destructures error + handles it.
// AP #37 — user_roles is org-scoped, filtered explicitly.

export function useDmThreads() {
  const { user, orgId } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (signal) => {
    if (!user || !orgId) { setLoading(false); return; }
    const { data: rawThreads, error: threadsErr } = await supabase
      .from('dm_threads').select('*')
      .eq('org_id', orgId)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (threadsErr) console.error('useDmThreads:', threadsErr.message);
    if (signal?.cancelled) return;
    const raw = rawThreads ?? [];
    if (raw.length === 0) { setThreads([]); setLoading(false); return; }

    const otherIds = [...new Set(raw.map((t) => (t.user_a === user.id ? t.user_b : t.user_a)).filter(Boolean))];
    const threadIds = raw.map((t) => t.id);

    // Batch 1: roles for every other party + last message for every thread.
    const [rolesRes, msgsRes] = await Promise.all([
      supabase.from('user_roles').select('user_id, role')
        .eq('organization_id', orgId).in('user_id', otherIds),
      supabase.from('messages').select('dm_thread_id, sender_name, body, created_at')
        .eq('org_id', orgId).in('dm_thread_id', threadIds)
        .order('created_at', { ascending: false }),
    ]);
    if (rolesRes.error) console.error('useDmThreads user_roles:', rolesRes.error.message);
    if (msgsRes.error) console.error('useDmThreads messages:', msgsRes.error.message);
    if (signal?.cancelled) return;

    const roleMap = new Map();
    (rolesRes.data ?? []).forEach((r) => { if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, r.role); });
    const lastMsgMap = new Map();
    (msgsRes.data ?? []).forEach((m) => { if (!lastMsgMap.has(m.dm_thread_id)) lastMsgMap.set(m.dm_thread_id, m); });

    // Batch 2: names — split otherIds by role for the right name source.
    const parentIds = otherIds.filter((id) => roleMap.get(id) === 'parent');
    const staffIds = otherIds.filter((id) => ['coach', 'admin'].includes(roleMap.get(id)));
    const [guardiansRes, staffRes] = await Promise.all([
      parentIds.length
        ? supabase.from('guardians').select('user_id, first_name, last_name')
            .eq('org_id', orgId).in('user_id', parentIds)
        : Promise.resolve({ data: [], error: null }),
      staffIds.length
        ? supabase.from('staff_profiles').select('user_id, display_name')
            .eq('org_id', orgId).in('user_id', staffIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (guardiansRes.error) console.error('useDmThreads guardians:', guardiansRes.error.message);
    if (staffRes.error) console.error('useDmThreads staff_profiles:', staffRes.error.message);
    if (signal?.cancelled) return;

    const nameMap = new Map();
    (guardiansRes.data ?? []).forEach((g) => {
      const n = `${g.first_name ?? ''} ${g.last_name ?? ''}`.trim() || 'User';
      nameMap.set(g.user_id, n);
    });
    (staffRes.data ?? []).forEach((s) => { nameMap.set(s.user_id, s.display_name || 'Coach'); });

    const enriched = raw.map((t) => {
      const otherId = t.user_a === user.id ? t.user_b : t.user_a;
      const role = roleMap.get(otherId) || 'parent';
      return {
        ...t,
        otherId,
        otherName: nameMap.get(otherId) || (role === 'parent' ? 'User' : role),
        otherRole: role,
        lastMessage: lastMsgMap.get(t.id) || null,
      };
    });

    setThreads(enriched);
    setLoading(false);
  }, [user, orgId]);

  useEffect(() => {
    const signal = { cancelled: false };
    Promise.resolve().then(() => fetch(signal));
    return () => { signal.cancelled = true; };
  }, [fetch]);

  return { threads, loading, refetch: fetch };
}
