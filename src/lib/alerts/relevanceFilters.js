// Tier 3 v1 PR 5 — alert relevance filters per data ownership.
//
// Per architectural review (2026-05-17): UI filters alerts by data
// ownership, not by role. Hook stays role-agnostic per Gap 6 lock;
// each page applies the filter relevant to its audience scope.
//
// Filter semantics:
//   - ADMIN_ONLY_TYPES drop entirely for non-admin scopes
//   - Event-bearing alerts (alert.data.events present) filter to
//     events whose team_id is in the scoped team set; severity is
//     recomputed for location_unassigned (critical when any
//     filtered event is <24h out, else warning)
//   - Event-less alerts not in ADMIN_ONLY: pass through (none in
//     v1 catalog; arm the door for future kinds)
//
// PR 5 ships filterAlertsForParent. PR 6 will consume
// filterAlertsForCoach.

// Alert types that fire org-wide rollup data with no per-team or
// per-family scoping shape. These drop entirely for non-admin
// scopes (parent, coach). Extract to alert_types.audience_scope
// column when a third admin-only type arrives.
const ADMIN_ONLY_TYPES = new Set(['briefing_overdue', 'payment_overdue']);

function filterEventsByTeamScope(alert, teamIdSet) {
  const events = alert.data?.events || [];
  const filtered = events.filter((e) => teamIdSet.has(e.team_id));
  if (!filtered.length) return null;
  let severity = alert.severity;
  const extras = {};
  if (alert.alert_type_key === 'location_unassigned') {
    const now = Date.now();
    const criticalCount = filtered.filter((e) => (new Date(e.start_at).getTime() - now) <= 24 * 3600000).length;
    severity = criticalCount ? 'critical' : 'warning';
    extras.critical_count = criticalCount;
  }
  return {
    ...alert,
    severity,
    data: { ...alert.data, events: filtered, affected_count: filtered.length, count: filtered.length, ...extras },
  };
}

function teamIdsFromKids(kids) {
  const set = new Set();
  for (const k of kids || []) {
    if (k.teamIds?.length) k.teamIds.forEach((t) => set.add(t));
    else if (k.teamId) set.add(k.teamId);
  }
  return set;
}

function applyScopeFilter(alerts, teamIdSet) {
  if (!teamIdSet.size) return [];
  const out = [];
  for (const a of alerts || []) {
    if (ADMIN_ONLY_TYPES.has(a.alert_type_key)) continue;
    if (a.data?.events) {
      const filtered = filterEventsByTeamScope(a, teamIdSet);
      if (filtered) out.push(filtered);
    } else {
      out.push(a);
    }
  }
  return out;
}

export function filterAlertsForParent(alerts, kids) {
  return applyScopeFilter(alerts, teamIdsFromKids(kids));
}

export function filterAlertsForCoach(alerts, teamIds) {
  return applyScopeFilter(alerts, new Set(teamIds || []));
}

export { ADMIN_ONLY_TYPES };
