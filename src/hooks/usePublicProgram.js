import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Public (anon) read of a published program by slug, via the get_public_program
// SECURITY DEFINER RPC (migration 20260601044918). Returns the program + divisions
// + base/add_on fees, or null when no published program matches the slug.
// Mirrors the canonical hook shape; destructures {data,error} and surfaces error
// before use (anti-pattern #36).
export function usePublicProgram(slug) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_public_program', { p_slug: slug });
      if (!active) return;
      if (rpcErr) {
        setError(rpcErr);
        setData(null);
      } else {
        setData(rpcData); // null when no published program matches the slug
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [slug]);

  return { data, loading, error };
}
