import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Returns Aster AAU tournaments with embedded participants for the
 * public /records page. Each tournament has a `participants` array (sorted
 * by team sort_order) and a derived `display_status` field:
 *   'Complete' | 'Up Next' | 'Upcoming'
 *
 * Distinct from the authenticated `useTournaments` hook (used by
 * TournamentsPage admin) which has create/update/archive mutations,
 * pagination, caching. This hook is read-only, simpler shape, public RLS.
 *
 * Public-readable via Migrations 025/029. Anon and authenticated both work.
 */
export function usePublicTournaments(orgId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orgId) {
      // Microtask wrap satisfies react-hooks/set-state-in-effect.
      Promise.resolve().then(() => { setData([]); setLoading(false); });
      return;
    }

    let cancelled = false;
    Promise.resolve().then(() => { setLoading(true); setError(null); });

    (async () => {
      const { data: rows, error: err } = await supabase
        .from('tournaments')
        .select(`
          id, name, start_date, end_date, status, primary_venue, circuit,
          tournament_teams (
            final_place,
            final_record_wins,
            final_record_losses,
            team:teams!inner ( id, name, team_color, sort_order )
          )
        `)
        .eq('org_id', orgId)
        .neq('status', 'archived')
        .order('start_date', { ascending: true });

      if (cancelled) return;

      if (err) {
        setError(err);
        setData([]);
        setLoading(false);
        return;
      }

      // NY-anchored YYYY-MM-DD for today (en-CA always returns ISO date format).
      // Pin to America/New_York so a late-night CEST admin doesn't misclassify
      // a tournament ending TODAY in NY as "past".
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

      // First future tournament (end_date >= today) gets "Up Next"
      const futureTournaments = (rows || []).filter(t => t.end_date >= todayStr);
      const upNextId = futureTournaments.length > 0 ? futureTournaments[0].id : null;

      const enriched = (rows || []).map(t => ({
        ...t,
        participants: (t.tournament_teams || [])
          .filter(tt => tt.team)
          .sort((a, b) => (a.team.sort_order ?? 99) - (b.team.sort_order ?? 99)),
        display_status:
          t.end_date < todayStr ? 'Complete' :
          t.id === upNextId ? 'Up Next' :
          'Upcoming',
      }));

      setData(enriched);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [orgId]);

  return { data, loading, error };
}
