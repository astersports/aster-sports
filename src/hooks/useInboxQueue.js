// Wave 4.8 6c Session 3 — RPC-driven Active queue source.
//
// Calls public.briefing_active_queue(p_org_id, p_kind, p_team_ids,
// p_date_range) and returns the unified row set (both source='comms_messages'
// drafts/scheduled AND source='synthetic' needs-briefing rows for past games
// + upcoming/past tournaments).
//
// Replaces the prior direct comms_messages SELECT (which served only drafts
// + scheduled) and unloads 3 client-side synth sub-streams from useNeedsBriefing.
// rsvp_nudge + weekly_digest_due remain in useNeedsBriefing as a safety net
// (NOT covered by the RPC; deferred to a future PR after 30+ days cron telemetry).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// Wave 4.8 UX (PR #123) — defensive shim only. The chip UI in
// InboxFilters.jsx no longer offers 'today' / 'next_7_days'; this map
// stays in case a stale briefing_inbox_preferences.default_date_filter
// row still carries a legacy value (or a future caller forgets to map
// itself). Maps to the nearest RPC bucket so the user's intent flows
// through without crashing the RPC.
const RPC_DATE_RANGES = new Set(['all', 'this_week', 'last_14_days', 'last_30_days']);
function mapDateRange(uiValue) {
  if (RPC_DATE_RANGES.has(uiValue)) return uiValue;
  if (uiValue === 'today') return 'this_week';
  if (uiValue === 'next_7_days') return 'last_14_days';
  return 'last_14_days';
}

export function useInboxQueue({ orgId, kind = null, teamIds = null, dateRange = 'last_14_days' } = {}) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Stable string key over the teamIds set — caller may pass a fresh
  // array reference per render even when the content is unchanged.
  // Sorted-join keeps the dep stable across ordering jitter. useMemo
  // satisfies react-hooks/preserve-manual-memoization.
  const teamIdsKey = useMemo(
    () => (teamIds?.length ? [...teamIds].sort().join(',') : ''),
    [teamIds],
  );

  const refetch = useCallback(async () => {
    if (!orgId) {
      Promise.resolve().then(() => { setRows([]); setIsLoading(false); setError(null); });
      return;
    }
    Promise.resolve().then(async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: err } = await supabase.rpc('briefing_active_queue', {
        p_org_id: orgId,
        p_kind: kind,
        p_team_ids: teamIdsKey ? teamIdsKey.split(',') : null,
        p_date_range: mapDateRange(dateRange),
      });
      if (err) { setError(err); setRows([]); setIsLoading(false); return; }
      setRows(data || []);
      setIsLoading(false);
    });
  }, [orgId, kind, teamIdsKey, dateRange]);

  useEffect(() => {
    refetch();
    const onFocus = () => refetch();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);

  return { rows, isLoading, error, refetch };
}
