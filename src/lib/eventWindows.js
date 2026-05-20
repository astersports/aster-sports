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
export const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000; // 60 min when end_at missing

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
