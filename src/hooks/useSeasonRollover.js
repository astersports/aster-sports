import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { reportError } from '../lib/reportError';

export function useSeasonRollover(fromSeason, orgId) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (plan) => {
    if (!fromSeason?.id || !orgId || !user?.id) return null;
    setLoading(true);
    try {
      // One atomic SECURITY DEFINER RPC (20260609031536) replaces the prior ~5+N
      // uncoordinated client awaits: new draft season + carried locations + teams
      // (carrying team_type_id) + roster + coaches + the season_rollovers audit row
      // in ONE transaction. Fixes the old breakers (status 'planning' 23514;
      // roster_type 42703) and the non-atomic partial-failure orphan.
      const p_plan = {
        newSeasonName: plan.newSeasonName,
        startDate: plan.startDate,
        endDate: plan.endDate,
        carryLocations: plan.carryLocations !== false,
        activate: plan.activate === true,
        teams: (plan.teams || []).map((t) => ({
          src_team_id: t.src_team_id ?? t.id,
          name: t.name, team_color: t.team_color, sort_order: t.sort_order,
          age_group: t.age_group, division: t.division, circuit: t.circuit, gender: t.gender,
          players: (t.players || []).map((p) => ({ id: p.id, action: p.action })),
          coaches: (t.coaches || []).map((c) => ({ user_id: c.user_id, role: c.role, keep: c.keep })),
        })),
      };
      const { data: rollover, error } = await supabase.rpc('rollover_season', {
        p_from_season_id: fromSeason.id,
        p_plan,
      });
      if (error) throw error;
      showToast('Season rolled over successfully.', 'success');
      setLoading(false);
      return rollover;
    } catch (err) {
      reportError(err, { surface: 'useSeasonRollover.execute', fromSeasonId: fromSeason.id, orgId });
      showToast("Rollover hit a snag. Try again.", 'error');
      setLoading(false);
      return null;
    }
  }, [fromSeason, orgId, user, showToast]);

  return { execute, loading };
}
