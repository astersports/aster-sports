// Wave 5 PR 2 — natural-key deduplication for re-imported tournament
// schedules. Per scope read flagged-item #2: smart diff at preview
// time. Three states per parsed row:
//   - NEW       : no existing event matches → INSERT
//   - DUPLICATE : existing event found by natural key → SKIP (operator
//                 can force-insert per-row)
//   - UPDATED   : existing event has same natural key but different
//                 fields → UPDATE-in-place (or skip)
//
// Natural key: tournament_id + team_id + start_at within ±15 min
// + opponent fuzzy match (Levenshtein ≤ 3 via opponentMatching).

import { fuzzyOpponentMatch } from './opponentMatching';

const TIME_TOLERANCE_MS = 15 * 60 * 1000;

function timesWithinTolerance(aISO, bISO) {
  if (!aISO || !bISO) return false;
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  return Math.abs(a - b) <= TIME_TOLERANCE_MS;
}

function fieldsDiffer(parsed, existing) {
  // An unresolved parsed row (no `resolved` block) carries undefined for the
  // resolved fields; comparing those against the existing event spuriously reads
  // as 'updated' and triggers a needless UPDATE. With no resolution to compare,
  // treat it as a duplicate (no diff).
  if (!parsed.resolved) return false;
  const checks = [
    parsed.opponent !== existing.opponent,
    parsed.resolved?.location_id !== existing.location_id,
    String(parsed.court || '') !== String(existing.sub_location || ''),
    !!parsed.is_bonus !== !!existing.is_bonus_game,
  ];
  return checks.some(Boolean);
}

// Returns enriched row with .dedup field: 'new' | 'duplicate' | 'updated'
// + .matched_event_id if matched.
export function classifyRowAgainstExisting(row, existingEvents) {
  if (row.status === 'error') return { ...row, dedup: 'new', matched_event_id: null };
  for (const ev of existingEvents || []) {
    if (ev.tournament_id !== row.tournament_id) continue;
    if (ev.team_id !== row.resolved?.team_id) continue;
    if (!timesWithinTolerance(ev.start_at, row.resolved?.start_at)) continue;
    if (!fuzzyOpponentMatch(row.opponent, ev.opponent)) continue;
    return { ...row, dedup: fieldsDiffer(row, ev) ? 'updated' : 'duplicate', matched_event_id: ev.id };
  }
  return { ...row, dedup: 'new', matched_event_id: null };
}

export function dedupSummary(rows) {
  return rows.reduce((acc, r) => {
    acc[r.dedup || 'new'] = (acc[r.dedup || 'new'] || 0) + 1;
    return acc;
  }, { new: 0, duplicate: 0, updated: 0 });
}
