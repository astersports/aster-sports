import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// Maps each guardian (financial-account owner) to the team(s) their kids are
// rostered on for a season, so Financials → Families can GROUP by team
// (financial_accounts carry no team_id — billing is per family per season).
// Path: season teams → team_players (active) → those players' guardians.
// Returns the ordered team list too, for stable group ordering.
export function useFamilyTeams(orgId, seasonId) {
  const [teamsByGuardian, setTeamsByGuardian] = useState({});
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!orgId || !seasonId) { setTeamsByGuardian({}); setTeams([]); setLoading(false); return; }
    setLoading(true);
    const id = ++fetchIdRef.current;
    const teamsRes = await supabase.from('teams').select('id, name, sort_order').eq('org_id', orgId).eq('season_id', seasonId).order('sort_order');
    if (id !== fetchIdRef.current) return;
    if (teamsRes.error) { console.error('useFamilyTeams teams:', teamsRes.error.message); setLoading(false); return; }
    const teamList = teamsRes.data || [];
    const teamIds = teamList.map((t) => t.id);
    if (teamIds.length === 0) { setTeams([]); setTeamsByGuardian({}); setLoading(false); return; }

    const tpRes = await supabase.from('team_players').select('team_id, player_id').in('team_id', teamIds).eq('status', 'active');
    if (id !== fetchIdRef.current) return;
    if (tpRes.error) console.error('useFamilyTeams team_players:', tpRes.error.message);
    const tp = tpRes.data || [];
    const playerIds = [...new Set(tp.map((r) => r.player_id))];

    let pg = [];
    if (playerIds.length) {
      const pgRes = await supabase.from('player_guardians').select('player_id, guardian_id').in('player_id', playerIds);
      if (id !== fetchIdRef.current) return;
      if (pgRes.error) console.error('useFamilyTeams player_guardians:', pgRes.error.message);
      pg = pgRes.data || [];
    }

    const playerTeams = {};
    tp.forEach((r) => { (playerTeams[r.player_id] ||= new Set()).add(r.team_id); });
    const gMap = {};
    pg.forEach((r) => {
      const set = (gMap[r.guardian_id] ||= new Set());
      (playerTeams[r.player_id] || []).forEach((tid) => set.add(tid));
    });
    const out = {};
    Object.entries(gMap).forEach(([gid, set]) => { out[gid] = [...set]; });

    setTeams(teamList);
    setTeamsByGuardian(out);
    setLoading(false);
  }, [orgId, seasonId]);

  useEffect(() => { Promise.resolve().then(load); }, [load]);

  return { teamsByGuardian, teams, loading };
}
