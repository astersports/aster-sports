import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { assembleFamily } from '../lib/familyPrograms';

// Parent "My Family" data (PR-B1). Each child's program enrollments (imported
// roster + funnel registrations), the per-program family balance (parent-own;
// family_balances), and the open programs the family can still register into.
// Every read is RLS parent-scoped (players/roster_members/registrations/
// family_balances narrow to the caller's family; programs/teams are org-readable).
// AP#36: each result's error is surfaced, never swallowed into a silent empty.
export function useFamilyPrograms() {
  const { orgId } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId) { setData(null); setLoading(false); return; }
    setLoading(true);
    // OWN children only. `players` is NOT a safe "my kids" source: its RLS
    // ORs in teammates (players_select_parent_team) so a parent can read
    // their kids' teammates for roster lists — reading it unfiltered leaked
    // the whole teammate set onto My Family + the registration lane (§11.5
    // ground-truth class). player_guardians IS RLS-scoped to the caller's
    // guardian (guardian_id = current_user_guardian_id()); scope players by
    // the own-child ids it returns (works whether or not a kid is rostered).
    const { data: links, error: e0 } = await supabase
      .from('player_guardians').select('player_id');
    if (e0) { setError(e0.message); setData(null); setLoading(false); return; }
    const ownIds = [...new Set((links || []).map((l) => l.player_id))];
    if (ownIds.length === 0) { setData({ children: [], familyBalances: [], openPrograms: [] }); setError(null); setLoading(false); return; }
    const { data: kids, error: e1 } = await supabase
      .from('players').select('id, first_name, last_name, grade').in('id', ownIds).order('first_name');
    if (e1) { setError(e1.message); setData(null); setLoading(false); return; }
    const kidIds = (kids || []).map((k) => k.id);
    if (kidIds.length === 0) { setData({ children: [], familyBalances: [], openPrograms: [] }); setError(null); setLoading(false); return; }

    const [rosterRes, regRes, balRes, progRes] = await Promise.all([
      supabase.from('roster_members').select('player_id, team_id').in('player_id', kidIds).is('left_at', null),
      supabase.from('registrations').select('player_id, status, program_id').in('player_id', kidIds).neq('status', 'cancelled'),
      supabase.from('family_balances').select('season_id, balance_cents, billed_cents, net_paid_cents'),
      supabase.from('programs')
        .select('id, name, program_type, public_slug, reg_opens_at, reg_closes_at, is_published, divisions(grade_min, grade_max)')
        .eq('org_id', orgId),
    ]);
    const err = rosterRes.error || regRes.error || balRes.error || progRes.error;
    if (err) { setError(err.message); setData(null); setLoading(false); return; }

    const teamIds = [...new Set((rosterRes.data || []).map((r) => r.team_id))];
    let teams = [];
    if (teamIds.length) {
      const { data: t, error: tErr } = await supabase.from('teams').select('id, name, team_color, season_id').in('id', teamIds);
      if (tErr) { setError(tErr.message); setData(null); setLoading(false); return; }
      teams = t || [];
    }

    setData(assembleFamily({
      kids: kids || [], roster: rosterRes.data || [], teams,
      regs: regRes.data || [], balances: balRes.data || [], programs: progRes.data || [],
    }));
    setError(null);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);
  return { data, loading, error, refetch };
}
