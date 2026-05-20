// Tier 3 v1 PR 2 — alert framework queries.
//
// Per Gap 5 + Gap 8 spec: 5 dedicated queries + 1 view reuse. Each
// query is parameterized for its instance set (rsvp_shortfall covers
// 3 instances, briefing_overdue covers 2, etc.).
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

function isoForward(days) { return new Date(Date.now() + days * 86400000).toISOString(); }

export function createSupabaseQueryExecutor(supabase) {
  return {
    // Returns events that need rsvp shortfall evaluation, with their
    // expected_roster + responded + yes_count counts pre-computed.
    // Per Q2 lock: expected_roster = active rostered team_players
    // for the event's team + length of events.academy_callup_player_ids
    // for the specific event.
    async getRsvpShortfallEvents(orgId, params) {
      const { eventTypeFilter, withinHours } = params;
      const start = new Date().toISOString();
      const end = isoForward(withinHours / 24);
      const { data: evs, error: evErr } = await supabase.from('events')
        .select('id, team_id, start_at, end_at, event_type, opponent, academy_callup_player_ids, teams!inner(org_id, age_group, circuit)')
        .eq('teams.org_id', orgId).eq('event_type', eventTypeFilter)
        .gte('start_at', start).lte('start_at', end).neq('status', 'cancelled');
      if (evErr) throw evErr;
      const events = evs || [];
      if (!events.length) return [];
      const teamIds = [...new Set(events.map((e) => e.team_id))];
      const { data: roster, error: rErr } = await supabase.from('team_players')
        .select('team_id, player_id').in('team_id', teamIds)
        .eq('status', 'active').eq('roster_type', 'rostered');
      if (rErr) throw rErr;
      const rosterByTeam = new Map();
      for (const r of roster || []) {
        if (!rosterByTeam.has(r.team_id)) rosterByTeam.set(r.team_id, new Set());
        rosterByTeam.get(r.team_id).add(r.player_id);
      }
      const eventIds = events.map((e) => e.id);
      const { data: rsvps, error: rsvpErr } = await supabase.from('event_rsvps')
        .select('event_id, player_id, response').in('event_id', eventIds);
      if (rsvpErr) throw rsvpErr;
      const rsvpByEvent = new Map();
      for (const r of rsvps || []) {
        if (!rsvpByEvent.has(r.event_id)) rsvpByEvent.set(r.event_id, []);
        rsvpByEvent.get(r.event_id).push(r);
      }
      return events.map((e) => {
        const roster = rosterByTeam.get(e.team_id) || new Set();
        const callups = new Set(e.academy_callup_player_ids || []);
        const expected = new Set([...roster, ...callups]);
        const responses = rsvpByEvent.get(e.id) || [];
        const respondedIds = new Set(responses.map((r) => r.player_id));
        const yesIds = new Set(responses.filter((r) => r.response === 'yes').map((r) => r.player_id));
        return {
          event_id: e.id, team_id: e.team_id, team: e.teams,
          start_at: e.start_at, end_at: e.end_at,
          event_type: e.event_type, opponent: e.opponent,
          expected_roster: expected.size,
          responded: [...respondedIds].filter((p) => expected.has(p)).length,
          yes_count: [...yesIds].filter((p) => expected.has(p)).length,
        };
      });
    },

    // Per Q3 lock: count status IN ('queued', 'sent') — queued counts
    // as "sent enough" because the operational work is done at dispatch.
    async getMostRecentBriefingByKind(orgId, kind, sinceTs) {
      const { data, error } = await supabase.from('comms_messages')
        .select('id, kind, status, created_at')
        .eq('org_id', orgId).eq('kind', kind)
        .in('status', ['queued', 'sent']).gte('created_at', sinceTs)
        .order('created_at', { ascending: false }).limit(1);
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
    // getEventsWithoutLocation but on event_type IN ('game','tournament')
    // (no opponent concept for practice events) and matches three forms
    // of "no opponent": NULL, empty string, literal 'TBD'.
    async getEventsWithoutOpponent(orgId, withinHours) {
      const start = new Date().toISOString();
      const end = isoForward(withinHours / 24);
      const { data, error } = await supabase.from('events')
        .select('id, team_id, start_at, opponent, event_type, teams!inner(org_id, name)')
        .eq('teams.org_id', orgId)
        .in('event_type', ['game', 'tournament'])
        .or('opponent.is.null,opponent.eq.,opponent.eq.TBD')
        .gte('start_at', start).lte('start_at', end).neq('status', 'cancelled');
      if (error) throw error;
      return data || [];
    },

    // Per Q7 lock: 2 trigger conditions, NO orphan check.
    // Condition 1: location_id IS NULL on a future event.
    // Condition 2: location_id IS NOT NULL AND events.location IS NULL
    // (the Finding 1 bug class — location_id set but text column null).
    async getEventsWithBrokenLocationData(orgId) {
      const start = new Date().toISOString();
      const { data, error } = await supabase.from('events')
        .select('id, team_id, start_at, location_id, location, teams!inner(org_id, name)')
        .eq('teams.org_id', orgId).gte('start_at', start).neq('status', 'cancelled')
        .or('location_id.is.null,location.is.null');
      if (error) throw error;
      return data || [];
    },

    // family_balances view reuse for payment_overdue. Q7-style sub:
    // view already gates by RLS + org_id.
    async getOverdueFamilyBalances(orgId, ageThresholdDays, minimumAmountDollars) {
      const { data, error } = await supabase.from('family_balances')
        .select('family_id, outstanding_amount, oldest_outstanding_age_days')
        .eq('org_id', orgId).gt('outstanding_amount', minimumAmountDollars * 100)
        .gt('oldest_outstanding_age_days', ageThresholdDays);
      if (error) throw error;
      return data || [];
    },
  };
}
