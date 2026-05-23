// Tier 3 v1 PR 2 — alert framework queries.
//
// Per Gap 8 clean seam: the evaluator only talks to a queryExecutor,
// not to supabase directly. createSupabaseQueryExecutor wraps a
// supabase client into the contract the evaluator expects. Future
// server-side or cron migration swaps the executor; evaluator logic
// stays identical.
//
// Anti-pattern #36: every query checks .error explicitly before
// returning data. Anti-pattern #37: every org-scoped query starts
// with .eq('org_id', orgId) where applicable; FK-scoped tables
// (events, team_players, event_rsvps) inherit org scope through
// their RLS chain.
//
// §4.AI Option C PR B (2026-05-23): getRsvpShortfallEvents moved to
// rsvpShortfallQueries.js + new game/tournament recap helpers in
// briefingRecapQueries.js so this file stays under the 150-line cap
// after adding the 2 new wrapper methods.

import { getRsvpShortfallEvents } from './rsvpShortfallQueries';
import {
  getGameRecapPendingEvents,
  getTournamentRecapPendingTournaments,
} from './briefingRecapQueries';

function isoForward(days) { return new Date(Date.now() + days * 86400000).toISOString(); }

export function createSupabaseQueryExecutor(supabase) {
  return {
    getRsvpShortfallEvents: (orgId, params) => getRsvpShortfallEvents(supabase, orgId, params),

    // Per Q3 lock: count status IN ('queued', 'sent') — queued counts
    // as "sent enough" because the operational work is done at dispatch.
    async getMostRecentBriefingByKind(orgId, kind, sinceTs) {
      const { data, error } = await supabase.from('comms_messages')
        .select('id, kind, status, last_edited_at')
        .eq('org_id', orgId).eq('kind', kind)
        .in('status', ['queued', 'sent']).gte('last_edited_at', sinceTs)
        .order('last_edited_at', { ascending: false }).limit(1);
      if (error) throw error;
      return (data && data[0]) || null;
    },

    // Tournaments starting within the next N days that DON'T have a
    // tournament_prelim briefing dispatched. Returns rows for which
    // the alert should fire.
    async getTournamentsWithoutPrelim(orgId, withinDays) {
      const start = new Date().toISOString();
      const end = isoForward(withinDays);
      const { data: tours, error: tErr } = await supabase.from('tournaments')
        .select('id, name, start_date').eq('org_id', orgId)
        .gte('start_date', start).lte('start_date', end);
      if (tErr) throw tErr;
      const tournaments = tours || [];
      if (!tournaments.length) return [];
      const ids = tournaments.map((t) => t.id);
      const { data: sent, error: sErr } = await supabase.from('comms_messages')
        .select('anchor_id').eq('org_id', orgId).eq('kind', 'tournament_prelim')
        .eq('anchor_kind', 'tournament').in('anchor_id', ids)
        .in('status', ['queued', 'sent']);
      if (sErr) throw sErr;
      const sentSet = new Set((sent || []).map((r) => r.anchor_id));
      return tournaments.filter((t) => !sentSet.has(t.id));
    },

    // §4.AI Option C PR B — pending-recap queries via injected helpers.
    getGameRecapPendingEvents: (orgId, sinceHours) => getGameRecapPendingEvents(supabase, orgId, sinceHours),
    getTournamentRecapPendingTournaments: (orgId, sinceDays) => getTournamentRecapPendingTournaments(supabase, orgId, sinceDays),

    async getEventsWithoutLocation(orgId, withinHours) {
      const start = new Date().toISOString();
      const end = isoForward(withinHours / 24);
      const { data, error } = await supabase.from('events')
        .select('id, team_id, start_at, opponent, teams!inner(org_id, name)')
        .eq('teams.org_id', orgId).is('location_id', null)
        .gte('start_at', start).lte('start_at', end).neq('status', 'cancelled');
      if (error) throw error;
      return data || [];
    },

    // L99 v6 §5.1 B2 — opponent_unassigned alert. Same shape as
    // getEventsWithoutLocation but on event_type = 'game' only.
    async getEventsWithoutOpponent(orgId, withinHours) {
      const start = new Date().toISOString();
      const end = isoForward(withinHours / 24);
      const { data, error } = await supabase.from('events')
        .select('id, team_id, start_at, opponent, event_type, teams!inner(org_id, name)')
        .eq('teams.org_id', orgId)
        .eq('event_type', 'game')
        .or('is_bracket_placeholder.is.null,is_bracket_placeholder.eq.false')
        .or('opponent.is.null,opponent.eq.,opponent.eq.TBD')
        .gte('start_at', start).lte('start_at', end).neq('status', 'cancelled');
      if (error) throw error;
      return data || [];
    },

    // Per Q7 lock: 2 trigger conditions, NO orphan check.
    async getEventsWithBrokenLocationData(orgId) {
      const start = new Date().toISOString();
      const { data, error } = await supabase.from('events')
        .select('id, team_id, start_at, location_id, location, teams!inner(org_id, name)')
        .eq('teams.org_id', orgId).gte('start_at', start).neq('status', 'cancelled')
        .or('location_id.is.null,location.is.null');
      if (error) throw error;
      return data || [];
    },

    // §4.AD BUG-B fix (2026-05-24): query rewritten to read actual
    // family_balances columns + return-shape mapped to preserve legacy
    // field names for evaluator.js compatibility.
    async getOverdueFamilyBalances(orgId, ageThresholdDays, minimumAmountDollars) {
      const ageThresholdIso = new Date(Date.now() - ageThresholdDays * 86400000).toISOString();
      const { data, error } = await supabase.from('family_balances')
        .select('guardian_id, balance_cents, last_payment_at')
        .eq('org_id', orgId)
        .gt('balance_cents', minimumAmountDollars * 100)
        .lt('last_payment_at', ageThresholdIso);
      if (error) throw error;
      return (data || []).map((r) => ({
        family_id: r.guardian_id,
        outstanding_amount: r.balance_cents,
        oldest_outstanding_age_days: Math.floor((Date.now() - new Date(r.last_payment_at).getTime()) / 86400000),
      }));
    },
  };
}
