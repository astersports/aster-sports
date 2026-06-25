// AAU ingest — pure score/match logic (Deno mirror).
// VITEST source of truth: src/lib/cron/ingestGameResultsHelpers.js (AP #30 —
// keep byte-near-identical apart from TS annotations; change both in the same
// commit). Standard ES only so the two stay in sync.

export interface ScrapedGame {
  external_game_id: string;
  team_id: string;
  opponent: string;
  start_at: string;
  our_score?: number | null;
  opponent_score?: number | null;
}
export interface CandidateEvent { id: string; opponent: string | null; start_at: string; }

export const EVENT_MATCH_WINDOW_MS = 3 * 60 * 60 * 1000;

export function computeResult(our?: number | null, opp?: number | null): 'W' | 'L' | 'T' | null {
  if (our == null || opp == null) return null;
  if (our > opp) return 'W';
  if (our < opp) return 'L';
  return 'T';
}

export function computePointDifferential(our?: number | null, opp?: number | null): number | null {
  if (our == null || opp == null) return null;
  return our - opp;
}

export function withinWindow(isoA: string, isoB: string, windowMs = EVENT_MATCH_WINDOW_MS): boolean {
  const a = Date.parse(isoA);
  const b = Date.parse(isoB);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(a - b) <= windowMs;
}

export function normalizeName(name?: string | null): string {
  return (name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function matchEvent(scraped: ScrapedGame, candidateEvents: CandidateEvent[]): string | null {
  const oppNorm = normalizeName(scraped.opponent);
  let best: CandidateEvent | null = null;
  let bestDelta = Infinity;
  for (const ev of candidateEvents || []) {
    if (normalizeName(ev.opponent) !== oppNorm) continue;
    if (!withinWindow(scraped.start_at, ev.start_at)) continue;
    const delta = Math.abs(Date.parse(scraped.start_at) - Date.parse(ev.start_at));
    if (delta < bestDelta) { bestDelta = delta; best = ev; }
  }
  return best ? best.id : null;
}

export function buildGameResultRow(scraped: ScrapedGame, eventId: string, orgId: string) {
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
