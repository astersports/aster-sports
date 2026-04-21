import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Fetches one tournament by id, scoped to org. Returns full detail including
// linked teams with colors. Exposes refetch for callers (e.g., after edit).

export function useTournament(tournamentId) {
  const { orgId } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!orgId || !tournamentId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('tournaments')
        .select('id, org_id, name, circuit, start_date, end_date, primary_venue, primary_venue_address, tourney_url, hotel_url, hotel_deadline_at, rsvp_deadline_at, survival_notes, game_day_guide, pool_label, schedule_status, status, archived_at, roster_locked_at, tournament_teams(team_id, teams(id, name, sort_order, team_color))')
        .eq('org_id', orgId)
        .eq('id', tournamentId)
        .maybeSingle();
      if (err) throw err;
      if (!data) { setTournament(null); return; }
      const teams = (data.tournament_teams || [])
        .map((tt) => tt.teams).filter(Boolean)
        .sort((a, b) => a.sort_order - b.sort_order);
      setTournament({ ...data, teams });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [orgId, tournamentId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { tournament, loading, error, refetch: fetch };
}
