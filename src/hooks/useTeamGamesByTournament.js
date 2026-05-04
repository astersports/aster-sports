import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useTeamGamesByTournament(teamId) {
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('game_results')
        .select(`
          id, our_score, opponent_score, result, published_at,
          event:events!inner (
            id, team_id, opponent, start_at, is_championship_final,
            tournament_id,
            tournament:tournaments ( id, name, start_date, end_date )
          )
        `)
        .not('published_at', 'is', null)
        .eq('events.team_id', teamId)
        .order('start_at', { foreignTable: 'events', ascending: true });
      if (cancelled) return;
      if (error) console.error('useTeamGamesByTournament:', error.message);
      setGames(data || []);
      setLoading(false);
    }
    if (teamId) Promise.resolve().then(load);
    else Promise.resolve().then(() => { setGames([]); setLoading(false); });
    return () => { cancelled = true; };
  }, [teamId]);

  const grouped = useMemo(() => {
    const tourneys = {};
    const standalone = [];
    games.forEach((g) => {
      const tid = g.event?.tournament_id;
      if (tid && g.event?.tournament) {
        if (!tourneys[tid]) tourneys[tid] = { tournament: g.event.tournament, games: [] };
        tourneys[tid].games.push(g);
      } else {
        standalone.push(g);
      }
    });
    const tourneyList = Object.values(tourneys).sort(
      (a, b) => new Date(a.tournament.start_date) - new Date(b.tournament.start_date)
    );
    return { tournaments: tourneyList, standalone };
  }, [games]);

  return { loading, grouped };
}
