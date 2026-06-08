import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// G5 PR 1a — the ambiguous 'queued' recovery surface (Option C).
//
// A recipient still delivery_status='queued' on a message that LEFT 'draft'
// (status queued/scheduled/sent) means dispatch never marked it: either
// never-attempted OR a crash-after-dispatch victim who got the email but the
// row write never landed. The two are indistinguishable from the row, so these
// are SURFACED for human review, NEVER auto-re-driven (the crash-window hold,
// G8 review). Direct fetches (no PostgREST embedded join, architect §4b),
// org-scoped (AP#37); the route is admin-only.
export function useStuckSends({ orgId } = {}) {
  const [state, setState] = useState({ groups: [], count: 0, loading: false, error: null });

  const refetch = useCallback(async () => {
    if (!orgId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      // 1) org messages that have been dispatched (not a composer draft, not archived).
      const { data: msgs, error: mErr } = await supabase.from('comms_messages')
        .select('id, kind, subject, team_id')
        .eq('org_id', orgId).not('status', 'in', '(draft,archived)');
      if (mErr) throw mErr;
      const msgIds = (msgs || []).map((m) => m.id);
      if (!msgIds.length) { setState({ groups: [], count: 0, loading: false, error: null }); return; }

      // 2) their still-'queued' recipients (the stuck ones).
      const { data: recips, error: rErr } = await supabase.from('comms_message_recipients')
        .select('id, message_id, guardian_id')
        .in('message_id', msgIds).eq('delivery_status', 'queued');
      if (rErr) throw rErr;
      if (!recips || !recips.length) { setState({ groups: [], count: 0, loading: false, error: null }); return; }

      // 3) team names/colors for the affected messages (one batched fetch).
      const msgById = Object.fromEntries((msgs || []).map((m) => [m.id, m]));
      const teamIds = [...new Set(recips.map((r) => msgById[r.message_id]?.team_id).filter(Boolean))];
      let teamsById = {};
      if (teamIds.length) {
        const { data: teams, error: tErr } = await supabase.from('teams').select('id, name, team_color').in('id', teamIds);
        if (tErr) throw tErr;
        teamsById = Object.fromEntries((teams || []).map((t) => [t.id, t]));
      }

      // group queued recipients per message.
      const byMsg = new Map();
      for (const r of recips) {
        const list = byMsg.get(r.message_id) || [];
        list.push(r); byMsg.set(r.message_id, list);
      }
      const groups = [...byMsg.entries()].map(([messageId, rows]) => {
        const m = msgById[messageId] || {};
        const team = m.team_id ? teamsById[m.team_id] : null;
        return { messageId, kind: m.kind, subject: m.subject, teamName: team?.name || null, teamColor: team?.team_color || null, recipients: rows };
      });
      setState({ groups, count: groups.length, loading: false, error: null });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e }));
    }
  }, [orgId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { ...state, refetch };
}
