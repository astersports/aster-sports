import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Loads the events for a (tournament, team) pair, shaped to feed the
// generateTournamentBriefing engine in src/lib/tournamentBriefing.js.
// Cancelled events are excluded so the briefing matches what families
// would actually attend.
export function useTournamentEvents(tournamentId, teamId) {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!tournamentId || !teamId) {
        setEvents([]); setLoading(false); setError(null);
        return;
      }
      setLoading(true); setError(null);
      const { data, error: err } = await supabase
        .from('events')
        .select('id, title, start_at, end_at, opponent, home_away, location, sub_location, event_type, status')
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamId)
        .neq('status', 'cancelled')
        .order('start_at', { ascending: true });
      if (cancelled) return;
      if (err) { setError(err); setEvents([]); }
      else setEvents(data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [tournamentId, teamId]);

  return { events, loading, error };
}
