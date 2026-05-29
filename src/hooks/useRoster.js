// CLAUDE.md §11.5 exception (Wave 4.8 hygiene PR #124): roster_members
// is the canonical home for jersey_size + shorts_size — team_players does
// not carry those columns. Migration to team_players would require either
// schema additions or a parallel JOIN, neither justified for this hook's
// 4 consumers (ArrivalBoard, PlayerOfGamePicker, LiveScorePage,
// TeamDetailPage). Stay on roster_members.
// Payment status (Cat#30 ROSTER-1 / §4.AW all-seasons decision): derived
// from the canonical `family_balances` view across ALL seasons, NOT the
// legacy roster_members.payment_status column (which was a stale constant —
// 'paid' for every row, structurally unable to flag an owing family).
// balance>0 with prior payments → 'partial'; balance>0 with none →
// 'overdue'; else 'paid'.

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
        .select('jersey_number, jersey_size, shorts_size, players(id, first_name, last_name, grade, dob, member_type, player_guardians(guardian_id, guardians(id, first_name, last_name, email, phone, user_id)))')
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
        guardians: (rm.players.player_guardians || [])
          .map((pg) => pg.guardians)
          .filter(Boolean)
          .map((g) => ({ id: g.id, firstName: g.first_name, lastName: g.last_name, email: g.email, phone: g.phone, userId: g.user_id })),
      }));
      // ROSTER-1: payment status from family_balances (all seasons), keyed
      // by guardian. The guardian ids came from this team's org-scoped
      // roster query, so .in() is safe; RLS scopes family_balances to org.
      const guardianIds = [...new Set(mapped.flatMap((p) => p.guardians.map((g) => g.id)))];
      const balByGuardian = {};
      if (guardianIds.length) {
        const { data: fb, error: fbErr } = await supabase
          .from('family_balances')
          .select('guardian_id, balance_cents, net_paid_cents')
          .in('guardian_id', guardianIds);
        if (fbErr) throw fbErr;
        for (const r of fb || []) {
          const b = balByGuardian[r.guardian_id] || { balance: 0, paid: 0 };
          b.balance += Number(r.balance_cents) || 0;
          b.paid += Number(r.net_paid_cents) || 0;
          balByGuardian[r.guardian_id] = b;
        }
      }
      for (const p of mapped) {
        let balance = 0; let paid = 0;
        for (const g of p.guardians) {
          const b = balByGuardian[g.id];
          if (b) { balance += b.balance; paid += b.paid; }
        }
        p.payment_status = balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'overdue';
      }
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
