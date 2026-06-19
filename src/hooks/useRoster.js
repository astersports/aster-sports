// CLAUDE.md §11.5 (reconciled PR 8, 2026-05-31): jersey_size + shorts_size
// are now canonical on `player_equipment` (per (player, season, sport));
// roster_members.{jersey_size,shorts_size} are kept in sync by the
// align_player_equipment_from_roster_member trigger but are no longer read
// by UI. This hook reads SIZES from player_equipment (scoped to the team's
// season) and keeps jersey_NUMBER from roster_members (numbers stay canonical
// on team_players/roster_members per §11.5). Consumers: ArrivalBoard,
// PlayerOfGamePicker, LiveScorePage, TeamDetailPage.
// Payment status: derived from the canonical `family_balances` view, NOT the
// legacy roster_members.payment_status column (a stale 'paid' constant). Scoped
// to the team's SEASON (Frank 2026-06-19 — overrides the Cat#30 ROSTER-1
// all-seasons rule for the roster dot: a Summer roster shows the Summer balance,
// not a prior season's debt). balance>0 with prior payments → 'partial';
// balance>0 with none → 'overdue'; else 'paid'. (NOTE: reconcile CLAUDE.md §11.5
// / Cat#30 to record this roster-scope override.)

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
        .select('jersey_number, teams(season_id), players(id, first_name, last_name, grade, dob, member_type, player_guardians(guardian_id, guardians(id, first_name, last_name, email, phone, user_id)))')
        .eq('team_id', teamId);
      if (error) throw error;
      const seasonId = (data || []).find((rm) => rm.teams?.season_id)?.teams?.season_id || null;
      // Sizes (canonical on player_equipment, scoped to this team's season).
      const sizeByPlayer = {};
      const playerIds = (data || []).filter((rm) => rm.players).map((rm) => rm.players.id);
      // Academy status is per-team (§11.5: team_players.roster_type), NOT the
      // global players.member_type — a kid can be futures_academy org-wide but
      // 'rostered' on THIS team. Reading member_type mislabeled such rows
      // (Cat#30 ROSTER-3). Map player_id -> roster_type for this team.
      const rosterTypeByPlayer = {};
      if (playerIds.length) {
        const { data: tp, error: tpErr } = await supabase
          .from('team_players').select('player_id, roster_type').eq('team_id', teamId);
        if (tpErr) throw tpErr;
        for (const r of tp || []) rosterTypeByPlayer[r.player_id] = r.roster_type;
      }
      if (seasonId && playerIds.length) {
        const { data: eq, error: eqErr } = await supabase
          .from('player_equipment')
          .select('player_id, jersey_size, shorts_size')
          .eq('season_id', seasonId)
          .in('player_id', playerIds);
        if (eqErr) throw eqErr;
        for (const r of eq || []) sizeByPlayer[r.player_id] = r;
      }
      const mapped = (data || []).filter((rm) => rm.players).map((rm) => ({
        id: rm.players.id,
        first_name: rm.players.first_name,
        last_name: rm.players.last_name,
        grade: rm.players.grade,
        dob: rm.players.dob || null,
        member_type: rm.players.member_type,
        roster_type: rosterTypeByPlayer[rm.players.id] ?? null,
        jersey_number: rm.jersey_number,
        jersey_size: sizeByPlayer[rm.players.id]?.jersey_size ?? null,
        shorts_size: sizeByPlayer[rm.players.id]?.shorts_size ?? null,
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
        // Season-scoped (Frank 2026-06-19): the roster dot reflects THIS season,
        // not all-seasons. Falls back to all-seasons only if seasonId is unknown.
        let fbq = supabase.from('family_balances')
          .select('guardian_id, balance_cents, net_paid_cents')
          .in('guardian_id', guardianIds);
        if (seasonId) fbq = fbq.eq('season_id', seasonId);
        const { data: fb, error: fbErr } = await fbq;
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
        // Signed balance for the admin roster money line (PR-1 paymentSignal).
        // All-seasons per Cat#30 ROSTER-1; scope reconciliation deferred to PR-3.
        p.balance_cents = balance;
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
