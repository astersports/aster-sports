// Tier 3 v1 PR 4 — interval polling primitive.
//
// Per Gap 8 + Q1 decision: client-side alert evaluation runs on
// home page mount + 60s interval. This hook abstracts the polling
// pattern so the alert evaluator code stays free of setInterval
// boilerplate.
//
// Pattern derived from Dan Abramov's canonical useInterval:
// callback in a ref so the interval body always sees the latest
// closure without resubscribing on every render.

import { useEffect, useRef } from 'react';

export function useInterval(callback, delayMs) {
  const savedCallback = useRef(callback);

  // Always keep ref pointing at the latest callback. No effect
  // re-subscription needed when callback identity changes.
  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    if (delayMs == null || delayMs <= 0) return undefined;
    const id = setInterval(() => { savedCallback.current?.(); }, delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
