// Wave 5 PR 5b — pure helpers for the family_guide resolver:
// date-range parsing, kid+event grouping, and cross-kid conflict
// detection. No DB calls; no IO. Caller passes data; helpers
// transform.
//
// Conflict detection taxonomy (decided in 5a, implemented here):
//   1. Same-day overlapping (same time, same or different venues)
//   2. Same-day close-together with travel implication
//      (back-to-back games at venues >= TRAVEL_GAP_MIN minutes
//      apart by elapsed time, computed by absolute distance
//      between start_at values when both kids have games on the
//      same day with no overlap but a tight gap)
// Same-day non-overlapping with reasonable travel: NOT a conflict.
// Different-day: NOT a conflict.

import { etDateStr, formatDayLabel, formatTime } from '../etDate';

const DEFAULT_GAME_MINUTES = 60;
const TRAVEL_GAP_MIN = 30;

// DST-correct ET formatting now lives in the shared engine/etDate module
// (replaced the hardcoded -4h offset that was wrong in EST, Nov–Mar).
// Re-exported so existing importers of these names keep working.
export { formatDayLabel, formatTime } from '../etDate';

export function formatDateRange(dateRange) {
  if (!dateRange?.start || !dateRange?.end) return '';
  const fmt = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    return m ? `${parseInt(m[2], 10)}/${parseInt(m[3], 10)}` : s;
  };
  return `${fmt(dateRange.start)} – ${fmt(dateRange.end)}`;
}

// Groups events by kid (one row per kid×team because a kid on two
// teams has events on each). Each kid block carries the kid's
// player_id, the team they're playing on for that subset, the
// team_color of that team, and the sorted events. Same kid on
// two teams gets two blocks — VIP header sums the event_count
// across blocks.
export function groupEventsByKid(kids, events) {
  const out = [];
  const byKey = new Map();
  for (const k of kids || []) {
    for (const t of k.teams || []) {
      const key = `${k.player_id}|${t.team_id}`;
      const block = {
        player_id: k.player_id,
        first_name: k.first_name,
        team_id: t.team_id,
        team_name: t.team_name,
        team_color: t.team_color || '#4a8fd4',
        sort_order: t.sort_order ?? 0,
        events: [],
      };
      byKey.set(key, block);
      out.push(block);
    }
  }
  for (const ev of events || []) {
    for (const block of out) {
      if (block.team_id === ev.team_id) block.events.push(ev);
    }
  }
  for (const block of out) {
    block.events.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  }
  out.sort((a, b) => (a.sort_order - b.sort_order) || (a.first_name || '').localeCompare(b.first_name || ''));
  return out;
}

// Cross-kid conflict detection. Two events on the same day are a
// conflict when either:
//   (a) their time windows overlap (end-time falls back to
//       start + DEFAULT_GAME_MINUTES)
//   (b) gap between A's end and B's start is < TRAVEL_GAP_MIN
//       minutes (parent cannot physically travel between)
// Same-kid pairs are NOT conflicts (kid plays both; parent only
// needs to be at one). Different-day pairs are NOT conflicts.
export function detectConflicts(kidsWithEvents) {
  const allEvents = [];
  for (const block of kidsWithEvents || []) {
    for (const ev of block.events || []) {
      allEvents.push({ ...ev, _kid: block });
    }
  }
  allEvents.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const conflicts = [];
  for (let i = 0; i < allEvents.length; i++) {
    const a = allEvents[i];
    const aStart = new Date(a.start_at).getTime();
    const aEnd = a.end_at ? new Date(a.end_at).getTime() : aStart + DEFAULT_GAME_MINUTES * 60 * 1000;
    // ET calendar date (not UTC) so an evening-ET event isn't mis-grouped
    // into the next UTC day (e.g. 8 PM EST = 01:00 UTC next day).
    const aDay = etDateStr(a.start_at);
    for (let j = i + 1; j < allEvents.length; j++) {
      const b = allEvents[j];
      const bStart = new Date(b.start_at).getTime();
      const bDay = etDateStr(b.start_at);
      if (aDay !== bDay) break;
      if (a._kid.player_id === b._kid.player_id) continue;
      const gapMin = (bStart - aEnd) / (60 * 1000);
      const overlapping = bStart < aEnd;
      const tightTravel = gapMin >= 0 && gapMin < TRAVEL_GAP_MIN;
      if (!overlapping && !tightTravel) continue;
      conflicts.push({
        date_label: formatDayLabel(a.start_at),
        kid_a: a._kid.first_name, team_a: a._kid.team_name, time_a: formatTime(a.start_at), color_a: a._kid.team_color,
        kid_b: b._kid.first_name, team_b: b._kid.team_name, time_b: formatTime(b.start_at), color_b: b._kid.team_color,
        reason: overlapping ? 'overlap' : 'tight_travel',
      });
    }
  }
  return conflicts;
}

export { DEFAULT_GAME_MINUTES, TRAVEL_GAP_MIN };

// PR 5b-1 — kind-aware event-count label for the VIP header.
// V-37 finding #1: header rendered "4 GAMES" when the 4 events
// were all PRACTICES. Accuracy fix: read events[i].event_type
// (added to the resolver select in 5b-1) and emit the exact kind
// label when all events share a kind; fall back to generic "EVENTS"
// when mixed or unknown. Tournament events count as games (the
// competition-type distinction is internal per CLAUDE.md §5);
// is_scrimmage stays a flag on a game, not a separate bucket.
export function summarizeEventKinds(events) {
  const list = events || [];
  if (!list.length) return 'NO EVENTS';
  let games = 0;
  let practices = 0;
  for (const ev of list) {
    const t = ev?.event_type;
    if (t === 'game' || t === 'tournament') games += 1;
    else if (t === 'practice') practices += 1;
  }
  const total = list.length;
  if (games === total) return total === 1 ? '1 GAME' : `${total} GAMES`;
  if (practices === total) return total === 1 ? '1 PRACTICE' : `${total} PRACTICES`;
  return total === 1 ? '1 EVENT' : `${total} EVENTS`;
}
