// Wave 3.14 — derives time-window flags from event start/end. Used by
// EventDetailPage to gate game-day mode and game results entry.
//
// Re-evaluates every 60 seconds via interval so the page transitions
// states naturally as time passes (parent opens 5 min before tip-off
// and game-day mode appears live without a refresh).

import { useEffect, useState } from 'react';

const GAME_DAY_PRE_MS = 4 * 60 * 60 * 1000;   // 4h before start
const GAME_DAY_POST_MS = 3 * 60 * 60 * 1000;  // 3h after end
const DEFAULT_DURATION_MS = 60 * 60 * 1000;   // 60 min when end_at missing
const TICK_MS = 60 * 1000;

export function computeFlags(event, now) {
  if (!event?.start_at) {
    return { isPast: false, isLive: false, isGameDay: false, isUpcoming: false, timeToStart: null };
  }
  const start = new Date(event.start_at).getTime();
  const end = event.end_at ? new Date(event.end_at).getTime() : start + DEFAULT_DURATION_MS;
  const winStart = start - GAME_DAY_PRE_MS;
  const winEnd = end + GAME_DAY_POST_MS;
  return {
    isPast: now >= end,
    isLive: now >= start && now < end,
    isGameDay: now >= winStart && now <= winEnd,
    isUpcoming: now < start,
    timeToStart: start - now,
  };
}

export function useEventTimeWindow(event) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);
  return computeFlags(event, now);
}
