// Track-R R-1 — Briefings Radar data hook.
//
// Engine-consumption boundary (R-1 spec §0): READ-ONLY over the canonical
// surfaces. Reads comms_messages (the canonical "notified?" source, per STEP-3
// — never dispatch_email_id) + anchor/team lookups, and shapes ProposalCard
// view-models via radarFeedHelpers. No engine/resolver edits. org-scoped.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { anchorTitle, audiencePill, bucketFeed, kindLabel, summaryLine } from '../lib/briefings/radarFeedHelpers';

const FIELDS = 'id, kind, status, anchor_kind, anchor_id, subject, expires_at, scheduled_for, sent_at, last_edited_at, recipient_count, audience_type, team_id';

async function fetchContext(rows) {
  const idsFor = (k) => [...new Set(rows.filter((r) => r.anchor_kind === k).map((r) => r.anchor_id).filter(Boolean))];
  const eventsById = {}; const tournamentsById = {}; const teamColorByEvent = {}; const changeByEvent = {};
  const eventIds = idsFor('event');
  if (eventIds.length) {
    const { data, error } = await supabase.from('events').select('id, title, team_id, teams ( team_color )').in('id', eventIds);
    if (error) throw error;
    for (const e of data || []) { eventsById[e.id] = e; if (e.teams?.team_color) teamColorByEvent[e.id] = e.teams.team_color; }
  }
  const tournIds = idsFor('tournament');
  if (tournIds.length) {
    const { data, error } = await supabase.from('tournaments').select('id, name').in('id', tournIds);
    if (error) throw error;
    for (const t of data || []) tournamentsById[t.id] = t;
  }
  const scIds = [...new Set(rows.filter((r) => r.kind === 'schedule_change' && r.anchor_kind === 'event').map((r) => r.anchor_id).filter(Boolean))];
  if (scIds.length) {
    const { data, error } = await supabase.from('event_change_audit').select('event_id, before_jsonb, after_jsonb, changed_at').in('event_id', scIds).order('changed_at', { ascending: false });
    if (error) throw error;
    for (const c of data || []) if (!changeByEvent[c.event_id]) changeByEvent[c.event_id] = c; // first row = latest
  }
  return { eventsById, tournamentsById, teamColorByEvent, changeByEvent };
}

function toViewModel(row, maps) {
  const ctx = { ...maps, change: maps.changeByEvent[row.anchor_id] };
  return {
    id: row.id, kind: row.kind, status: row.status,
    scheduledFor: row.scheduled_for, sentAt: row.sent_at, recipientCount: row.recipient_count,
    kindLabel: kindLabel(row.kind),
    title: anchorTitle(row, ctx),
    summary: summaryLine(row, ctx),
    audience: audiencePill(row, ctx),
    teamColor: maps.teamColorByEvent[row.anchor_id] || null,
  };
}

export function useRadarFeed({ orgId } = {}) {
  const [state, setState] = useState({ ready: [], scheduled: [], sent: [], loading: false, error: null });

  const refetch = useCallback(async () => {
    if (!orgId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await supabase.from('comms_messages').select(FIELDS)
        .eq('org_id', orgId).in('status', ['draft', 'scheduled', 'sent'])
        .order('last_edited_at', { ascending: false }).limit(200);
      if (error) throw error;
      const maps = await fetchContext(data || []);
      const { ready, scheduled, sent } = bucketFeed(data || []);
      const map = (list) => list.map((r) => toViewModel(r, maps));
      setState({ ready: map(ready), scheduled: map(scheduled), sent: map(sent), loading: false, error: null });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e }));
    }
  }, [orgId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { ...state, refetch };
}
