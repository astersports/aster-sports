import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint E — Admin ACTION QUEUE third signal: pending parent
// invitations (sent but not accepted, not cancelled, not expired).
// Surfaces email addresses the admin should chase or resend.
//
// Per anti-pattern #36 (data + error destructured) + #37 (org_id
// filter first on the chain).
//
// V1 click-through target: /admin/members. Future iteration may
// add a dedicated invitations management surface; the /admin/members
// page is the closest existing admin manager today.

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
    const nowIso = new Date(nowMs).toISOString();
    const { data, error: e } = await supabase
      .from('invitations')
      .select('id, email, role, team_id, invited_at, expires_at, resent_count')
      .eq('org_id', orgId)
      .is('accepted_at', null)
      .is('cancelled_at', null)
      .gt('expires_at', nowIso)
      .order('invited_at', { ascending: false });
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
      const resentBit = inv.resent_count > 0 ? ` · resent ${inv.resent_count}×` : '';
      return {
        kind: 'pending_invitation',
        primary: `Pending invite: ${inv.email}`,
        secondary: `Sent ${ageBit}${resentBit}`,
        href: '/admin/members',
        id: inv.id,
        team_color: 'var(--em-warning)',
      };
    });
    setError(null);
    setItems(out);
    setLoading(false);
  }, [orgId, nowMs]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { items, loading, error, refetch };
}
