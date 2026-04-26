import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * useOrgGuardians
 * Org-wide guardian list with child first-names attached, used by
 * RoleSwitcherSheet for admin's "view as parent" picker. Filters out
 * guardians with no linked players.
 *
 * Shape:
 *   guardians: [{ id, firstName, lastName, childNames: ['Charlie', 'Milo'] }]
 */
export function useOrgGuardians() {
  const { orgId } = useAuth();
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!orgId) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setGuardians([]);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });

    (async () => {
      const { data, error: err } = await supabase
        .from('guardians')
        .select('id, first_name, last_name, player_guardians(players(first_name))')
        .eq('org_id', orgId)
        .order('last_name', { ascending: true });

      if (cancelled) return;

      if (err) {
        setError(err);
        setGuardians([]);
      } else {
        const shaped = (data ?? [])
          .filter((g) => (g.player_guardians ?? []).length > 0)
          .map((g) => ({
            id: g.id,
            firstName: g.first_name,
            lastName: g.last_name,
            childNames: (g.player_guardians ?? [])
              .map((pg) => pg.players?.first_name)
              .filter(Boolean),
          }));
        setGuardians(shaped);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return { guardians, loading, error };
}
