// AAU ingest — pure score/match logic. VITEST-COVERED SOURCE OF TRUTH.
// Deno mirror: supabase/functions/ingest-game-results/_helpers.ts (AP #30 —
// keep the two byte-near-identical apart from TS annotations; change both in
// the same commit). Standard ES only (no Node/Deno APIs) so they stay in sync.
//
// BUILD SPEC v3 §3 (DR-A=A1): the scores writer (ingest-game-results) consumes
// already-identified games and writes ONLY game_results. It does NOT parse
// TourneyMachine or derive schedule — that stays the schedule path's job.

// Window for matching a scraped game to an existing event by start time.
// Tournament start times drift vs. the scraped feed; 3h absorbs slot shifts
// without colliding adjacent games for the same team.
export const EVENT_MATCH_WINDOW_MS = 3 * 60 * 60 * 1000;

/** W/L/T from two scores; null when either score is missing (unscored game). */
export function computeResult(ourScore, opponentScore) {
  if (ourScore == null || opponentScore == null) return null;
  if (ourScore > opponentScore) return 'W';
  if (ourScore < opponentScore) return 'L';
  return 'T';
}

/** our − opponent; null when either score is missing. */
export function computePointDifferential(ourScore, opponentScore) {
  if (ourScore == null || opponentScore == null) return null;
  return ourScore - opponentScore;
}

/** True when two ISO timestamps are within `windowMs` of each other. */
export function withinWindow(isoA, isoB, windowMs = EVENT_MATCH_WINDOW_MS) {
  const a = Date.parse(isoA);
  const b = Date.parse(isoB);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(a - b) <= windowMs;
}

/** Normalize an opponent name for case/space-insensitive matching. */
export function normalizeName(name) {
  return (name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Pick the best matching event for a scraped game from candidate events of the
 * same team. Match-only (B2): returns the event id, or null → caller REVIEW
 * FLAGS it (never a silent insert). Prefers the closest start_at within window
 * with a matching opponent name.
 */
export function matchEvent(scraped, candidateEvents) {
  const oppNorm = normalizeName(scraped.opponent);
  let best = null;
  let bestDelta = Infinity;
  for (const ev of candidateEvents || []) {
    if (normalizeName(ev.opponent) !== oppNorm) continue;
    if (!withinWindow(scraped.start_at, ev.start_at)) continue;
    const delta = Math.abs(Date.parse(scraped.start_at) - Date.parse(ev.start_at));
    if (delta < bestDelta) { bestDelta = delta; best = ev; }
  }
  return best ? best.id : null;
}

/** Build the game_results upsert row from a matched scraped game. */
export function buildGameResultRow(scraped, eventId, orgId) {
  return {
    org_id: orgId,
    event_id: eventId,
    external_game_id: scraped.external_game_id,
    our_score: scraped.our_score ?? null,
    opponent_score: scraped.opponent_score ?? null,
    result: computeResult(scraped.our_score, scraped.opponent_score),
    point_differential: computePointDifferential(scraped.our_score, scraped.opponent_score),
  };
}
