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
      // PostgREST's `.order(..., { foreignTable: 'events' })` applies to
      // embedded subarrays, NOT to top-level result rows — so the rows
      // come back in DB insertion (score-entry) order, not by game
      // date. computeSummary does its own start_at sort
      // (teamRecords.js:28) so summary stats stay correct, but the
      // per-game log on the Records page rendered in score-entry order.
      // Sort in JS to match user expectation. Frank-reported 2026-05-20.
      const sorted = [...(data || [])].sort((a, b) => {
        const da = a.event?.start_at || '';
        const db = b.event?.start_at || '';
        return da < db ? -1 : da > db ? 1 : 0;
      });
      setGames(sorted);
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
