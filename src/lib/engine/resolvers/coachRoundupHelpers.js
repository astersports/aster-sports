// Wave 5 PR 4b — pure helpers for the coach_roundup resolver:
// date-range parsing, event-grouping, and conflict detection across
// the coach's teams. No DB calls; no IO. Caller passes data; helpers
// transform. Tested in isolation against fixtures.

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

// Returns [{ team_id, team_name, team_color, sort_order, role,
// events: [...sorted by start_at] }]. Coach's teams come from the
// team_staff join; events come from a single fetch filtered by
// team_id + date range. Both lists may be empty.
export function groupEventsByTeam(teams, events) {
  const out = (teams || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((t) => ({ ...t, events: [] }));
  const byId = new Map(out.map((t) => [t.team_id, t]));
  for (const ev of events || []) {
    const slot = byId.get(ev.team_id);
    if (slot) slot.events.push(ev);
  }
  for (const t of out) t.events.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  return out;
}

// Conflict = two of the coach's teams have events whose time windows
// overlap. End-time falls back to start + DEFAULT_GAME_MINUTES when
// the event has no end_at. Surfaces every conflicting pair once
// (ordered by date, then by earlier start). Per-team pairs only —
// same-team back-to-backs aren't conflicts because the coach is at
// both anyway.
export function detectConflicts(teamsWithEvents) {
  const allEvents = [];
  for (const t of teamsWithEvents || []) {
    for (const ev of t.events || []) allEvents.push({ ...ev, _team: t });
  }
  allEvents.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const conflicts = [];
  for (let i = 0; i < allEvents.length; i++) {
    const a = allEvents[i];
    const aEnd = a.end_at ? new Date(a.end_at).getTime() : new Date(a.start_at).getTime() + DEFAULT_GAME_MINUTES * 60 * 1000;
    for (let j = i + 1; j < allEvents.length; j++) {
      const b = allEvents[j];
      const bStart = new Date(b.start_at).getTime();
      if (bStart >= aEnd) break;
      if (a._team.team_id === b._team.team_id) continue;
      conflicts.push({
        date_label: formatDayLabel(a.start_at),
        team_a: a._team.team_name, time_a: formatTime(a.start_at), color_a: a._team.team_color,
        team_b: b._team.team_name, time_b: formatTime(b.start_at), color_b: b._team.team_color,
      });
    }
  }
  return conflicts;
}
