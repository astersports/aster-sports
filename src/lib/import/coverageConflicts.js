// Cutover Wave PR 6 (PR B) — pure coach double-booking detection for the
// schedule importer. No IO; all data injected. The hook
// (useCoverageConflicts) does the fetching and feeds normalized items in.
//
// Design: docs/AUDIT_COVERAGE_DELEGATION_PR6_2026-05-27.md
// Locked routing (Frank 2026-05-27): Q1 = 90-min busy window when no
// end_at; Q2 = broad scope (caller fetches all team events in window);
// Q4 = soft (caller decides; this module only reports).

export const ASSUMED_GAME_MINUTES = 90;

// Busy window in epoch ms. Uses real end_at when present (manually
// created events / practices carry it), else start + 90 min (imported
// games always have end_at = null).
export function busyWindow(startISO, endISO) {
  const start = new Date(startISO).getTime();
  const end = endISO ? new Date(endISO).getTime() : start + ASSUMED_GAME_MINUTES * 60000;
  return { start, end };
}

// Effective coach for an item: an explicit delegation wins; else an
// existing assignment row for the event; else the team's head coach.
// Returns null when no coach can be resolved (can't conflict).
export function effectiveCoach(item, { assignmentMap, teamHeadCoachMap } = {}) {
  if (item.delegated_coach_user_id) return item.delegated_coach_user_id;
  if (item.event_id && assignmentMap?.has(item.event_id)) return assignmentMap.get(item.event_id);
  return teamHeadCoachMap?.get(item.team_id) ?? null;
}

// items: [{ key, team_id, start_at, end_at, event_id?,
//           delegated_coach_user_id?, label }]
// Returns clusters: [{ coach_user_id, events: [item+window, ...] }] where
// each cluster is a maximal run of time-overlapping events for one coach
// (>= 2 events). Back-to-back (end === next start) is NOT a conflict.
export function detectCoverageConflicts(items, { assignmentMap, teamHeadCoachMap } = {}) {
  const enriched = items
    .map((it) => ({ ...it, coach_user_id: effectiveCoach(it, { assignmentMap, teamHeadCoachMap }), ...busyWindow(it.start_at, it.end_at) }))
    .filter((it) => it.coach_user_id);

  const byCoach = new Map();
  for (const it of enriched) {
    if (!byCoach.has(it.coach_user_id)) byCoach.set(it.coach_user_id, []);
    byCoach.get(it.coach_user_id).push(it);
  }

  const clusters = [];
  for (const [coach_user_id, group] of byCoach) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => a.start - b.start);
    let comp = [sorted[0]];
    let compEnd = sorted[0].end;
    const flush = () => { if (comp.length >= 2) clusters.push({ coach_user_id, events: comp }); };
    for (let i = 1; i < sorted.length; i++) {
      const cur = sorted[i];
      if (cur.start < compEnd) { comp.push(cur); compEnd = Math.max(compEnd, cur.end); }
      else { flush(); comp = [cur]; compEnd = cur.end; }
    }
    flush();
  }
  return clusters;
}

// Normalize import preview rows + existing fetched events into the unified
// item shape detectCoverageConflicts consumes. Skips error rows (no
// resolved team) and excludes existing events that ARE the import's own
// matched event (an 'updated' row would otherwise conflict with itself).
export function buildConflictItems(rows, existingEvents) {
  const matchedIds = new Set(rows.map((r) => r.matched_event_id).filter(Boolean));
  const importItems = rows
    .filter((r) => r.status !== 'error' && r.resolved?.team_id && r.resolved?.start_at)
    .map((r, idx) => ({
      key: `import-${idx}`,
      team_id: r.resolved.team_id,
      start_at: r.resolved.start_at,
      end_at: null,
      event_id: r.matched_event_id || null,
      delegated_coach_user_id: r.delegated_coach_user_id || null,
      label: `${r.team || 'Team'} vs ${r.opponent || 'TBD'}`,
    }));
  const existingItems = (existingEvents || [])
    .filter((e) => !matchedIds.has(e.id))
    .map((e) => ({
      key: `existing-${e.id}`,
      team_id: e.team_id,
      start_at: e.start_at,
      end_at: e.end_at || null,
      event_id: e.id,
      delegated_coach_user_id: null,
      label: e.opponent ? `vs ${e.opponent}` : (e.title || 'Existing event'),
    }));
  return [...importItems, ...existingItems];
}
