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
