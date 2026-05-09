import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { periodIsoBounds } from '../lib/engine/digestPeriod';

// Fetches events in [period.start, period.end] (NY-local day) for any
// team in the org. Returns:
//   events: array of event rows joined with team info
//   tournaments: dedupe array of tournament rows referenced by events
//   teams: dedupe array of teams referenced by events
// The DigestComposer slices events per family by team_id intersection.

export function useDigestEvents({ orgId, period }) {
  const [data, setData] = useState({ events: [], tournaments: [], teams: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bounds = useMemo(() => periodIsoBounds(period), [period]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!orgId || !bounds.startIso || !bounds.endIso) {
        setData({ events: [], tournaments: [], teams: [] });
        setLoading(false); setError(null);
        return;
      }
      setLoading(true); setError(null);
      const { data: rows, error: err } = await supabase
        .from('events')
        .select(`
          id, team_id, event_type, start_at, end_at, location, sub_location,
          opponent, tournament_id, tournament_name,
          is_bracket_placeholder, bracket_placeholder_label, status,
          teams!inner ( id, name, team_color, sort_order, org_id )
        `)
        .eq('teams.org_id', orgId)
        .neq('status', 'cancelled')
        .gte('start_at', bounds.startIso)
        .lt('start_at', bounds.endIso)
        .order('start_at', { ascending: true });
      if (cancelled) return;
      if (err) { setError(err); setData({ events: [], tournaments: [], teams: [] }); setLoading(false); return; }

      const teamsMap = new Map();
      for (const ev of rows || []) {
        if (ev.teams && !teamsMap.has(ev.teams.id)) teamsMap.set(ev.teams.id, ev.teams);
      }
      const tournamentIds = [...new Set((rows || []).map((r) => r.tournament_id).filter(Boolean))];
      let tournaments = [];
      if (tournamentIds.length) {
        const { data: trows } = await supabase
          .from('tournaments')
          .select('id, name, start_date, end_date, rules')
          .in('id', tournamentIds);
        tournaments = trows || [];
      }
      if (cancelled) return;
      setData({ events: rows || [], tournaments, teams: [...teamsMap.values()] });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId, bounds.startIso, bounds.endIso]);

  return { ...data, loading, error };
}
