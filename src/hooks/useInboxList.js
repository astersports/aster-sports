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
// The hook is purposely simple — no filter, no mark-as-read yet
// (deferred per Phase 2 D-6(a) minimal-viable scope). Items are
// sorted server-side by sent_at DESC; the component groups them
// by recency bucket at render time.

const PAGE_SIZE = 50;

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
        comms_messages ( kind, subject, sent_at, anchor_kind, anchor_id, team_id, teams ( team_color ) )`)
      .eq('guardian_id', guardianId)
      .order('id', { ascending: false })
      .limit(PAGE_SIZE);
    if (err) { setError(err); setItems([]); setLoading(false); return; }
    const flat = (data || []).map((r) => ({
      id: r.id,
      message_id: r.message_id,
      kind: r.comms_messages?.kind || null,
      subject: r.subject_rendered || r.comms_messages?.subject || '(no subject)',
      sent_at: r.comms_messages?.sent_at || null,
      opened_at: r.opened_at || null,
      teams_included: r.teams_included || [],
      anchor_kind: r.comms_messages?.anchor_kind || null,
      anchor_id: r.comms_messages?.anchor_id || null,
      // Team-color rail source: the briefing's own team (comms_messages.team_id
      // -> teams.team_color), the same join Radar's ProposalCard uses. null for
      // org-wide briefings (no team_id) -> neutral rail.
      team_color: r.comms_messages?.teams?.team_color || null,
    }));
    setItems(flat);
    setLoading(false);
  }, [guardianId]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) load(); });
    return () => { cancelled = true; };
  }, [load]);

  return { items, loading, error, refetch: load };
}
