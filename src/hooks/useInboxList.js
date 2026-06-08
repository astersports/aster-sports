import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Phase 3 D-6(a) parent inbox — list query.
// Reads comms_message_recipients for the requesting parent's
// guardian record. Relies on the parent_select_own_recipients RLS
// policy (migration 20260604005623) to scope the result set.
//
// Returns:
//   items: Array<{
//     id, message_id, kind, subject, sent_at, opened_at,
//     teams_included, anchor_kind, anchor_id, team_color
//   }>
//   (opened_at null = unread; team_color drives the per-row rail,
//    null for org-wide briefings)
//   loading, error
//
// Items are sorted by the joined comms_messages.sent_at DESC. PostgREST
// `.order(..., { foreignTable })` only sorts embedded subarrays, not
// parent rows (AP #48), so the fetch orders by id (stable) and the sort
// by sent_at happens JS-side below. Null sent_at (drafts/queued) sort to
// the top of their bucket (treated as "now"), tie-broken by id desc.
//
// markOpened(id) optimistically clears the unread dot in-place (§16.1)
// when a row is opened, so the list reflects read-state without a
// refetch round-trip.

const PAGE_SIZE = 50;

// sent_at DESC; null (unsent: draft/queued) sorts first. id desc tiebreak.
function bySentAtDesc(a, b) {
  const am = a.sent_at ? new Date(a.sent_at).getTime() : Infinity;
  const bm = b.sent_at ? new Date(b.sent_at).getTime() : Infinity;
  if (am !== bm) return bm - am;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

export function useInboxList() {
  const { guardianId } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!guardianId) { setItems([]); setLoading(false); setError(null); return; }
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from('comms_message_recipients')
      .select(`id, message_id, opened_at, subject_rendered, teams_included,
        comms_messages!inner ( kind, subject, status, sent_at, sent_by, anchor_kind, anchor_id, team_id, teams ( team_color ) )`)
      .eq('guardian_id', guardianId)
      // F-PARENT-MOAT-LEAK (#825): never surface an ARCHIVED briefing in the
      // parent inbox. !inner + status gate drops recipient rows whose message
      // is archived (or draft/scheduled). 'sent' = delivered, 'queued' =
      // in-flight. Defense-in-depth WITH the RLS backstop message_is_not_archived
      // — either layer alone closes the leak; both for belt-and-suspenders.
      .in('comms_messages.status', ['sent', 'queued'])
      .order('id', { ascending: false })
      .limit(PAGE_SIZE);
    if (err) { setError(err); setItems([]); setLoading(false); return; }
    // Resolve sender names for the "New from {name}" comms card. There is no
    // FK comms_messages→staff_profiles, so fetch + JS-join by user_id (the
    // #763 lesson). Best-effort enrichment: a failure leaves `from` null and
    // the card falls back to "New from your coach" — never blocks the inbox.
    const senderIds = [...new Set((data || []).map((r) => r.comms_messages?.sent_by).filter(Boolean))];
    let nameByUserId = {};
    if (senderIds.length) {
      const { data: staff } = await supabase
        .from('staff_profiles').select('user_id, display_name').in('user_id', senderIds);
      nameByUserId = Object.fromEntries((staff || []).map((s) => [s.user_id, s.display_name]));
    }
    const flat = (data || []).map((r) => ({
      id: r.id,
      message_id: r.message_id,
      kind: r.comms_messages?.kind || null,
      subject: r.subject_rendered || r.comms_messages?.subject || '(no subject)',
      sent_at: r.comms_messages?.sent_at || null,
      from: nameByUserId[r.comms_messages?.sent_by] || null,
      opened_at: r.opened_at || null,
      teams_included: r.teams_included || [],
      anchor_kind: r.comms_messages?.anchor_kind || null,
      anchor_id: r.comms_messages?.anchor_id || null,
      // Team-color rail source: the briefing's own team (comms_messages.team_id
      // -> teams.team_color), the same join Radar's ProposalCard uses. null for
      // org-wide briefings (no team_id) -> neutral rail.
      team_color: r.comms_messages?.teams?.team_color || null,
    }));
    flat.sort(bySentAtDesc);
    setItems(flat);
    setLoading(false);
  }, [guardianId]);

  // Optimistic mark-as-read: clear the unread dot for one row in-place
  // (§16.1). Called when InboxDetail opens a row. Idempotent — leaves
  // an already-opened row untouched.
  const markOpened = useCallback((id) => {
    setItems((prev) => prev.map((it) => (
      it.id === id && !it.opened_at
        ? { ...it, opened_at: new Date().toISOString() }
        : it
    )));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) load(); });
    return () => { cancelled = true; };
  }, [load]);

  return { items, loading, error, refetch: load, markOpened };
}
