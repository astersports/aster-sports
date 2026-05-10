// Wave 3.12 — synthetic queue items computed from current DB state.
// Returns "needs briefing" surfaces NOT stored as comms_messages rows.
//
// Wave 4.1b §5 — broadened windows + ordering. Pure row builders live
// in src/lib/briefings/needsAttention.js so unit tests can validate
// the cap/overflow logic without async.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  buildDigestDueRow, buildGameRecapRows, buildPrelimRows,
  buildSkippedRows, buildTournRecapRows, GAME_RECAP_WINDOW_MS, TOURNAMENT_PRELIM_WINDOW_MS,
  TOURNAMENT_RECAP_WINDOW_MS, weeklyDigestDueWindow,
} from '../lib/briefings/needsAttention';

async function fetchTournamentItems(orgId) {
  const horizon = new Date(Date.now() + TOURNAMENT_PRELIM_WINDOW_MS).toISOString();
  const { data } = await supabase.from('tournaments').select('id,name,start_date').eq('org_id', orgId).gte('start_date', new Date().toISOString()).lte('start_date', horizon);
  if (!data?.length) return [];
  const ids = data.map((t) => t.id);
  const { data: sent } = await supabase.from('comms_messages').select('anchor_id').eq('org_id', orgId).eq('kind', 'tournament_prelim').eq('status', 'sent').in('anchor_id', ids).gte('sent_at', new Date(Date.now() - TOURNAMENT_PRELIM_WINDOW_MS).toISOString());
  return buildPrelimRows(data, (sent || []).map((s) => s.anchor_id));
}

async function fetchTournamentRecapItems(orgId) {
  const since = new Date(Date.now() - TOURNAMENT_RECAP_WINDOW_MS).toISOString();
  const { data } = await supabase.from('tournaments').select('id,name,end_date').eq('org_id', orgId).gte('end_date', since).lt('end_date', new Date().toISOString());
  if (!data?.length) return [];
  const ids = data.map((t) => t.id);
  const { data: sent } = await supabase.from('comms_messages').select('anchor_id').eq('org_id', orgId).eq('kind', 'tournament_recap').eq('status', 'sent').in('anchor_id', ids);
  return buildTournRecapRows(data, (sent || []).map((s) => s.anchor_id));
}

async function fetchGameRecapItems(orgId) {
  const since = new Date(Date.now() - GAME_RECAP_WINDOW_MS).toISOString();
  const { data } = await supabase.from('events').select('id,title,team_id,start_at,teams(name,org_id)').eq('event_type', 'game').gte('start_at', since).lte('start_at', new Date().toISOString());
  if (!data?.length) return [];
  const inOrg = data.filter((e) => e.teams?.org_id === orgId);
  if (!inOrg.length) return [];
  const ids = inOrg.map((e) => e.id);
  const { data: sent } = await supabase.from('comms_messages').select('anchor_id').eq('org_id', orgId).eq('kind', 'game_recap').eq('status', 'sent').in('anchor_id', ids);
  return buildGameRecapRows(inOrg, (sent || []).map((s) => s.anchor_id));
}

async function fetchSkippedScheduleChanges(orgId) {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data } = await supabase.from('event_change_audit').select('id,event_id,changed_at,recurrence_scope,before_jsonb,after_jsonb,events(title,team_id)').eq('org_id', orgId).is('dispatch_email_id', null).gte('changed_at', since);
  return buildSkippedRows(data);
}

async function fetchWeeklyDigestDue(orgId) {
  if (!weeklyDigestDueWindow()) return [];
  const monday = new Date(); monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const { count } = await supabase.from('comms_messages').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('kind', 'weekly_digest').eq('status', 'sent').gte('sent_at', monday.toISOString());
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
      const [prelim, tourneyRecap, gameRecap, skipped, digestDue] = await Promise.all([
        fetchTournamentItems(orgId),
        fetchTournamentRecapItems(orgId),
        fetchGameRecapItems(orgId),
        fetchSkippedScheduleChanges(orgId),
        fetchWeeklyDigestDue(orgId),
      ]);
      setItems([...prelim, ...tourneyRecap, ...gameRecap, ...skipped, ...digestDue]);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [orgId]);

  useEffect(() => { refetch(); const onFocus = () => refetch(); window.addEventListener('focus', onFocus); return () => window.removeEventListener('focus', onFocus); }, [refetch]);

  return { items, loading, error, refetch };
}
