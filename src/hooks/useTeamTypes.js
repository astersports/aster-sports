import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Resolves the org's team_types catalog into a { slug: id } map so the team
// form can persist team_type_id by slug (GO §6 — resolve at runtime, never
// hardcode the uuids; team_types is org-scoped). AP#36: error surfaced, not
// swallowed into a silent empty map.
export function useTeamTypes() {
  const { orgId } = useAuth();
  const [bySlug, setBySlug] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // Microtask wrap keeps all setState out of the synchronous effect body
    // (react-hooks/set-state-in-effect), same shape as useActivePrograms.
    Promise.resolve().then(async () => {
      if (!orgId) { if (alive) setLoading(false); return; }
      const { data, error } = await supabase.from('team_types').select('id, slug').eq('org_id', orgId);
      if (!alive) return;
      if (error) console.error('useTeamTypes:', error.message);
      const map = {};
      for (const r of data || []) map[r.slug] = r.id;
      setBySlug(map);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [orgId]);

  return { bySlug, loading };
}
