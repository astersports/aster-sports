// Builds the weekly_schedule section data for the digest composer.
// Groups events by NY-tz local date, decorates with team color stripes,
// derives tournament placeholder text per D10. Pure function; no fetch.
//
// Wave 3.5 D2 + D4: event row now carries
//   location_link   — google_maps_url from joined locations row (null for
//                     tournament placeholder venues without a pin)
//   rsvp_counts     — { going, maybe, out } from rsvpCountsByEvent map.
// Composer (kind composer) plumbs both inputs from useDigestEvents fetches.

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
  const tournName = event.tournament_name || tournament?.name || 'Tournament';
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
  const counts = ctx.rsvpCountsByEvent?.get(event.id);
  if (isTournament) {
    const tournament = event.tournament_id ? ctx.tournamentsMap.get(event.tournament_id) : null;
    return {
      team_name: teamName,
      team_color: team.team_color || '#4a8fd4',
      primary: `${teamName} · Tournament`,
      secondary: deriveTournamentLabel(event, tournament),
      variant: 'tournament_placeholder',
      // Tournament placeholders intentionally have no map link.
      location_link: null,
      rsvp_counts: counts || undefined,
    };
  }
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] || 'Event';
  const locationName = event.locations?.name || event.location;
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
  const sorted = [...events].sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
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
