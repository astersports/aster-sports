// Shared date / time formatters and validators.
// Every page that displays or parses a date/time should use these helpers
// instead of inlining `toLocaleDateString` calls.

import { MIN_DATE_YEAR, MAX_DATE_YEAR } from './constants';

// ─── Display formatters ──────────────────────────────────────

// "Monday, April 13" — used in Schedule date headers.
export function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// "Apr 13" — compact, no year. Used in proximity badges and ICS exports.
export function formatDateShort(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// "Apr 13, 2026" — with year. Used in admin tables and confirmation dialogs
// where the year matters because we may be looking at past/future events.
export function formatDateLong(d) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// "6:00 PM"
export function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ─── HTML <input> serializers ────────────────────────────────

// "YYYY-MM-DDTHH:MM" — for <input type="datetime-local">.
// Adjusts for the local timezone offset so the picker shows the user's wall-
// clock time, not UTC.
export function formatDateInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// "HH:MM" — for <input type="time">.
export function formatTimeInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(11, 16);
}

// ─── Relative time helpers ──────────────────────────────────

// Future-facing countdown — "in 30 minutes", "in 3 hours", "Tomorrow at 6:00 PM",
// "Saturday at 9:00 AM". Returns null for past times so callers can hide the
// banner.
export function relativeTime(iso) {
  const target = new Date(iso);
  const diff = target.getTime() - Date.now();
  if (diff < 0) return null;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins} minute${mins !== 1 ? 's' : ''}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs} hour${hrs !== 1 ? 's' : ''}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (target.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${formatTime(iso)}`;
  }
  return `${target.toLocaleDateString('en-US', { weekday: 'long' })} at ${formatTime(iso)}`;
}

// Live countdown for an upcoming event happening today — e.g.
// "Starts in 2h 15m", "Starts in 45m", "Starts in less than a minute".
// Returns null if the event is more than 12 hours away (caller should
// fall back to formatTime), or if it's already started/finished (caller
// should use eventStatus instead).
export function formatCountdown(startIso) {
  const start = new Date(startIso).getTime();
  const diff = start - Date.now();
  if (diff <= 0 || diff > 12 * 3600000) return null;
  const totalMins = Math.floor(diff / 60000);
  if (totalMins < 1) return 'Starts in less than a minute';
  if (totalMins < 60) return `Starts in ${totalMins}m`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `Starts in ${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
}

// Returns a coarse status for live event UI: "upcoming" | "in_progress" |
// "completed". Used by EventCard to swap the time text for "In progress" /
// "Completed" labels on the day of the event.
export function eventLiveStatus(startIso, endIso) {
  const now = Date.now();
  const start = new Date(startIso).getTime();
  // If end_at is missing, assume 90 minutes — long enough for a typical
  // practice or game.
  const end = endIso ? new Date(endIso).getTime() : start + 90 * 60000;
  if (now < start) return 'upcoming';
  if (now < end) return 'in_progress';
  return 'completed';
}

// Past-facing relative — "5m ago", "3h ago", "2d ago". Used for change logs,
// comments, and the "what changed" lists on event cards.
export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Alias retained because Schedule's "What changed" list reads naturally as
// `changeAgo(...)`.
export const changeAgo = timeAgo;

// ─── Validators ─────────────────────────────────────────────
// Reject obvious typos (year < 2024 or > 2030) — common when users type a
// date manually instead of using the picker.

export function isValidDatetime(val) {
  if (!val) return true; // empty is acceptable for optional fields
  const d = new Date(val);
  return (
    !isNaN(d.getTime()) &&
    d.getFullYear() >= MIN_DATE_YEAR &&
    d.getFullYear() <= MAX_DATE_YEAR
  );
}

export function isValidDate(val) {
  if (!val) return true;
  const d = new Date(val + 'T12:00:00');
  return (
    !isNaN(d.getTime()) &&
    d.getFullYear() >= MIN_DATE_YEAR &&
    d.getFullYear() <= MAX_DATE_YEAR
  );
}
