// HOME_DESIGN_SPEC §1.1.5 (parent) + §2.1.5 (coach) — UPCOMING PREP.
// Pure derivation: returns the next event within T+24h that has
// `event.notes` set (the public/general notes column — distinct from
// `event.coach_notes` which is admin/coach-private).
//
// No new schema. Reuses the existing event.notes field that the
// activity wizard already writes. Admin sets notes when creating /
// editing an event; this card surfaces them to families T-24h
// before the event.
//
// Hide when no qualifying event in window. Pure derivation — no
// fetches; callers pass the already-filtered events slice. React
// Compiler handles memoization; no manual useMemo (would violate
// react-hooks/preserve-manual-memoization).

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function useUpcomingPrep(events, nowMs) {
  if (!events?.length || !nowMs) return null;
  const windowEnd = nowMs + TWENTY_FOUR_HOURS_MS;
  for (const e of events) {
    if (!e?.start_at || e.status === 'cancelled') continue;
    const startMs = new Date(e.start_at).getTime();
    if (Number.isNaN(startMs) || startMs < nowMs || startMs > windowEnd) continue;
    const notes = (e.notes || '').trim();
    if (!notes) continue;
    return { event: e, notes };
  }
  return null;
}
