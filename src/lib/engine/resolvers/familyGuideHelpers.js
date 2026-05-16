// Wave 5 PR 5a — pure helpers for the family_guide resolver:
// date-range parsing, kid-grouping, and conflict detection across
// a parent's children. No DB calls; no IO. Caller passes data;
// helpers transform. Tested in isolation against fixtures in 5b.
//
// 5a ships date-formatting + a stub conflict detector. 5b lands
// the real grouping + conflict logic with travel-time awareness.

const DEFAULT_GAME_MINUTES = 60;

function pad2(n) { return String(n).padStart(2, '0'); }

function toEt(iso) {
  if (!iso) return null;
  const utcMs = new Date(iso).getTime();
  return new Date(utcMs - 4 * 60 * 60 * 1000);
}

export function formatDateRange(dateRange) {
  if (!dateRange?.start || !dateRange?.end) return '';
  const fmt = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    return m ? `${parseInt(m[2], 10)}/${parseInt(m[3], 10)}` : s;
  };
  return `${fmt(dateRange.start)} – ${fmt(dateRange.end)}`;
}

export function formatDayLabel(iso) {
  const et = toEt(iso);
  if (!et) return 'TBD';
  const wk = et.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
  return `${wk} ${et.getUTCMonth() + 1}/${et.getUTCDate()}`;
}

export function formatTime(iso) {
  const et = toEt(iso);
  if (!et) return 'TBD';
  let h = et.getUTCHours(); const m = et.getUTCMinutes();
  const am = h < 12; if (h === 0) h = 12; else if (h > 12) h -= 12;
  return `${h}:${pad2(m)} ${am ? 'AM' : 'PM'}`;
}

// 5a stub — real grouping lands in 5b. Returns [{ player_id,
// first_name, team_id, team_name, team_color, events: [...sorted
// by start_at] }]. In 5b the walk parent → players → teams →
// events feeds this shape.
export function groupEventsByKid(/* kids, events */) {
  return [];
}

// 5a stub — real detection lands in 5b. Two-class conflict
// taxonomy per audit-day routing spec:
//   1. Same-day overlapping (same time, same or different venues)
//   2. Same-day close-together with travel implication
//      (back-to-back games at venues >= TRAVEL_GAP_MIN apart)
// Same-day non-overlapping with reasonable travel: NOT a conflict.
// Different-day: NOT a conflict.
export function detectConflicts(/* kidsWithEvents */) {
  return [];
}

export { DEFAULT_GAME_MINUTES };
