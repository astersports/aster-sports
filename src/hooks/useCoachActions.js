import { useCallback, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// Teams PR-2 Part B — wrappers over the comp RPCs. assign_team_coach handles
// BOTH assign and edit (it upserts team_staff + coaching_assignments), so the
// UI uses it for the assign sheet and the "Edit comp" flow alike;
// remove_team_coach handles unassign (keep payout history) / delete. Admin-only
// authz lives in the RPCs. Throws on error for kindness microcopy (§16.3).
export function useCoachActions(teamId, onChange) {
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (fn, args) => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc(fn, args);
      if (error) throw new Error(error.message);
      await onChange?.();
    } finally {
      setBusy(false);
    }
  }, [onChange]);

  const assignCoach = useCallback(
    ({ userId, role, paid, rateCents, scope }) =>
      run('assign_team_coach', {
        p_team_id: teamId, p_user_id: userId, p_role: role,
        p_paid: paid, p_rate_cents: rateCents ?? null, p_scope: scope || 'all_events',
      }),
    [run, teamId]);
  const removeCoach = useCallback(
    (userId, mode) => run('remove_team_coach', { p_team_id: teamId, p_user_id: userId, p_mode: mode }),
    [run, teamId]);

  return useMemo(() => ({ assignCoach, removeCoach, busy }), [assignCoach, removeCoach, busy]);
}
