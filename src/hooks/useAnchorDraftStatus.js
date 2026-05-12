// Wave 4.8 6b Session 1 — anchor-scoped briefing status hook.
// Returns "is this (org, anchor, kind) tuple already drafted/sent?" so
// detail-page Compose CTAs can vary copy (Compose / Resume / Sent).
//
// Single comms_messages SELECT, ordered by last_edited_at DESC so the
// most-recently-touched draft wins for draftId. hasSent is computed
// across all sent rows; sentAt is the max sent_at among them.
//
// Per PR #114 (wave 4.8 Pre-6b): only select columns verified to exist
// on comms_messages. No created_at. Columns used here are all in the
// production schema (verified via Supabase MCP pg_attribute).

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const INITIAL = { hasDraft: false, draftId: null, hasSent: false, sentAt: null, isLoading: false, error: null };

export function useAnchorDraftStatus({ orgId, anchorKind, anchorId, kind } = {}) {
  const [state, setState] = useState(INITIAL);

  useEffect(() => {
    let cancelled = false;
    if (!orgId || !anchorKind || !anchorId || !kind) {
      Promise.resolve().then(() => { if (!cancelled) setState(INITIAL); });
      return undefined;
    }
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setState((s) => ({ ...s, isLoading: true, error: null }));
      const { data, error } = await supabase
        .from('comms_messages')
        .select('id,status,sent_at')
        .eq('org_id', orgId).eq('anchor_kind', anchorKind).eq('anchor_id', anchorId).eq('kind', kind)
        .order('last_edited_at', { ascending: false, nullsFirst: false });
      if (cancelled) return;
      if (error) { setState({ ...INITIAL, error }); return; }
      const rows = data || [];
      const draftRow = rows.find((r) => r.status === 'draft');
      const sentRows = rows.filter((r) => r.status === 'sent' && r.sent_at);
      const sentAt = sentRows.length ? sentRows.map((r) => r.sent_at).sort().slice(-1)[0] : null;
      setState({
        hasDraft: !!draftRow, draftId: draftRow?.id || null,
        hasSent: sentRows.length > 0, sentAt,
        isLoading: false, error: null,
      });
    });
    return () => { cancelled = true; };
  }, [orgId, anchorKind, anchorId, kind]);

  return state;
}
