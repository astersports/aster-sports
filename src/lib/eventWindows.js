// Event time-window constants. Centralized so GameDayMode, ArrivalBoard,
// ParentArrivalActions, useEventTimeWindow, and the upcoming hero
// component all derive game-day / parent-arrival / past gates from one
// source of truth.
//
// Gap 2 from the L99 event detail redesign (2026-05-20): the same window
// definitions had drifted across 4 callsites. Pulling them here ensures
// a future tuning (e.g., shifting parent-arrival from 2h → 90min) takes
// one edit, not four.

export const GAME_DAY_WINDOW_BEFORE_MS = 4 * 60 * 60 * 1000; // 4h before start
export const GAME_DAY_WINDOW_AFTER_MS = 3 * 60 * 60 * 1000;  // 3h after end
export const PARENT_ARRIVAL_WINDOW_BEFORE_MS = 2 * 60 * 60 * 1000; // 2h before start
export const PARENT_ARRIVAL_WINDOW_AFTER_MS = 60 * 60 * 1000; // 1h after start
export const LIVE_GAME_WINDOW_AFTER_MS = 4 * 60 * 60 * 1000; // 4h after start = "Live" subtitle

// SD-2 time-state spine (SCHEDULE_L99_BUILD_SPEC §1, 2026-06-12). The ONE
// event-duration constant — the legacy trio (60min here, 4h inline in
// EventDetailPage, "never ends" in EventCard) is collapsed to this.
// eventTimeStateAudit.test.js gates re-introduction of divergent copies.
export const EVENT_DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000; // 2h when end_at missing

// end_at when present; else start_at + default duration. Never returns
// null for an event with a start_at — DB-8 tolerance: legacy NULL-end
// rows gray out 2h after start instead of living forever (the import-side
// fix that stops the NULL class from growing lands in PR-C').
export function eventEnd(event) {
  if (event?.end_at) return event.end_at;
  return new Date(new Date(event.start_at).getTime() + EVENT_DEFAULT_DURATION_MS).toISOString();
}

// CONTRACT: three states only — 'upcoming' | 'happening_now' | 'completed'.
// Every is-it-done consumer reads this (EventCard, MatchupCard,
// EventDetailPage, schedule section partitions, useEventTimeWindow).
export function eventTimeState(event, now = Date.now()) {
  const start = new Date(event.start_at).getTime();
  const end = new Date(eventEnd(event)).getTime();
  if (now < start) return 'upcoming';
  if (now <= end) return 'happening_now';
  return 'completed';
}

// SD-11: RSVP closes exactly at start. Card controls disable on this
// everywhere; PR-B' re-points the detail surface + adds staff override.
export function isRsvpOpen(startAt, now = Date.now()) {
  return now < new Date(startAt).getTime();
}

// L99 Q3 sub (Frank-confirmed): parents see Location auto-expanded when
// their kid is RSVP'd Going AND we're inside the game-day window. Hides
// parking/address/directions one tap closer at the moment they're needed.
export function shouldAutoExpandLocation({ role, event, nowMs, teamId, myChildren, rsvps }) {
  if (role !== 'parent' || !event?.start_at) return false;
  const startMs = new Date(event.start_at).getTime();
  if (nowMs < startMs - GAME_DAY_WINDOW_BEFORE_MS || nowMs > startMs + GAME_DAY_WINDOW_AFTER_MS) return false;
  const myKidIds = new Set((myChildren || []).filter((c) => (c.teamIds || []).includes(teamId) || c.teamId === teamId).map((c) => c.playerId));
  return (rsvps || []).some((r) => r.response === 'going' && myKidIds.has(r.player_id));
}
