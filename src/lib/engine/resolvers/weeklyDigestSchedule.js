// Pure schedule-section builder for the weekly_digest resolver.
// Moved from src/lib/engine/digestSchedule.js in wave 4.2-A-1.
//
// Groups events by NY-tz local date, decorates with team color stripes,
// derives tournament placeholder text. Pure function; no fetch.
//
// Inputs: { events, teams, tournaments, rsvpCountsByEvent }
// Output: { kind: 'weekly_schedule', days } | null

const NY_TZ = 'America/New_York';
const dayKeyFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, year: 'numeric', month: 'numeric', day: 'numeric' });
const dayLabelFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'short', month: 'short', day: 'numeric' });
const dowFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, hour: 'numeric', minute: '2-digit', hour12: true });

const EVENT_TYPE_LABELS = {
  game: 'Game', practice: 'Practice', tournament: 'Tournament',
  skills_lab: 'Skills Lab', tryout: 'Tryout', other: 'Event',
};

function dayKey(iso) { return dayKeyFmt.format(new Date(iso)); }
function dayLabel(iso) { return dayLabelFmt.format(new Date(iso)).toUpperCase().replace(',', ' ·'); }

function timeRange(ev) {
  const start = timeFmt.format(new Date(ev.start_at));
  if (!ev.end_at) return start;
  const end = timeFmt.format(new Date(ev.end_at));
  return `${start} - ${end}`;
}

function deriveTournamentLabel(event, tournament) {
  if (event.bracket_placeholder_label) return event.bracket_placeholder_label;
  // Wave 4.3-H: prefer joined tournaments.name over denormalized
  // events.tournament_name (the latter can be stale, producing same-tournament
  // inconsistencies across rows in a single digest).
  const tournName = tournament?.name || event.tournament_name || 'Tournament';
  if (!tournament) return tournName;
  const eventDow = dowFmt.format(new Date(event.start_at));
  const tStart = tournament.start_date ? new Date(`${tournament.start_date}T00:00:00`) : null;
  const tStartDow = tStart ? dowFmt.format(tStart) : null;
  if (eventDow === 'Fri' && tStartDow === 'Sat') return `${tournName} — see Thursday email`;
  if (eventDow === 'Sat') return `${tournName} — pool play`;
  if (eventDow === 'Sun') {
    const isChampDay = (tournament.rules?.bracket_day_count || 0) > 0;
    return `${tournName} — ${isChampDay ? 'championship day' : 'bracket day'}`;
  }
  return tournName;
}

function buildEventRow(event, ctx) {
  const team = ctx.teamsMap.get(event.team_id) || {};
  const teamName = team.name || 'Team';
  const isTournament = event.event_type === 'tournament' || event.is_bracket_placeholder;
  const counts = ctx.rsvpCountsByEvent?.get?.(event.id);
  if (isTournament) {
    const tournament = event.tournament_id ? ctx.tournamentsMap.get(event.tournament_id) : null;
    return {
      team_name: teamName,
      team_color: team.team_color || '#4a8fd4',
      primary: `${teamName} · Tournament`,
      secondary: deriveTournamentLabel(event, tournament),
      variant: 'tournament_placeholder',
      location_link: null,
      rsvp_counts: counts || undefined,
    };
  }
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] || 'Event';
  const locationName = event.locations?.name || event.location || 'Location TBD';
  const locParts = [locationName, event.sub_location].filter(Boolean).join(', ');
  const secondary = locParts ? `${timeRange(event)} · ${locParts}` : timeRange(event);
  return {
    team_name: teamName,
    team_color: team.team_color || '#4a8fd4',
    primary: `${teamName} · ${typeLabel}`,
    secondary,
    variant: 'standard',
    location_link: event.locations?.google_maps_url || null,
    rsvp_counts: counts || undefined,
  };
}

export function buildScheduleSection({ events, teams, tournaments, rsvpCountsByEvent }) {
  if (!events?.length) return null;
  const teamsMap = new Map((teams || []).map((t) => [t.id, t]));
  const tournamentsMap = new Map((tournaments || []).map((t) => [t.id, t]));
  const ctx = { teamsMap, tournamentsMap, rsvpCountsByEvent };
  const groups = new Map();
  const sorted = [...events].sort((a, b) => {
    const t = new Date(a.start_at) - new Date(b.start_at);
    if (t !== 0) return t;
    const aSort = teamsMap.get(a.team_id)?.sort_order ?? 0;
    const bSort = teamsMap.get(b.team_id)?.sort_order ?? 0;
    return aSort - bSort;
  });
  for (const ev of sorted) {
    if (!ev?.start_at) continue;
    const key = dayKey(ev.start_at);
    if (!groups.has(key)) groups.set(key, { day_label: dayLabel(ev.start_at), events: [] });
    groups.get(key).events.push(buildEventRow(ev, ctx));
  }
  const days = [...groups.values()];
  if (!days.length) return null;
  return { kind: 'weekly_schedule', days };
}
