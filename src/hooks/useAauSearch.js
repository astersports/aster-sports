import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const MIN_QUERY = 2;     // don't search on a single character
const DEBOUNCE_MS = 300;

const EMPTY = { teams: [], divisions: [], tournaments: [] };

/**
 * Debounced public AAU search for the no-login Hub gateway (R1·PR-A).
 *
 * Reads the anon-callable `search_public_aau(p_query)` RPC (gated server-side by
 * org_is_public_listed()). Returns a jsonb object { teams, divisions,
 * tournaments } — note camelCase fields (teamKey, tournamentId, startDate),
 * distinct from get_public_tournament_directory()'s snake_case.
 *
 * `idle` is true until the user has typed at least MIN_QUERY characters, so the
 * Hub can keep showing the browse directory until a real query is entered.
 */
export function useAauSearch(query) {
  const trimmed = (query || '').trim();
  const active = trimmed.length >= MIN_QUERY;

  const [results, setResults] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active) {
      // Microtask wrap satisfies react-hooks/set-state-in-effect.
      Promise.resolve().then(() => { setResults(EMPTY); setLoading(false); setError(null); });
      return;
    }

    let cancelled = false;
    Promise.resolve().then(() => { setLoading(true); setError(null); });

    const timer = setTimeout(async () => {
      // AP #36: destructure { data, error } and surface the error before use.
      const { data, error: rpcErr } = await supabase.rpc('search_public_aau', { p_query: trimmed });
      if (cancelled) return;
      if (rpcErr) {
        setError(rpcErr);
        setResults(EMPTY);
        setLoading(false);
        return;
      }
      setResults({
        teams: data?.teams || [],
        divisions: data?.divisions || [],
        tournaments: data?.tournaments || [],
      });
      setLoading(false);
    }, DEBOUNCE_MS);

    // Cancelling on query change drops the stale debounce + ignores any
    // in-flight response, so the latest keystroke always wins (no race).
    return () => { cancelled = true; clearTimeout(timer); };
  }, [trimmed, active]);

  return { results, loading, error, active };
}
