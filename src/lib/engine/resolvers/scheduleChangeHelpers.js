// Wave 4.2-A-5 — pure helpers for scheduleChange resolver pair.

const NY_TZ = 'America/New_York';
const longDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, weekday: 'long', month: 'long', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: NY_TZ, hour: 'numeric', minute: '2-digit', hour12: true });

const TIME_FIELDS = new Set(['start_at', 'end_at', 'cancelled_at']);
const STRING_FIELDS = new Set(['location', 'opponent', 'cancellation_reason', 'title']);

const EVENT_TYPE_LABEL = { game: 'Game', practice: 'Practice', skills_lab: 'Skills Lab', tryout: 'Tryout', tournament: 'Tournament', other: 'Event' };

export class NoScheduleChangeError extends Error {
  constructor(eventId) { super(`No event_change_audit row for event ${eventId}.`); this.name = 'NoScheduleChangeError'; this.eventId = eventId; }
}
export class NoActualScheduleChangeError extends Error {
  constructor(eventId) { super(`Audit row for event ${eventId} has no actual changes after normalization.`); this.name = 'NoActualScheduleChangeError'; this.eventId = eventId; }
}

export function trim(s) { return (s == null ? '' : String(s)).trim(); }

export function eventTypeLabel(type) { return EVENT_TYPE_LABEL[type] || 'Event'; }

export function formatLongDay(iso) { return iso ? longDayFmt.format(new Date(iso)) : ''; }
export function formatTime(iso) { return iso ? timeFmt.format(new Date(iso)) : ''; }
export function formatRange(startIso, endIso) {
  const day = formatLongDay(startIso);
  const a = formatTime(startIso); const b = formatTime(endIso);
  if (!day) return '';
  if (a && b) return `${day} from ${a} to ${b}`;
  if (a) return `${day} at ${a}`;
  return day;
}

function normalizeValue(field, value) {
  if (value == null || value === '') return null;
  if (TIME_FIELDS.has(field)) {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (STRING_FIELDS.has(field)) return trim(value);
  return value;
}

export function computeDiff(before = {}, after = {}) {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const changed_fields = [];
  const before_normalized = {};
  const after_normalized = {};
  for (const k of keys) {
    const bv = normalizeValue(k, before?.[k]);
    const av = normalizeValue(k, after?.[k]);
    before_normalized[k] = bv;
    after_normalized[k] = av;
    if (bv !== av) changed_fields.push(k);
  }
  changed_fields.sort();
  return { changed_fields, before_normalized, after_normalized };
}

export function buildNarrative(audit, event, before, after, changed) {
  const label = eventTypeLabel(event.event_type);
  const labelLc = label.toLowerCase();
  const seriesPrefix = audit.recurrence_scope === 'series' ? `All future ${event.teams?.name || 'team'} ${labelLc}s: ` : '';
  if (audit.change_kind === 'cancelled') {
    const reason = trim(after?.cancellation_reason);
    const day = formatLongDay(event.start_at);
    let txt = `This ${labelLc} on ${day} has been cancelled.`;
    if (reason) txt += ` ${reason}`;
    return seriesPrefix + txt;
  }
  const startChanged = changed.includes('start_at');
  const endChanged = changed.includes('end_at');
  if (startChanged && endChanged) {
    return `${seriesPrefix}${label} has moved from ${formatRange(before.start_at, before.end_at)} to ${formatRange(after.start_at, after.end_at)}.`;
  }
  if (startChanged) {
    const oldDay = formatLongDay(before.start_at); const newDay = formatLongDay(after.start_at);
    if (oldDay !== newDay) return `${seriesPrefix}${label} has moved from ${oldDay} at ${formatTime(before.start_at)} to ${newDay} at ${formatTime(after.start_at)}.`;
    return `${seriesPrefix}${label} on ${oldDay} has moved from ${formatTime(before.start_at)} to ${formatTime(after.start_at)}.`;
  }
  if (endChanged) {
    return `${seriesPrefix}${label} on ${formatLongDay(event.start_at)} now ends at ${formatTime(after.end_at)} instead of ${formatTime(before.end_at)}.`;
  }
  if (changed.includes('location')) {
    return `${seriesPrefix}Venue has changed from ${before.location || 'TBD'} to ${after.location || 'TBD'} for ${formatLongDay(event.start_at)}.`;
  }
  if (changed.includes('opponent')) {
    return `${seriesPrefix}Opponent has changed from ${before.opponent || 'TBD'} to ${after.opponent || 'TBD'} for ${formatLongDay(event.start_at)}.`;
  }
  return `${seriesPrefix}${label} details updated.`;
}
