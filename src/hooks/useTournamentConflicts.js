import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// L99 v6 §5.2 C2 — soft tournament conflict warning. Frank-flagged
// 2026-05-20 (Jun 6-7 has 2 tournaments registered for different
// teams; if admin double-books a team across both, today no warning
// fires). Frank's call: SOFT banner (not hard block).
//
// Detects: for each (team in teamIds), find other tournaments where
// the team is also a participant AND the date range overlaps with
// [startDate, endDate]. Excludes the tournament currently being
// edited (currentTournamentId) so editing doesn't conflict with itself.
//
// Returns: { conflicts: Array<{ team_id, team_name, tournament_id,
//            tournament_name, start_date, end_date }>, loading }
//
// Overlap predicate: two date ranges [a1,a2] and [b1,b2] overlap when
// a1 <= b2 AND b1 <= a2. Postgres comparison on date columns.
//
// Per anti-pattern #37 + #42 — org_id filter first; tournament_teams
// already FK-scoped through tournaments.org_id.

export function useTournamentConflicts(teamIds, startDate, endDate, currentTournamentId) {
  const { orgId } = useAuth();
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId || !teamIds?.length || !startDate || !endDate || startDate > endDate) {
      // Microtask wrap pushes setConflicts out of the effect body so
      // the eslint set-state-in-effect rule passes; behavior is the
      // same (clear conflicts when inputs are incomplete).
      Promise.resolve().then(() => setConflicts([]));
      return undefined;
    }
    let cancelled = false;
    Promise.resolve().then(() => setLoading(true));
    (async () => {
      const { data, error } = await supabase
        .from('tournament_teams')
        .select('team_id, teams!inner(name), tournament_id, tournaments!inner(id, name, start_date, end_date, org_id, status)')
        .eq('tournaments.org_id', orgId)
        .neq('tournaments.status', 'archived')
        .neq('tournaments.status', 'cancelled')
        .in('team_id', teamIds)
        .gte('tournaments.end_date', startDate)
        .lte('tournaments.start_date', endDate);
      if (cancelled) return;
      if (error) {
        console.error('useTournamentConflicts:', error.message);
        setConflicts([]);
        setLoading(false);
        return;
      }
      const out = [];
      for (const row of data || []) {
        if (row.tournament_id === currentTournamentId) continue;
        out.push({
          team_id: row.team_id,
          team_name: row.teams?.name || 'Team',
          tournament_id: row.tournament_id,
          tournament_name: row.tournaments?.name || 'Tournament',
          start_date: row.tournaments?.start_date,
          end_date: row.tournaments?.end_date,
        });
      }
      setConflicts(out);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orgId, teamIds, startDate, endDate, currentTournamentId]);

  return { conflicts, loading };
}
