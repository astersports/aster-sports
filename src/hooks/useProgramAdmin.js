import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { checkSlugAvailable } from '../lib/programSetup';
import { programRule } from '../lib/programRegistry';

// Dependency counts + update/delete for a single program (PR-3 F14). Counts feed
// the delete-confirm; the FK chain cascades teams → {team_players,
// roster_members, events} so the delete itself is clean (verified ON DELETE
// CASCADE). AP#36: errors surfaced by callers via the returned message.
export function useProgramAdmin(programId) {
  const { orgId } = useAuth();
  const [counts, setCounts] = useState({ teams: 0, players: 0, events: 0 });

  const refetchCounts = useCallback(async () => {
    if (!orgId || !programId) return;
    const { data: teams, error } = await supabase
      .from('teams').select('id').eq('org_id', orgId).eq('season_id', programId);
    if (error) { console.error('useProgramAdmin teams:', error.message); return; }
    const teamIds = (teams || []).map((t) => t.id);
    if (!teamIds.length) { setCounts({ teams: 0, players: 0, events: 0 }); return; }
    const [pRes, eRes] = await Promise.all([
      supabase.from('team_players').select('id', { count: 'exact', head: true }).in('team_id', teamIds),
      supabase.from('events').select('id', { count: 'exact', head: true }).in('team_id', teamIds),
    ]);
    if (pRes.error) console.error('useProgramAdmin players:', pRes.error.message);
    if (eRes.error) console.error('useProgramAdmin events:', eRes.error.message);
    setCounts({ teams: teamIds.length, players: pRes.count || 0, events: eRes.count || 0 });
  }, [orgId, programId]);

  useEffect(() => { Promise.resolve().then(refetchCounts); }, [refetchCounts]);

  const updateProgram = useCallback(async (fields) => {
    // Edit must not let a renamed public link collide with another program (F3);
    // exclude self so a program never collides with its own slug.
    if (fields.public_slug) {
      const slugErr = await checkSlugAvailable(supabase, orgId, fields.public_slug, programId);
      if (slugErr) return { error: slugErr };
    }
    const { error } = await supabase.from('programs').update(fields).eq('id', programId);
    return { error: error?.message };
  }, [orgId, programId]);

  const deleteProgram = useCallback(async () => {
    // Records that must NEVER be lost to a program delete. registrations.program_id
    // and financial_accounts.season_id (S4) are ON DELETE RESTRICT; coach_payouts.
    // season_id is NO ACTION. Count FIRST and BLOCK with kind "archive instead"
    // microcopy; the 23503 catch below backstops any other RESTRICT FK (e.g.
    // teams.season_id once H-4 flips it from CASCADE to RESTRICT). Teams/roster/
    // events still ON DELETE CASCADE today — those counts show in the confirm summary.
    const [regRes, finRes, payRes] = await Promise.all([
      supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('program_id', programId),
      supabase.from('financial_accounts').select('id', { count: 'exact', head: true }).eq('season_id', programId),
      supabase.from('coach_payouts').select('id', { count: 'exact', head: true }).eq('season_id', programId),
    ]);
    for (const r of [regRes, finRes, payRes]) if (r.error) return { error: r.error.message };
    if (regRes.count) return { error: `This program can't be deleted — ${regRes.count} famil${regRes.count === 1 ? 'y has' : 'ies have'} registered. Archive it instead.` };
    if ((finRes.count || 0) + (payRes.count || 0) > 0) return { error: "This program can't be deleted — it has financial records. Archive it instead." };
    const { error } = await supabase.from('programs').delete().eq('id', programId);
    if (error) {
      if (error.code === '23503') return { error: "This program can't be deleted — it has linked records. Archive it instead." };
      return { error: error.message };
    }
    return { error: null };
  }, [programId]);

  // Unified activate() parametrized by registry.singleActive (Fork 3): one
  // concept, not two naked paths. For single-active types (season) archive the
  // org's current active program of the SAME type first; the partial-unique DB
  // index (programs_one_active_season_per_org) backstops this app-level write.
  const activate = useCallback(async (programType) => {
    if (programRule(programType).singleActive) {
      const { error: archErr } = await supabase.from('programs')
        .update({ status: 'archived' })
        .eq('org_id', orgId).eq('program_type', programType).eq('status', 'active').neq('id', programId);
      if (archErr) return { error: archErr.message };
    }
    const { error } = await supabase.from('programs').update({ status: 'active' }).eq('id', programId);
    return { error: error?.message };
  }, [orgId, programId]);

  return { counts, refetchCounts, updateProgram, deleteProgram, activate };
}
