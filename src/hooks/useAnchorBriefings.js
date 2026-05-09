// Wave 3.15 — generalized briefing-history fetcher. Replaces
// useEventBriefings as the canonical query path; useEventBriefings
// remains a thin wrapper to preserve PR #45 callers (no consumer
// touches required this wave).
//
// Returns the most-recent N sent briefings anchored to the given
// (anchor_kind, anchor_id) pair. Joins comms_message_recipients
// for delivery rate. Refetches on window focus.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAnchorBriefings({ orgId, anchorKind, anchorId, limit = 10 } = {}) {
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId || !anchorKind || !anchorId) return;
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from('comms_messages')
      .select('id,kind,sent_at,subject,comms_message_recipients(delivery_status)')
      .eq('org_id', orgId)
      .eq('anchor_kind', anchorKind)
      .eq('anchor_id', anchorId)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(limit);
    Promise.resolve().then(() => {
      if (err) { setError(err); setLoading(false); return; }
      const mapped = (data || []).map((row) => {
        const total = row.comms_message_recipients?.length || 0;
        const delivered = (row.comms_message_recipients || []).filter((r) => r.delivery_status === 'sent' || r.delivery_status === 'delivered').length;
        return { id: row.id, kind: row.kind, sent_at: row.sent_at, subject: row.subject, recipientCount: total, deliveredCount: delivered };
      });
      setBriefings(mapped);
      setLoading(false);
    });
  }, [orgId, anchorKind, anchorId, limit]);

  useEffect(() => {
    Promise.resolve().then(refetch);
    const onFocus = () => Promise.resolve().then(refetch);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);

  return { briefings, loading, error, refetch };
}
