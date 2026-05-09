// Wave 3.14 — fetches sent briefings anchored to a specific event.
// Powers EventBriefingHistory (only renders when results exist).
// Refetches on window focus so admin sees newly sent briefings
// without manual refresh.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useEventBriefings({ orgId, eventId } = {}) {
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId || !eventId) return;
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from('comms_messages')
      .select('id,kind,sent_at,subject,comms_message_recipients(delivery_status)')
      .eq('org_id', orgId)
      .eq('anchor_kind', 'event')
      .eq('anchor_id', eventId)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(10);
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
  }, [orgId, eventId]);

  useEffect(() => {
    Promise.resolve().then(refetch);
    const onFocus = () => Promise.resolve().then(refetch);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);

  return { briefings, loading, error, refetch };
}
