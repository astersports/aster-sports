import { useCallback, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// Teams PR-2 Part A — thin wrappers over the PR-0 SECURITY DEFINER RPCs
// (add_roster_member / drop_roster_member / set_jersey / set_roster_type).
// Each awaits the write, refetches via onChange, and THROWS on error so the
// calling sheet/menu can show kindness microcopy (§16.3). authz lives in the
// RPCs (admin|coach for roster writes); these are plain rpc() calls. Per-row
// writes refetch-after (not optimistic): the multi-table alignment triggers
// make optimistic local mutation risky; the roster refetch is cheap (§16.1
// scope-aware — per-row optimism is preferred but correctness wins on the
// trigger-coupled tables).
export function useRosterActions(teamId, onChange) {
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (fn, args) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc(fn, args);
      if (error) throw new Error(error.message);
      await onChange?.();
      return data;
    } finally {
      setBusy(false);
    }
  }, [onChange]);

  const addPlayer = useCallback(
    (playerId, rosterType = 'rostered', jersey = null) =>
      run('add_roster_member', { p_team_id: teamId, p_player_id: playerId, p_roster_type: rosterType, p_jersey: jersey }),
    [run, teamId]);
  const removePlayer = useCallback(
    (playerId, mode) => run('drop_roster_member', { p_team_id: teamId, p_player_id: playerId, p_mode: mode }),
    [run, teamId]);
  const setJersey = useCallback(
    (playerId, jersey) => run('set_jersey', { p_team_id: teamId, p_player_id: playerId, p_jersey: jersey }),
    [run, teamId]);
  const setRosterType = useCallback(
    (playerId, type) => run('set_roster_type', { p_team_id: teamId, p_player_id: playerId, p_type: type }),
    [run, teamId]);

  return useMemo(
    () => ({ addPlayer, removePlayer, setJersey, setRosterType, busy }),
    [addPlayer, removePlayer, setJersey, setRosterType, busy]);
}
