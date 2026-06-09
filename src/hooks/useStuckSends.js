import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { reportError } from '../lib/reportError';
import { isPastGrace, terminalStatusFromSignals } from '../lib/reconcileDelivery';

// G5 PR 1a — the ambiguous 'queued' recovery surface (Option C).
//
// A recipient still delivery_status='queued' on a message that LEFT 'draft'
// (status queued/scheduled/sent) means dispatch never marked it: either
// never-attempted OR a crash-after-dispatch victim who got the email but the
// row write never landed. The two are indistinguishable from the row, so these
// are SURFACED for human review, NEVER auto-re-driven (the crash-window hold,
// G8 review). Direct fetches (no PostgREST embedded join, architect §4b),
// org-scoped (AP#37); the route is admin-only.
//
// RECOVER Option A hardening (architect 2026-06-09): before surfacing, run the
// H1 reconcile pass — any 'queued' row that carries a provider webhook signal
// (delivered/opened/clicked/bounced/complained) gets its terminal status synced
// from that signal (status-only UPDATE via the existing cmr_update admin RLS;
// NEVER a send). That auto-clears the crash-window rows, so the human queue (H2)
// shrinks to the rare no-signal residue past the grace window.

// Group recipient rows per message into the card shape, joining team name/color.
function groupByMessage(rows, msgById, teamsById) {
  const byMsg = new Map();
  for (const r of rows) {
    const list = byMsg.get(r.message_id) || [];
    list.push(r); byMsg.set(r.message_id, list);
  }
  return [...byMsg.entries()].map(([messageId, recipients]) => {
    const m = msgById[messageId] || {};
    const team = m.team_id ? teamsById[m.team_id] : null;
    return { messageId, kind: m.kind, subject: m.subject, teamName: team?.name || null, teamColor: team?.team_color || null, recipients };
  });
}

export function useStuckSends({ orgId } = {}) {
  const [state, setState] = useState({ groups: [], escalations: [], count: 0, reconciled: 0, loading: false, error: null });

  const refetch = useCallback(async () => {
    if (!orgId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    const empty = { groups: [], escalations: [], count: 0, reconciled: 0, loading: false, error: null };
    try {
      // 1) org messages that have been dispatched (not a composer draft, not archived).
      const { data: msgs, error: mErr } = await supabase.from('comms_messages')
        .select('id, kind, subject, team_id')
        .eq('org_id', orgId).not('status', 'in', '(draft,archived)');
      if (mErr) throw mErr;
      const msgIds = (msgs || []).map((m) => m.id);
      if (!msgIds.length) { setState(empty); return; }

      // 2) still-'queued' recipients (the ambiguous stuck class), WITH the
      //    provider-signal + age columns so H1 can reconcile and H2 can grace-gate.
      const { data: recips, error: rErr } = await supabase.from('comms_message_recipients')
        .select('id, message_id, guardian_id, created_at, delivered_at, opened_at, clicked_at, bounced_at, complained_at')
        .in('message_id', msgIds).eq('delivery_status', 'queued');
      if (rErr) throw rErr;
      // 2b) G5 OPT-B escalation class: 'failed' recipients the cron exhausted its
      // 3 auto-retries on (redrive_count >= 3). Surface-only — no auto-resend.
      const { data: escRecips, error: eErr } = await supabase.from('comms_message_recipients')
        .select('id, message_id, guardian_id')
        .in('message_id', msgIds).eq('delivery_status', 'failed').gte('redrive_count', 3);
      if (eErr) throw eErr;

      // H1: partition queued rows by provider signal. Signal-bearing → reconcile
      // (status sync, no send) and drop from review; no-signal → residue.
      const queuedAll = recips || [];
      const byStatus = {};
      const noSignal = [];
      for (const r of queuedAll) {
        const t = terminalStatusFromSignals(r);
        if (t) (byStatus[t] ||= []).push(r.id);
        else noSignal.push(r);
      }
      const reconciledIds = Object.values(byStatus).flat();
      if (reconciledIds.length) {
        // Best-effort, status-only UPDATEs (cmr_update admin RLS). A failed write
        // does NOT re-surface the row for review — its in-memory signal already
        // excluded it; it just retries next load. NEVER invokes the send path.
        await Promise.all(Object.entries(byStatus).map(([status, ids]) =>
          supabase.from('comms_message_recipients').update({ delivery_status: status }).in('id', ids)
            .then(({ error }) => { if (error) reportError(error, { surface: 'useStuckSends.reconcile', status }); })
        ));
      }

      // H2: residue = no-signal rows older than the grace window.
      const now = Date.now();
      const residue = noSignal.filter((r) => isPastGrace(r.created_at, now));
      const escalated = escRecips || [];
      if (!residue.length && !escalated.length) { setState({ ...empty, reconciled: reconciledIds.length }); return; }

      // 3) team names/colors for the affected messages (one batched fetch).
      const msgById = Object.fromEntries((msgs || []).map((m) => [m.id, m]));
      const teamIds = [...new Set([...residue, ...escalated].map((r) => msgById[r.message_id]?.team_id).filter(Boolean))];
      let teamsById = {};
      if (teamIds.length) {
        const { data: teams, error: tErr } = await supabase.from('teams').select('id, name, team_color').in('id', teamIds);
        if (tErr) throw tErr;
        teamsById = Object.fromEntries((teams || []).map((t) => [t.id, t]));
      }

      const groups = groupByMessage(residue, msgById, teamsById);
      const escalations = groupByMessage(escalated, msgById, teamsById);
      setState({ groups, escalations, count: groups.length, reconciled: reconciledIds.length, loading: false, error: null });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e }));
    }
  }, [orgId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { ...state, refetch };
}
