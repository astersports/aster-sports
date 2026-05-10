// Wave 4.2-A-6 — pure helpers for rsvpNudge resolver pair.

const NY_TZ = 'America/New_York';
const longDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'long', month: 'long', day: 'numeric' });
const weekdayLongFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'long' });
const monthDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, month: 'short', day: 'numeric' });
const isoDateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: NY_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, hour: 'numeric', minute: '2-digit', hour12: true });

export class EventHasNoTeamError extends Error {
  constructor(eventId) { super(`Event ${eventId} has no team_id; rsvp_nudge requires a team-anchored event.`); this.name = 'EventHasNoTeamError'; this.eventId = eventId; }
}
export class EventAlreadyStartedError extends Error {
  constructor(eventId) { super(`Event ${eventId} has already started; cannot nudge.`); this.name = 'EventAlreadyStartedError'; this.eventId = eventId; }
}

export function trim(s) { return (s == null ? '' : String(s)).trim(); }

export function formatTime(iso) { return iso ? timeFmt.format(new Date(iso)) : ''; }
export function formatLongDay(iso) { return iso ? longDayFmt.format(new Date(iso)) : ''; }
export function formatMonthDay(iso) { return iso ? monthDayFmt.format(new Date(iso)) : ''; }
export function formatWeekday(iso) { return iso ? weekdayLongFmt.format(new Date(iso)) : ''; }

function easternDateStr(d) { return isoDateFmt.format(d); }

export function computeDayDiff(now, startIso) {
  const a = easternDateStr(now);
  const b = easternDateStr(new Date(startIso));
  const da = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const db = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((db - da) / 86400000);
}

export function urgencyDayLabel(now, startIso) {
  const diff = computeDayDiff(now, startIso);
  if (diff === 0) return 'Today';
  if (diff === 1) return `Tomorrow (${formatWeekday(startIso)})`;
  if (diff >= 2 && diff <= 6) return formatWeekday(startIso);
  return formatMonthDay(startIso);
}

export function computeUrgency(startIso, endIso, now) {
  const hours_until = (new Date(startIso).getTime() - now.getTime()) / 3600000;
  const day_label = urgencyDayLabel(now, startIso);
  const time_label = formatTime(startIso);
  const time_range_label = endIso ? `${formatTime(startIso)} – ${formatTime(endIso)}` : formatTime(startIso);
  return { hours_until, day_label, time_label, time_range_label };
}

export function joinKidNames(names) {
  if (!names || !names.length) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

const EVENT_TYPE_LABEL = { game: 'Game', practice: 'Practice', skills_lab: 'Skills Lab', tryout: 'Tryout', tournament: 'Tournament', other: 'Event' };
export function eventTypeLabel(type) { return EVENT_TYPE_LABEL[type] || 'Event'; }

export function deriveEventLabel(event) {
  if (event.title && /skills lab/i.test(event.title)) return 'Skills Lab';
  return eventTypeLabel(event.event_type);
}
