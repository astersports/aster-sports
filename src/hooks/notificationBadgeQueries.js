import { isAdmin } from '../lib/permissions';

const SEVERITY_ORDER = { info: 0, warning: 1, danger: 2 };

const bumpSeverity = (current, level) => {
  return SEVERITY_ORDER[level] > SEVERITY_ORDER[current] ? level : current;
};

export async function fetchParentBadgeCount(supabase, { teams, kids, nowMs, nowIso, in48hIso }) {
  if (!teams.length || !kids.length) return { count: 0, severity: 'info' };

  const { data: events } = await supabase
    .from('events')
    .select('id, start_at, team_id')
    .in('team_id', teams)
    .gte('start_at', nowIso)
    .lte('start_at', in48hIso)
    .eq('status', 'scheduled');

  let count = 0;
  let severity = 'info';

  for (const ev of events ?? []) {
    const { count: rsvpCount } = await supabase
      .from('event_rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', ev.id)
      .in('player_id', kids);
    if ((rsvpCount ?? 0) === 0) {
      count++;
      const hoursOut = (new Date(ev.start_at).getTime() - nowMs) / 3600000;
      if (hoursOut < 24) severity = bumpSeverity(severity, 'warning');
      if (hoursOut < 4) severity = bumpSeverity(severity, 'danger');
    }
  }
  return { count, severity };
}

export async function fetchStaffBadgeCount(supabase, { activeRole, teams, nowMs, nowIso, in24hIso }) {
  let eventsQuery = supabase
    .from('events')
    .select('id, start_at, team_id')
    .gte('start_at', nowIso)
    .lte('start_at', in24hIso)
    .eq('status', 'scheduled');

  if (!isAdmin(activeRole)) {
    if (!teams.length) return { count: 0, severity: 'info' };
    eventsQuery = eventsQuery.in('team_id', teams);
  }

  const { data: events } = await eventsQuery;
  let count = 0;
  let severity = 'info';

  for (const ev of events ?? []) {
    const [{ count: rosterSize }, { count: rsvpCount }] = await Promise.all([
      supabase
        .from('team_players')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', ev.team_id)
        .eq('status', 'active'),
      supabase
        .from('event_rsvps')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', ev.id)
        .in('response', ['going', 'maybe']),
    ]);
    if ((rosterSize ?? 0) > 0 && (rsvpCount ?? 0) * 2 < (rosterSize ?? 0)) {
      count++;
      const hoursOut = (new Date(ev.start_at).getTime() - nowMs) / 3600000;
      if (hoursOut < 12) severity = bumpSeverity(severity, 'warning');
      if (hoursOut < 4) severity = bumpSeverity(severity, 'danger');
    }
  }
  return { count, severity };
}
