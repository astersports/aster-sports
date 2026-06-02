import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint E — Admin ACTION QUEUE third signal: pending parent
// invitations (Supabase Auth users invited via invite-parent who haven't
// signed in yet).
//
// Wave 3.A #18 P0-1 (closed 2026-06-02): reads from auth.users via the
// SECDEF RPC `get_pending_invitations` rather than the empty public
// invitations table. The invitations-table writer was never wired; auth
// is the canonical source. The RPC enforces admin role inside its body
// so this hook can call it under standard authenticated context.
//
// Per anti-pattern #36 (data + error destructured + error checked).
//
// V1 click-through target: /admin/members.

export function usePendingInvitations(orgId, nowMs) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId || !nowMs) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase
      .rpc('get_pending_invitations', { p_org_id: orgId });
    if (e) {
      console.error('usePendingInvitations fetch:', e.message);
      setError(e.message);
      setItems([]);
      setLoading(false);
      return;
    }
    const out = (data || []).map((inv) => {
      const invitedDate = new Date(inv.invited_at);
      const ageMs = nowMs - invitedDate.getTime();
      const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
      const ageBit = days < 1 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
      return {
        kind: 'pending_invitation',
        primary: `Pending invite: ${inv.email}`,
        secondary: `Sent ${ageBit}`,
        href: '/admin/members',
        id: inv.email,
        team_color: 'var(--as-warning)',
      };
    });
    setError(null);
    setItems(out);
    setLoading(false);
  }, [orgId, nowMs]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { items, loading, error, refetch };
}
