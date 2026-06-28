// Wave 3.12 — fetches sent briefings from comms_messages for the
// History tab. Pagination via limit + offset. Search applies to
// subject + body_plain via ILIKE.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 50;

function applyFilters(query, filters) {
  if (filters?.kind) query = query.eq('kind', filters.kind);
  if (filters?.dateRange === 'today') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    query = query.gte('sent_at', start.toISOString());
  } else if (filters?.dateRange === 'this_week') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    query = query.gte('sent_at', start.toISOString());
  } else if (filters?.dateRange === 'next_7_days') {
    // History tab: "next 7 days" doesn't really apply to past sends;
    // treat as last 7 days for sent items.
    const start = new Date(Date.now() - 7 * 86400000);
    query = query.gte('sent_at', start.toISOString());
  }
  return query;
}

export function useInboxHistory({ orgId, filters, search } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  // page value is read only via setPage's functional updater (loadMore); no direct read.
  const [, setPage] = useState(0);

  const refetch = useCallback(async (resetPage = true, nextPage) => {
    if (!orgId) return;
    setLoading(true); setError(null);
    const targetPage = resetPage ? 0 : (nextPage ?? 0);
    let q = supabase.from('comms_messages')
      .select('id,kind,anchor_kind,anchor_id,subject,sent_at,body_plain,audience_type', { count: 'exact' })
      .eq('org_id', orgId).eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .range(targetPage * PAGE_SIZE, (targetPage + 1) * PAGE_SIZE - 1);
    q = applyFilters(q, filters);
    if (search?.trim()) q = q.or(`subject.ilike.%${search.trim()}%,body_plain.ilike.%${search.trim()}%`);
    const { data, error: err, count } = await q;
    Promise.resolve().then(() => {
      if (err) { setError(err); setLoading(false); return; }
      setRows((prev) => resetPage ? (data || []) : [...prev, ...(data || [])]);
      setHasMore((targetPage + 1) * PAGE_SIZE < (count || 0));
      setPage(targetPage);
      setLoading(false);
    });
  }, [orgId, filters, search]);

  const loadMore = useCallback(() => {
    setPage((p) => { const next = p + 1; refetch(false, next); return next; });
  }, [refetch]);

  useEffect(() => { Promise.resolve().then(() => refetch(true)); }, [orgId, filters?.kind, filters?.dateRange, JSON.stringify(filters?.teams || []), search]); // eslint-disable-line react-hooks/exhaustive-deps

  return { rows, loading, hasMore, error, loadMore, refetch };
}
