import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Wraps get_digest_recipients(p_org_id) RPC. Returns one row per
// guardian deduped across multi-team families. Used by the digest
// compose UI and dispatch path. RPC is SECURITY INVOKER and gated to
// authenticated role only — see migration 20260509021709.

export function useDigestRecipients(orgId) {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!orgId) { setRecipients([]); setLoading(false); setError(null); return; }
      setLoading(true); setError(null);
      const { data, error: err } = await supabase.rpc('get_digest_recipients', { p_org_id: orgId });
      if (cancelled) return;
      if (err) { setError(err); setRecipients([]); setLoading(false); return; }
      setRecipients(data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  return { recipients, loading, error };
}
