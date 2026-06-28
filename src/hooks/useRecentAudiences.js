// Wave 4.4-B Session 5d-b-2 — admin's last 3 distinct (audience_type,
// audience_filter) pairs from comms_messages. Powers the "Recent"
// strip on Step 2 of the briefing wizard.
//
// PostgREST GROUP BY workaround: we can't do SQL aggregation through
// the REST gateway, so we fetch the last 30 sends ordered by
// sent_at DESC and dedupe in JS. At LH scale (~10 sends per admin
// per month) this comfortably covers the most-recent 3 distinct
// audiences.
//
// Audience type filter: portable types only (org_all/team/multi_team).
// event_attendees and tournament_attendees are anchor-bound — they
// don't make sense to re-apply across different events/tournaments.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const PORTABLE_TYPES = ['org_all', 'team', 'multi_team'];
const FETCH_LIMIT = 30;
const DISTINCT_LIMIT = 3;

export function useRecentAudiences() {
  const { orgId, user } = useAuth();
  const userId = user?.id;
  const [recents, setRecents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (!orgId || !userId) { setRecents([]); setLoading(false); return; }
      const { data, error } = await supabase
        .from('comms_messages')
        .select('audience_type, audience_filter, sent_at')
        .eq('org_id', orgId)
        .eq('sent_by', userId)
        .eq('status', 'sent')
        .in('audience_type', PORTABLE_TYPES)
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(FETCH_LIMIT);
      if (cancelled) return;
      if (error) { console.error('useRecentAudiences:', error.message); setRecents([]); setLoading(false); return; }
      const seen = new Set();
      const distinct = [];
      for (const row of data || []) {
        const key = JSON.stringify({ t: row.audience_type, f: row.audience_filter });
        if (seen.has(key)) continue;
        seen.add(key);
        distinct.push({ audience_type: row.audience_type, audience_filter: row.audience_filter, last_sent: row.sent_at });
        if (distinct.length >= DISTINCT_LIMIT) break;
      }
      setRecents(distinct);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId, userId]);

  return { recents, loading };
}
