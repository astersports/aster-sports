// Pure shapers for the coach home. Keep CoachHomePage + useCoachNeedsYou thin.

const ALERT_LABELS = {
  rsvp_shortfall: 'RSVP shortfall',
  opponent_unassigned: 'Opponent needs assigning',
  location_unassigned: 'Location needs assigning',
  data_integrity_event_location_missing: 'Event location missing',
  payment_overdue: 'Payments overdue',
  briefing_overdue: 'Briefing ready to send',
};

// Map a firing alert ({ config_id, alert_type_key, severity, data }) to a
// NeedsYou generic ActionRow item. Title from the type label, subtitle from
// the affected-event count. Avoids duplicating AlertCard's internals — the
// coach NeedsYou only needs a tap-through summary row.
// Per-kind labels for the grouped "Action queue" item (coach + admin).
const QUEUE_LABELS = {
  score_unpublished: ['unpublished score', 'unpublished scores'],
  achievement_pending: ['pending achievement', 'pending achievements'],
  unscored_game: ['game needs a score', 'games need scores'],
  pending_invitation: ['pending invite', 'pending invites'],
};

// Summarize the action queue into one subtitle ("2 games need scores ·
// 1 pending invite") — the grouped-by-domain treatment (R-c).
export function summarizeActionQueue(items) {
  const counts = {};
  for (const it of items || []) counts[it.kind] = (counts[it.kind] || 0) + 1;
  return Object.entries(counts)
    .map(([kind, n]) => {
      const lbl = QUEUE_LABELS[kind] || [kind, kind];
      return `${n} ${n === 1 ? lbl[0] : lbl[1]}`;
    })
    .join(' · ');
}

// Group a coach's teams by the active program each belongs to (C-12: GROUP,
// not filter — a camp's teams render under their program header, not hidden).
// `programs` is the useActivePrograms shape ([{ id, programType, name, teamIds }]).
// NO-REGRESSION: with one active program every team maps to it → one group, and
// CoachTail falls through to its flat render. Teams with no matched program land
// in a trailing '__none__' group (defensive; shouldn't happen for active teams).
const PROGRAM_NOUN = { season: 'teams', camp: 'camp', group_training: 'training', clinic: 'clinic' };

export function groupTeamsByProgram(teams, programs) {
  const programOf = new Map();
  for (const p of programs || []) for (const tid of p.teamIds || []) programOf.set(tid, p);
  const groups = new Map();
  for (const t of teams || []) {
    const p = programOf.get(t.id);
    const key = p?.id || '__none__';
    if (!groups.has(key)) {
      const label = p ? `${p.name} · ${PROGRAM_NOUN[p.programType] || 'teams'}` : 'Other';
      groups.set(key, { programId: key, label, teams: [] });
    }
    groups.get(key).teams.push(t);
  }
  return [...groups.values()];
}

export function alertToActionItem(alert) {
  const label = ALERT_LABELS[alert.alert_type_key] || alert.alert_type_key;
  const n = (alert.data?.events?.length || 0) + (alert.data?.tournaments?.length || 0);
  return {
    domain: 'generic',
    id: `alert-${alert.config_id}`,
    // HOME_RENDERS alert rows read "{label} · {N events}" on one line.
    primary: n ? `${label} · ${n} event${n !== 1 ? 's' : ''}` : label,
    to: '/schedule',
    // Severity drives the act-now treatment (amber/red rail + icon) in
    // ActionRow — D-B. critical → danger, warning → amber, else neutral.
    severity: alert.severity || 'warning',
  };
}
