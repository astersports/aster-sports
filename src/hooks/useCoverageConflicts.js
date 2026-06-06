// Cutover Wave PR 6 (PR B) — coach double-booking detection for the
// schedule importer. Broad scope (Q2): fetches ALL events for the teams
// in the import within a ±1-day window around the parsed games, plus the
// teams' head coaches and any existing per-event assignments, then runs
// the pure detector. Soft (Q4) — this only reports; PR C's UI decides.
//
// Design: docs/AUDIT_COVERAGE_DELEGATION_PR6_2026-05-27.md
// AP #36: every Supabase chain destructures { data, error } and surfaces
// error before using data. AP #37: events fetch is team-scoped (events is
// FK-scoped to teams.org_id; no org_id column).

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { buildConflictItems, detectCoverageConflicts } from '../lib/import/coverageConflicts';

const DAY_MS = 24 * 60 * 60 * 1000;

export function useCoverageConflicts(rows) {
  const [conflicts, setConflicts] = useState([]);
  const [coachNameMap, setCoachNameMap] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stable primitive deps: the set of teams + the staged delegations.
  // Recompute when either changes (a delegation in PR C re-runs detection).
  const teamIds = [...new Set((rows || []).filter((r) => r.status !== 'error' && r.resolved?.team_id).map((r) => r.resolved.team_id))];
  const teamKey = teamIds.slice().sort().join(',');
  const delegationKey = (rows || []).map((r) => r.delegated_coach_user_id || '').join(',');
  const starts = (rows || []).map((r) => r.resolved?.start_at).filter(Boolean).map((s) => new Date(s).getTime());

  useEffect(() => {
    if (!teamIds.length || !starts.length) {
      Promise.resolve().then(() => { setConflicts([]); setLoading(false); });
      return undefined;
    }
    let cancelled = false;
    const winStart = new Date(Math.min(...starts) - DAY_MS).toISOString();
    const winEnd = new Date(Math.max(...starts) + DAY_MS).toISOString();
    Promise.resolve().then(() => setLoading(true));
    (async () => {
      try {
        const { data: events, error: evErr } = await supabase
          .from('events')
          .select('id, team_id, start_at, end_at, opponent, title')
          .in('team_id', teamIds)
          .gte('start_at', winStart)
          .lte('start_at', winEnd);
        if (evErr) throw evErr;

        // staff_profiles has NO FK from team_staff — embedding it throws
        // "Could not find a relationship". Fetch team_staff, then
        // staff_profiles by user_id, and join the names in JS below.
        const { data: staff, error: stErr } = await supabase
          .from('team_staff')
          .select('team_id, user_id, role')
          .in('team_id', teamIds)
          .eq('role', 'head_coach');
        if (stErr) throw stErr;

        const staffUserIds = [...new Set((staff || []).map((s) => s.user_id).filter(Boolean))];
        let profByUser = new Map();
        if (staffUserIds.length) {
          const { data: profData, error: pErr } = await supabase
            .from('staff_profiles')
            .select('user_id, display_name')
            .in('user_id', staffUserIds);
          if (pErr) throw pErr;
          profByUser = new Map((profData || []).map((p) => [p.user_id, p]));
        }

        const eventIds = (events || []).map((e) => e.id);
        let assignments = [];
        if (eventIds.length) {
          const { data: asg, error: asErr } = await supabase
            .from('event_coach_assignments')
            .select('event_id, coach_user_id')
            .in('event_id', eventIds);
          if (asErr) throw asErr;
          assignments = asg || [];
        }
        if (cancelled) return;

        const teamHeadCoachMap = new Map();
        const names = new Map();
        for (const s of staff || []) {
          if (!teamHeadCoachMap.has(s.team_id)) teamHeadCoachMap.set(s.team_id, s.user_id);
          const dn = profByUser.get(s.user_id)?.display_name;
          if (s.user_id && dn) names.set(s.user_id, dn);
        }
        const assignmentMap = new Map(assignments.map((a) => [a.event_id, a.coach_user_id]));

        const items = buildConflictItems(rows, events || []);
        const clusters = detectCoverageConflicts(items, { assignmentMap, teamHeadCoachMap });
        setConflicts(clusters);
        setCoachNameMap(names);
        setError(null);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        console.error('useCoverageConflicts:', e.message);
        setError(e);
        setConflicts([]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamKey, delegationKey]);

  return { conflicts, coachNameMap, loading, error };
}
