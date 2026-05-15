// CLAUDE.md §11.5 exception (Wave 4.8 hygiene PR #124): roster_members
// is the canonical home for jersey_size + shorts_size — team_players does
// not carry those columns. Migration to team_players would require either
// schema additions or a parallel JOIN, neither justified for this hook's
// 4 consumers (ArrivalBoard, PlayerOfGamePicker, LiveScorePage,
// TeamDetailPage). Stay on roster_members.
// Separate concern (not addressed here): the `payment_status` column read
// at line 14 is the LEGACY field per §11.5 line 414 — canonical financial
// truth is `financial_accounts` + `financial_transactions`. A future PR
// can migrate that single column to the financial tables; out of scope
// for the §11.5 doctrine cleanup.

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
        .select('jersey_number, jersey_size, shorts_size, payment_status, players(id, first_name, last_name, grade, dob, member_type, player_guardians(guardian_id, guardians(id, first_name, last_name, email, phone, user_id)))')
        .eq('team_id', teamId);
      if (error) throw error;
      const mapped = (data || []).filter((rm) => rm.players).map((rm) => ({
        id: rm.players.id,
        first_name: rm.players.first_name,
        last_name: rm.players.last_name,
        grade: rm.players.grade,
        dob: rm.players.dob || null,
        member_type: rm.players.member_type,
        jersey_number: rm.jersey_number,
        jersey_size: rm.jersey_size,
        shorts_size: rm.shorts_size,
        payment_status: rm.payment_status || 'paid',
        guardians: (rm.players.player_guardians || [])
          .map((pg) => pg.guardians)
          .filter(Boolean)
          .map((g) => ({ id: g.id, firstName: g.first_name, lastName: g.last_name, email: g.email, phone: g.phone, userId: g.user_id })),
      }));
      setPlayers(mapped);
    } catch (err) {
      console.error('useRoster:', err.message);
      setPlayers([]);
    }
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    (async () => { await refetch(); })();
  }, [refetch]);

  return { players, loading, refetch };
}
