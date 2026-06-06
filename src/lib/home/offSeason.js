// Off-season detection (D-D). True when the active season has ended
// (end_date in the past) AND nothing upcoming is scheduled. In that state
// the parent + coach homes drop Needs-you + Coming-up and render the
// season-wrap tail; admin keeps a close-out Needs-you (Reconcile + Roll
// rosters). nowMs is injected so callers + tests control the clock
// (React-purity safe — no Date.now() in render).
export function isOffSeason(activeSeason, activities, nowMs = Date.now()) {
  const end = activeSeason?.end_date;
  if (!end) return false;
  if (new Date(end).getTime() >= nowMs) return false;
  const hasUpcoming = (activities || []).some(
    (a) => a.start_at && new Date(a.start_at).getTime() >= nowMs,
  );
  return !hasUpcoming;
}
