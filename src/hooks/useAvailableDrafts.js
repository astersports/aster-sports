// §4.AI Option C — PR A. Lists recent admin briefing drafts
// (status='draft', last_edited_at within 7 days) for the
// "Resume a draft?" affordance in BriefingComposer Step 1.
//
// Excludes trigger-generated pre-drafts (created_by_trigger IS NOT NULL):
// those are system-suggested briefings, not drafts the admin started, and
// have their own home in the briefing inbox (useInboxQueue). Showing them
// under "Resume a draft?" wrongly implied the admin had started them.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SEVEN_DAYS_MS = 7 * 86400000;

export function useAvailableDrafts({ orgId, limit = 5 } = {}) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!orgId) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setLoading(false);
        setDrafts([]);
      });
      return () => { cancelled = true; };
    }
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      const sinceIso = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
      const { data, error: err } = await supabase
        .from('comms_messages')
        .select('id,kind,anchor_kind,anchor_id,subject,last_edited_at')
        .eq('org_id', orgId)
        .eq('status', 'draft')
        .is('created_by_trigger', null)
        .gte('last_edited_at', sinceIso)
        .order('last_edited_at', { ascending: false })
        .limit(limit);
      if (cancelled) return;
      if (err) {
        setError(err);
        setLoading(false);
        return;
      }
      setDrafts(data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId, limit]);

  return { drafts, loading, error };
}
