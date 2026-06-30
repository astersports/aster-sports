import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Public AAU tournament directory for the no-login Hub gateway (R1·PR-A).
 *
 * Reads the anon-callable `get_public_tournament_directory()` RPC — the frozen
 * public-RPC contract (PUBLIC_RPC_CONTRACT.md) that aggregates tournaments from
 * public-listed orgs (gated server-side by org_is_public_listed()). Returns a
 * jsonb array; each element is { id, name, circuit, states, start_date,
 * end_date, divisions }.
 *
 * Distinct from `usePublicTournaments(orgId)`, which is the single-org records
 * page reading the `tournaments` table directly. This hook is the cross-org
 * Hub directory over the public RPC — no org context, anon client.
 */
export function useAauDirectory() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // Microtask wrap keeps the synchronous setState out of the effect body
    // (react-hooks/set-state-in-effect), matching the public-hook pattern.
    Promise.resolve().then(() => { setLoading(true); setError(null); });

    (async () => {
      // AP #36: destructure { data, error } and surface error before use — a
      // bare `data = []` default would swallow an RLS/RPC failure as "empty".
      const { data, error: rpcErr } = await supabase.rpc('get_public_tournament_directory');
      if (cancelled) return;
      if (rpcErr) {
        setError(rpcErr);
        setTournaments([]);
        setLoading(false);
        return;
      }
      setTournaments(Array.isArray(data) ? data : []);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  return { tournaments, loading, error };
}
