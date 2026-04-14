import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useRoster(teamId) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!teamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('roster_members')
        .select('jersey_number, jersey_size, shorts_size, payment_status, players(id, first_name, last_name, grade, member_type)')
        .eq('team_id', teamId);
      if (error) throw error;
      const mapped = (data || []).map((rm) => ({
        id: rm.players.id,
        first_name: rm.players.first_name,
        last_name: rm.players.last_name,
        grade: rm.players.grade,
        member_type: rm.players.member_type,
        jersey_number: rm.jersey_number,
        jersey_size: rm.jersey_size,
        shorts_size: rm.shorts_size,
        payment_status: rm.payment_status || 'paid',
      }));
      setPlayers(mapped);
    } catch (err) {
      console.error('useRoster:', err.message);
      setPlayers([]);
    }
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { players, loading, refetch };
}
