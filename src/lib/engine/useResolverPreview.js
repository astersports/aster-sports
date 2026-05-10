// Wave 4.2-A-8a — useResolverPreview hook.
//
// Wraps a resolver call (from RESOLVER_REGISTRY) for compose-UI
// preview surfaces. Returns { data, isLoading, error } shaped like
// React Query / SWR. anchorKey serializes the anchor object so the
// effect re-runs on anchor changes without identity mismatch.
//
// Wave 4.2-A-8a does NOT introduce React Query as a dep; the inline
// useEffect implementation matches the existing in-house pattern.

import { useEffect, useState } from 'react';
import { supabase as defaultSupabase } from '../supabase';

export function useResolverPreview({ resolve, anchor, supabase, now }) {
  const [state, setState] = useState({ data: null, isLoading: true, error: null });
  const anchorKey = JSON.stringify(anchor || {});
  const enabled = !!(resolve && anchor && Object.keys(anchor).some((k) => anchor[k] != null));

  useEffect(() => {
    if (!enabled) {
      Promise.resolve().then(() => setState({ data: null, isLoading: false, error: null }));
      return undefined;
    }
    let cancelled = false;
    Promise.resolve().then(() => setState({ data: null, isLoading: true, error: null }));
    Promise.resolve().then(async () => {
      try {
        const result = await resolve(anchor, { supabase: supabase || defaultSupabase, now: now || new Date() });
        if (cancelled) return;
        setState({ data: result, isLoading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        setState({ data: null, isLoading: false, error: err });
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorKey, enabled]);

  return state;
}
