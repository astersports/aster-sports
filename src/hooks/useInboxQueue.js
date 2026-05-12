// Wave 3.12 — fetches drafts + scheduled briefings from comms_messages.
// Joined with the synthetic items from useNeedsBriefing in ActiveQueue.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ACTIVE_STATUSES = ['draft', 'scheduled'];

export function useInboxQueue({ orgId } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId) return;
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from('comms_messages')
      .select('id,kind,anchor_kind,anchor_id,audience_type,audience_filter,status,scheduled_for,subject,last_edited_at')
      .eq('org_id', orgId)
      .in('status', ACTIVE_STATUSES)
      .order('last_edited_at', { ascending: false, nullsFirst: false });
    Promise.resolve().then(() => {
      if (err) { setError(err); setLoading(false); return; }
      setRows(data || []);
      setLoading(false);
    });
  }, [orgId]);

  useEffect(() => { Promise.resolve().then(refetch); const onFocus = () => Promise.resolve().then(refetch); window.addEventListener('focus', onFocus); return () => window.removeEventListener('focus', onFocus); }, [refetch]);

  return { rows, loading, error, refetch };
}
