// §4.AI Option C PR B — getRsvpShortfallEvents moved here from
// queries.js so the parent stays under the 150-line cap (AP #11)
// after the 2 new briefing-recap wrapper methods land. Logic byte-
// identical to the prior inline implementation in queries.js.
//
// Returns events that need rsvp shortfall evaluation, with their
// expected_roster + responded + yes_count counts pre-computed. Per
// Q2 lock: expected_roster = active rostered team_players for the
// event's team + length of events.academy_callup_player_ids for the
// specific event.

function isoForward(days) { return new Date(Date.now() + days * 86400000).toISOString(); }

export async function getRsvpShortfallEvents(supabase, orgId, params) {
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
    const teamRoster = rosterByTeam.get(e.team_id) || new Set();
    const callups = new Set(e.academy_callup_player_ids || []);
    const expected = new Set([...teamRoster, ...callups]);
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
}
