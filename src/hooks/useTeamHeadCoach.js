import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// 2026-05-21 (Teams PR B) — returns the head coach for a team so the
// TeamDetailHero can render a "Coach Kenny · tap-to-call" contact
// line for parents. Co-coach rule per the L99 Teams audit Q5:
// `team_staff.head_coach` boolean was the proposed canonical flag;
// production schema check (via MCP, 2026-05-21) shows `team_staff`
// has only `role text` — so we filter on `role='head_coach'` and
// fall back to alphabetical sort by display_name if multiple rows
// match for one team.
//
// `staff_profiles` carries `display_name`, `phone`, `title` — no
// email column. The hero accepts `email: null` and skips the mailto
// line gracefully; email surfaces via the future staff-profiles
// email backfill (out of scope for this PR).
//
// Anti-pattern #36: destructure `error` and throw before trusting
// `data`. The fallback for the success-with-zero-rows case is
// `null` (no head coach assigned yet) — distinct from an error path.
export function useTeamHeadCoach(teamId) {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!teamId) {
        if (!cancelled) { setCoach(null); setLoading(false); }
        return;
      }
      setLoading(true);
      setError(null);
      // staff_profiles has NO FK from team_staff — a PostgREST embed throws
      // "Could not find a relationship". Fetch team_staff, then staff_profiles
      // by user_id, and join in JS.
      const { data, error: qErr } = await supabase
        .from('team_staff')
        .select('user_id, role')
        .eq('team_id', teamId)
        .eq('role', 'head_coach');
      if (cancelled) return;
      if (qErr) { setError(qErr); setLoading(false); return; }
      const rows = data || [];
      if (rows.length === 0) { setCoach(null); setLoading(false); return; }
      const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
      const { data: profData, error: pErr } = await supabase
        .from('staff_profiles')
        .select('user_id, display_name, phone')
        .in('user_id', userIds);
      if (cancelled) return;
      if (pErr) { setError(pErr); setLoading(false); return; }
      const profByUser = new Map((profData || []).map((p) => [p.user_id, p]));
      // Co-coach rule: alphabetical sort by display_name (head_coach flag
      // not present in schema; pick rule stays deterministic across reloads).
      const sorted = [...rows].sort((a, b) => {
        const an = profByUser.get(a.user_id)?.display_name || '';
        const bn = profByUser.get(b.user_id)?.display_name || '';
        return an.localeCompare(bn);
      });
      const pick = sorted[0];
      const profile = profByUser.get(pick.user_id) || {};
      setCoach({
        user_id: pick.user_id,
        name: profile.display_name || 'Coach',
        phone: profile.phone || null,
        email: null,
      });
      setLoading(false);
    }
    // Microtask wrap matches useTeamRecords / usePublicTournaments pattern —
    // defers all setState out of the effect body to satisfy
    // react-hooks/set-state-in-effect.
    Promise.resolve().then(load);
    return () => { cancelled = true; };
  }, [teamId]);

  return { coach, loading, error };
}
