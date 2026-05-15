// Wave 4.8 6c — 3 of 5 synth sub-streams (game_recap, tournament_prelim,
// tournament_recap) moved to briefing_active_queue RPC; schedule_change
// surfacing now happens via auto-draft tick (handleScheduleChanged drafts
// from event_change_audit + dispatch_email_id filter). This hook now ONLY
// surfaces weekly_digest_due as a client-side safety net for the surface
// not yet in the RPC. Will move to the RPC after 30+ days of cron
// telemetry confirms reliable auto-draft firing; this file is then deleted
// per CLAUDE.md anti-pattern #34 caller migration.
//
// Spec-vs-reality note (locked in PR #120 investigation): the prompt's
// "keep rsvp_nudge + weekly_digest_due" assumed rsvp_nudge had a
// fetchRsvpNudgeItems sub-stream here. It never did — rsvp_nudge is
// auto-drafted exclusively (handleRsvpLow24h in _handlers.ts) and
// surfaces via RPC Branch A. The "Do NOT add new logic" fallback
// applies: keep only what existed, which is weekly_digest_due.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { buildDigestDueRow, weeklyDigestDueWindow } from '../lib/briefings/needsAttention';

async function fetchWeeklyDigestDue(orgId) {
  if (!weeklyDigestDueWindow()) return [];
  const monday = new Date(); monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const { count } = await supabase.from('comms_messages').select('id', { count: 'exact', head: true })
    .eq('org_id', orgId).eq('kind', 'weekly_digest').eq('status', 'sent').gte('sent_at', monday.toISOString());
  if (count) return [];
  return [buildDigestDueRow(orgId, monday.toISOString())];
}

export function useNeedsBriefing({ orgId } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId) return;
    setLoading(true); setError(null);
    try {
      const digestDue = await fetchWeeklyDigestDue(orgId);
      setItems(digestDue);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [orgId]);

  useEffect(() => {
    (async () => { await refetch(); })();
    const onFocus = () => refetch();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);

  return { items, loading, error, refetch };
}
