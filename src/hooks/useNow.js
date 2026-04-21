import { useState, useEffect } from 'react';

// Returns the current time in milliseconds, updated on a configurable
// interval. Replaces direct Date.now() calls in render paths. The
// default 60_000ms interval is appropriate for schedule-adjacent UI
// where minute-level accuracy is enough. Pass a smaller interval for
// countdown timers that need to tick faster.
//
// Usage:
//   const now = useNow();            // updates every 60s
//   const now = useNow(1000);        // updates every 1s
//
// Always stable identity per component mount — downstream memos that
// depend on now will recompute naturally when now advances.
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
