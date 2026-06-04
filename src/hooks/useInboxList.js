import { useEffect, useState } from 'react';
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
//     subject_rendered, teams_included, kid_first_names
//   }>
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

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!guardianId) { setItems([]); setLoading(false); setError(null); return; }
      setLoading(true); setError(null);
      const { data, error: err } = await supabase
        .from('comms_message_recipients')
        .select(`id, message_id, opened_at, subject_rendered, teams_included,
          comms_messages ( kind, subject, sent_at, anchor_kind, anchor_id )`)
        .eq('guardian_id', guardianId)
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);
      if (cancelled) return;
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
      }));
      setItems(flat);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [guardianId]);

  return { items, loading, error };
}
