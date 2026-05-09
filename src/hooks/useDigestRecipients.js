import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Wraps get_digest_recipients(p_org_id, p_pilot_only) RPC. Returns one
// row per guardian deduped across multi-team families. Used by the
// digest compose UI and dispatch path.
//
// Wave 3.5: pilotOnly param wires through to the RPC's p_pilot_only
// argument. When TRUE (org pilot mode active), only guardians flagged
// is_pilot_family return — currently 6 for Legacy Hoopers. The RPC's
// single-arg signature was dropped in migration 20260509101739, so
// every call MUST pass p_pilot_only explicitly (defense in depth —
// no caller can accidentally omit the pilot intent).

export function useDigestRecipients({ orgId, pilotOnly = false } = {}) {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!orgId) { setRecipients([]); setLoading(false); setError(null); return; }
      setLoading(true); setError(null);
      const { data, error: err } = await supabase.rpc('get_digest_recipients', {
        p_org_id: orgId,
        p_pilot_only: pilotOnly,
      });
      if (cancelled) return;
      if (err) { setError(err); setRecipients([]); setLoading(false); return; }
      setRecipients(data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId, pilotOnly]);

  return { recipients, loading, error };
}
