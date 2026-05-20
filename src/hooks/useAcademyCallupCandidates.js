import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Returns Academy Futures candidates for a given event team. Sort tiers:
//   1. same age band as event team
//   2. adjacent (±1 grade)
//   3. other
// Sort is helpful, NOT gating — operator can call up any candidate.
// Decoration uses team_name age prefix ("8U Boys" → 8). Falls back to
// 'other' when the team_name doesn't match the pattern.
//
// May 16 audit P2 #12 (PR #322): added useAuth context so the
// team_players query scopes by org via the teams!inner.org_id FK
// chain. Pre-PR the query had no org filter — RLS may mask via
// team-scope policies, but the application-layer org_id filter is
// the right discipline per anti-pattern #37.

const AGE_PREFIX = /^(\d+)U/i;
const TIER_ORDER = { same: 0, adjacent: 1, other: 2 };

function extractGrade(teamName) {
  const m = (teamName || '').match(AGE_PREFIX);
  return m ? Number(m[1]) : null;
}

function tierFor(candidateGrade, eventGrade) {
  if (candidateGrade == null || eventGrade == null) return 'other';
  const diff = Math.abs(candidateGrade - eventGrade);
  if (diff === 0) return 'same';
  if (diff === 1) return 'adjacent';
  return 'other';
}

export function useAcademyCallupCandidates({ eventTeamName }) {
  const { orgId } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    Promise.resolve().then(async () => {
      if (cancelled.current) return;
      if (!orgId) { setCandidates([]); setLoading(false); return; }
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('team_players')
        .select(`
          player_id, jersey_number, status, roster_type,
          players!inner ( id, first_name, last_name, member_type ),
          teams!inner ( id, name, org_id )
        `)
        .eq('teams.org_id', orgId)
        .eq('roster_type', 'futures')
        .eq('status', 'active');
      if (cancelled.current) return;
      if (err) { setError(err); setCandidates([]); setLoading(false); return; }
      const eventGrade = extractGrade(eventTeamName);
      const rows = (data || [])
        .filter((row) => row.players?.member_type === 'futures_academy')
        .map((row) => ({
          id: row.player_id,
          first_name: row.players.first_name,
          last_name: row.players.last_name,
          jersey_number: row.jersey_number,
          team_name: row.teams?.name || '',
          team_grade: extractGrade(row.teams?.name),
          tier: tierFor(extractGrade(row.teams?.name), eventGrade),
        }));
      // Dedupe by player_id (a player can be on multiple futures teams);
      // keep the row with the lowest tier order.
      const byPlayer = new Map();
      for (const r of rows) {
        const existing = byPlayer.get(r.id);
        if (!existing || TIER_ORDER[r.tier] < TIER_ORDER[existing.tier]) {
          byPlayer.set(r.id, r);
        }
      }
      const sorted = [...byPlayer.values()].sort((a, b) => {
        const t = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
        if (t !== 0) return t;
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      });
      setCandidates(sorted);
      setLoading(false);
    });
    return () => { cancelled.current = true; };
  }, [eventTeamName, orgId]);

  return { candidates, loading, error };
}
