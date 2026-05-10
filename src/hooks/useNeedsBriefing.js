// Wave 3.12 — synthetic queue items computed from current DB state.
// Returns "needs briefing" surfaces NOT stored as comms_messages rows.
//
// Wave 4.1b §5 — broadened windows + ordering. Pure row builders live
// in src/lib/briefings/needsAttention.js so unit tests can validate
// the cap/overflow logic without async.
//
// Wave 4.1d-2:
//   §1.6 — exclude is_bracket_placeholder=true games (G4)
//   §4.1 — exclude status='cancelled' events (G3)
//   §4.2 — tournament_recap requires schedule_status IN
//          ('complete','live','final') (G5)
//   §4.4 — split sent rows by recipient_count: a "real send"
//          (>1 recipient = at least one family + admin BCC) clears
//          the card; a "test send" (only admin BCC, recipient_count
//          ≤ 1) keeps the card visible with "Test sent · families
//          pending" copy
//
// Wave 4.1d-4 — fetch tournament_teams.team_id alongside tournaments
// so synth rows carry team_ids for the inbox filter chip. Single
// extra query per refetch, bounded by # tournaments in window (~5).

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  buildDigestDueRow, buildGameRecapRows, buildPrelimRows,
  buildSkippedRows, buildTournRecapRows, GAME_RECAP_WINDOW_MS, TOURNAMENT_PRELIM_WINDOW_MS,
  TOURNAMENT_RECAP_WINDOW_MS, weeklyDigestDueWindow,
} from '../lib/briefings/needsAttention';

const TOURNAMENT_RECAP_STATUSES = ['complete', 'final', 'live'];

function splitSent(rows) {
  const sent = [];
  const testSent = [];
  (rows || []).forEach((r) => {
    if ((r.recipient_count || 0) > 1) sent.push(r.anchor_id);
    else testSent.push(r.anchor_id);
  });
  return { sent, testSent };
}

async function fetchTournamentTeamIds(tournamentIds) {
  if (!tournamentIds?.length) return {};
  const { data } = await supabase.from('tournament_teams').select('tournament_id, team_id').in('tournament_id', tournamentIds);
  const map = {};
  (data || []).forEach((r) => { (map[r.tournament_id] = map[r.tournament_id] || []).push(r.team_id); });
  return map;
}

async function fetchTournamentItems(orgId) {
  const horizon = new Date(Date.now() + TOURNAMENT_PRELIM_WINDOW_MS).toISOString();
  const { data } = await supabase.from('tournaments').select('id,name,start_date').eq('org_id', orgId).gte('start_date', new Date().toISOString()).lte('start_date', horizon);
  if (!data?.length) return [];
  const ids = data.map((t) => t.id);
  const [{ data: sentRows }, teamIdsByTournament] = await Promise.all([
    supabase.from('comms_messages').select('anchor_id, recipient_count').eq('org_id', orgId).eq('kind', 'tournament_prelim').eq('status', 'sent').in('anchor_id', ids).gte('sent_at', new Date(Date.now() - TOURNAMENT_PRELIM_WINDOW_MS).toISOString()),
    fetchTournamentTeamIds(ids),
  ]);
  const { sent, testSent } = splitSent(sentRows);
  const enriched = data.map((t) => ({ ...t, team_ids: teamIdsByTournament[t.id] || [] }));
  return buildPrelimRows(enriched, sent, testSent);
}

async function fetchTournamentRecapItems(orgId) {
  const since = new Date(Date.now() - TOURNAMENT_RECAP_WINDOW_MS).toISOString();
  const { data } = await supabase.from('tournaments').select('id,name,end_date,schedule_status').eq('org_id', orgId).gte('end_date', since).lt('end_date', new Date().toISOString());
  if (!data?.length) return [];
  const eligible = data.filter((t) => !t.schedule_status || TOURNAMENT_RECAP_STATUSES.includes(t.schedule_status));
  if (!eligible.length) return [];
  const ids = eligible.map((t) => t.id);
  const [{ data: sentRows }, teamIdsByTournament] = await Promise.all([
    supabase.from('comms_messages').select('anchor_id, recipient_count').eq('org_id', orgId).eq('kind', 'tournament_recap').eq('status', 'sent').in('anchor_id', ids),
    fetchTournamentTeamIds(ids),
  ]);
  const { sent, testSent } = splitSent(sentRows);
  const enriched = eligible.map((t) => ({ ...t, team_ids: teamIdsByTournament[t.id] || [] }));
  return buildTournRecapRows(enriched, sent, testSent);
}

async function fetchGameRecapItems(orgId) {
  const since = new Date(Date.now() - GAME_RECAP_WINDOW_MS).toISOString();
  const { data } = await supabase.from('events').select('id,title,team_id,start_at,status,is_bracket_placeholder,teams(name,org_id)').eq('event_type', 'game').gte('start_at', since).lte('start_at', new Date().toISOString());
  if (!data?.length) return [];
  const inOrg = (data || []).filter((e) => e.teams?.org_id === orgId)
    .filter((e) => e.status !== 'cancelled')
    .filter((e) => !e.is_bracket_placeholder);
  if (!inOrg.length) return [];
  const ids = inOrg.map((e) => e.id);
  const { data: sentRows } = await supabase.from('comms_messages').select('anchor_id, recipient_count').eq('org_id', orgId).eq('kind', 'game_recap').eq('status', 'sent').in('anchor_id', ids);
  const { sent, testSent } = splitSent(sentRows);
  return buildGameRecapRows(inOrg, sent, undefined, testSent);
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
