// Wave 3.12 — synthetic queue items computed from current DB state.
// Returns "needs briefing" surfaces NOT stored as comms_messages rows:
//   - Tournaments starting in <7d with no recent prelim sent
//   - Completed games <48h ago with no recap sent
//   - event_change_audit rows where admin chose Skip on notify prompt
//   - Sun 7PM ET → Mon 7AM ET window with no weekly_digest sent
//
// Each item shape matches ActionQueueRow expectations:
//   { synthetic_id, status, kind, anchor_kind, anchor_id, title,
//     audience_preview, relative_time, eca_diff? }

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function relTime(iso, suffix = '') {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const days = Math.round(abs / 86400000);
  const hours = Math.round(abs / 3600000);
  let core;
  if (abs < 3600000) core = 'just now';
  else if (abs < 86400000) core = `${hours}h ${ms < 0 ? 'ago' : 'from now'}`;
  else core = `${days}d ${ms < 0 ? 'ago' : 'from now'}`;
  return suffix ? `${core}${suffix}` : core;
}

function weeklyDigestDueWindow(now = new Date()) {
  // Approximate ET via fixed -4h offset (May = EDT). Refine with TZ
  // library when org expands across timezones.
  const et = new Date(now.getTime() - 4 * 3600000);
  const dow = et.getUTCDay();
  const hour = et.getUTCHours();
  return (dow === 0 && hour >= 19) || (dow === 1 && hour < 7);
}

async function fetchTournamentItems(orgId) {
  const horizon = new Date(Date.now() + 7 * 86400000).toISOString();
  const { data } = await supabase.from('tournaments').select('id,name,start_date').eq('org_id', orgId).gte('start_date', new Date().toISOString()).lte('start_date', horizon);
  if (!data?.length) return [];
  const ids = data.map((t) => t.id);
  const { data: sent } = await supabase.from('comms_messages').select('anchor_id').eq('org_id', orgId).eq('kind', 'tournament_prelim').eq('status', 'sent').in('anchor_id', ids).gte('sent_at', new Date(Date.now() - 7 * 86400000).toISOString());
  const skip = new Set((sent || []).map((s) => s.anchor_id));
  return data.filter((t) => !skip.has(t.id)).map((t) => ({
    synthetic_id: `needs_prelim_${t.id}`,
    status: 'needs_briefing_tournament',
    kind: 'tournament_prelim',
    anchor_kind: 'tournament', anchor_id: t.id,
    title: `Tournament prelim · ${t.name}`,
    audience_preview: 'Pre-tournament briefing not sent yet',
    relative_time: relTime(t.start_date),
  }));
}

async function fetchGameRecapItems(orgId) {
  const since = new Date(Date.now() - 48 * 3600000).toISOString();
  const { data } = await supabase.from('events').select('id,title,team_id,start_at,teams(name,org_id)').eq('event_type', 'game').gte('start_at', since).lte('start_at', new Date().toISOString());
  if (!data?.length) return [];
  const inOrg = data.filter((e) => e.teams?.org_id === orgId);
  const ids = inOrg.map((e) => e.id);
  if (!ids.length) return [];
  const { data: sent } = await supabase.from('comms_messages').select('anchor_id').eq('org_id', orgId).eq('kind', 'game_recap').eq('status', 'sent').in('anchor_id', ids);
  const skip = new Set((sent || []).map((s) => s.anchor_id));
  return inOrg.filter((e) => !skip.has(e.id)).map((e) => ({
    synthetic_id: `needs_recap_${e.id}`,
    status: 'needs_briefing_game',
    kind: 'game_recap',
    anchor_kind: 'event', anchor_id: e.id,
    title: `Game recap · ${e.teams?.name || ''} · ${e.title}`,
    audience_preview: 'Recap not sent yet',
    relative_time: relTime(e.start_at, ' (game ended)'),
  }));
}

async function fetchSkippedScheduleChanges(orgId) {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data } = await supabase.from('event_change_audit').select('id,event_id,changed_at,recurrence_scope,before_jsonb,after_jsonb,events(title,team_id)').eq('org_id', orgId).is('dispatch_email_id', null).gte('changed_at', since);
  return (data || []).map((eca) => ({
    synthetic_id: `skipped_${eca.id}`,
    status: 'schedule_change_skipped',
    kind: 'schedule_change',
    anchor_kind: 'event', anchor_id: eca.event_id,
    eca_diff: { before: eca.before_jsonb, after: eca.after_jsonb, recurrence_scope: eca.recurrence_scope },
    title: `Schedule change · ${eca.events?.title || ''}`,
    audience_preview: 'Skipped notification — families unaware',
    relative_time: relTime(eca.changed_at),
  }));
}

async function fetchWeeklyDigestDue(orgId) {
  if (!weeklyDigestDueWindow()) return [];
  const monday = new Date(); monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const { count } = await supabase.from('comms_messages').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('kind', 'weekly_digest').eq('status', 'sent').gte('sent_at', monday.toISOString());
  if (count) return [];
  return [{
    synthetic_id: `digest_due_${monday.toISOString().slice(0, 10)}`,
    status: 'weekly_digest_due',
    kind: 'weekly_digest',
    anchor_kind: 'org', anchor_id: orgId,
    title: 'Weekly digest · all program families',
    audience_preview: 'Due Monday 7 AM ET',
    relative_time: 'this week',
  }];
}

export function useNeedsBriefing({ orgId } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId) return;
    setLoading(true); setError(null);
    try {
      const [a, b, c, d] = await Promise.all([
        fetchTournamentItems(orgId), fetchGameRecapItems(orgId),
        fetchSkippedScheduleChanges(orgId), fetchWeeklyDigestDue(orgId),
      ]);
      setItems([...a, ...b, ...c, ...d]);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [orgId]);

  useEffect(() => { refetch(); const onFocus = () => refetch(); window.addEventListener('focus', onFocus); return () => window.removeEventListener('focus', onFocus); }, [refetch]);

  return { items, loading, error, refetch };
}
