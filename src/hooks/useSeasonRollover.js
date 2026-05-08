import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';

export function useSeasonRollover(fromSeason, orgId) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (plan) => {
    if (!fromSeason?.id || !orgId || !user?.id) return null;
    setLoading(true);
    try {
      const { data: newSeason, error: sErr } = await supabase.from('seasons').insert({
        org_id: orgId,
        name: plan.newSeasonName,
        start_date: plan.startDate,
        end_date: plan.endDate,
        status: 'planning',
        parent_season_id: fromSeason.id,
      }).select().single();
      if (sErr) throw sErr;

      await supabase.from('seasons').update({ status: 'archived', rolled_over_at: new Date().toISOString() }).eq('id', fromSeason.id);

      let playersCarried = 0, playersAdvanced = 0, playersDropped = 0, coachesCarried = 0, teamsRecreated = 0;

      if (plan.carryLocations !== false) {
        const { data: fromLocs, error: lErr } = await supabase
          .from('season_locations').select('location_id').eq('season_id', fromSeason.id);
        if (lErr) console.error('rollover carryLocations read:', lErr.message);
        else if (fromLocs?.length) {
          const rows = fromLocs.map((r) => ({ season_id: newSeason.id, location_id: r.location_id }));
          const { error: insErr } = await supabase.from('season_locations').insert(rows);
          if (insErr) console.error('rollover carryLocations insert:', insErr.message);
        }
      }

      for (const t of (plan.teams || [])) {
        const { data: newTeam } = await supabase.from('teams').insert({
          org_id: orgId, season_id: newSeason.id, name: t.name, team_color: t.team_color, sort_order: t.sort_order,
          age_group: t.age_group, division: t.division, circuit: t.circuit,
        }).select().single();
        if (newTeam) teamsRecreated++;

        for (const p of (t.players || [])) {
          if (p.action === 'drop') { playersDropped++; continue; }
          await supabase.from('roster_members').insert({
            team_id: newTeam.id, player_id: p.id, roster_type: 'roster',
          });
          playersCarried++;
          if (p.action === 'advance') playersAdvanced++;
        }

        for (const c of (t.coaches || [])) {
          if (!c.keep) continue;
          await supabase.from('team_staff').insert({ team_id: newTeam.id, user_id: c.user_id, role: c.role });
          coachesCarried++;
        }
      }

      const { data: rollover } = await supabase.from('season_rollovers').insert({
        from_season_id: fromSeason.id, to_season_id: newSeason.id, org_id: orgId,
        initiated_by: user.id, players_carried: playersCarried, players_advanced_age: playersAdvanced,
        players_dropped: playersDropped, coaches_carried: coachesCarried, teams_recreated: teamsRecreated,
        financial_balances_carried_cents: 0, status: 'complete', completed_at: new Date().toISOString(),
      }).select().single();

      showToast('Season rolled over successfully.', 'success');
      setLoading(false);
      return rollover;
    } catch (err) {
      console.error('useSeasonRollover:', err.message);
      showToast("Rollover hit a snag. Check what got created and try again.", 'error');
      setLoading(false);
      return null;
    }
  }, [fromSeason, orgId, user, showToast]);

  return { execute, loading };
}
