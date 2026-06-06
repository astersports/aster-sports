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

// isHomeOffSeason — the home off-season gate generalized to the active-program
// SET (Phase 1, multi-program). The home is off-season only when EVERY active
// program is off-season. With one active program this equals the prior
// isOffSeason(activeSeason, …) — the no-regression invariant. programs entries
// carry `endDate` (useActivePrograms shape).
export function isHomeOffSeason(programs, activities, nowMs = Date.now()) {
  if (!programs?.length) return false;
  return programs.every((p) => isOffSeason({ end_date: p.endDate }, activities, nowMs));
}
