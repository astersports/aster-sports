// Wave 4.4-B Session 5b — extracted from StepKindPicker so the picker
// stays under the 150 LOC cap after the responsive-grid rewrite.
//
// Reads comms_messages.{kind, sent_at} for the active org, builds
// per-kind last-sent + count maps. Mirrors the pre-rewrite semantics
// from the old picker exactly so existing org analytics are unchanged.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useKindUsage() {
  const { orgId } = useAuth();
  const [usageByKind, setUsageByKind] = useState({});
  const [countsByKind, setCountsByKind] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (!orgId) { setLoading(false); return; }
      const { data, error } = await supabase.from('comms_messages')
        .select('kind, sent_at')
        .eq('org_id', orgId).eq('status', 'sent')
        .order('sent_at', { ascending: false }).limit(200);
      if (cancelled) return;
      if (error) throw error;
      const u = {}; const c = {};
      (data || []).forEach((row) => {
        const ms = row.sent_at ? new Date(row.sent_at).getTime() : 0;
        if (!u[row.kind] || ms > u[row.kind]) u[row.kind] = ms;
        c[row.kind] = (c[row.kind] || 0) + 1;
      });
      setUsageByKind(u); setCountsByKind(c); setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  return { usageByKind, countsByKind, loading };
}
