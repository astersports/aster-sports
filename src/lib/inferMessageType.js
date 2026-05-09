// Pure helpers for the Briefings inbox: timing-based kind inference,
// human-readable labels, why-strings for the "Sending as: X (why)" UX, and
// row urgency classification. No React or Supabase coupling.
//
// Kind values must match the comms_messages.kind CHECK constraint
// (see foundation migration 20260508234920).

const DAY_MS = 86400000;

// Returns one of the production kind CHECK values based on
// where "now" sits relative to the tournament window.
export function inferMessageType(tournament, now = new Date()) {
  if (!tournament?.start_date) return 'custom';
  const startMs = new Date(`${tournament.start_date}T00:00:00`).getTime();
  const endMs = new Date(`${tournament.end_date || tournament.start_date}T23:59:59`).getTime();
  const nowMs = now.getTime();
  const daysUntilStart = (startMs - nowMs) / DAY_MS;
  const daysAfterEnd = (nowMs - endMs) / DAY_MS;

  if (daysAfterEnd > 0) return 'tournament_recap_final';
  if (nowMs >= startMs && nowMs <= endMs) {
    const hour = now.getHours();
    const isMultiDay = endMs - startMs > DAY_MS;
    if (isMultiDay && hour >= 18) return 'tournament_recap_interim';
    if (isMultiDay) return 'tournament_recap_interim';
    return 'tournament_final';
  }
  if (daysUntilStart < 1) return 'tournament_rsvp_lock';
  if (daysUntilStart <= 5) return 'tournament_final';
  return 'tournament_preliminary';
}

export function messageTypeLabel(type) {
  const map = {
    weekly_digest:            'Weekly Digest',
    tournament_preliminary:   'Tournament Preliminary',
    tournament_final:         'Tournament Final',
    tournament_rsvp_lock:     'Tournament RSVP Lock',
    tournament_recap_interim: 'Tournament Interim Recap',
    tournament_recap_final:   'Tournament Final Recap',
    schedule_change:          'Schedule Change',
    multi_team_notice:        'Multi-Team Notice',
    academy_callup_notice:    'Academy Call-Up',
    custom:                   'Custom',
  };
  return map[type] || type;
}

// Short rationale for the operator: what the system used to pick this type.
export function whyLabel(type) {
  const map = {
    weekly_digest:            'weekly cadence',
    tournament_preliminary:   '5+ days out',
    tournament_final:         '2-5 days out',
    tournament_rsvp_lock:     'less than 24 hours',
    tournament_recap_interim: 'mid-tournament',
    tournament_recap_final:   'after tournament',
    schedule_change:          'manual override',
    multi_team_notice:        'manual override',
    academy_callup_notice:    'roster locked',
    custom:                   'manual override',
  };
  return map[type] || 'manual override';
}

// Engine support today: tournament_preliminary (legacy port) +
// academy_callup_notice (new in renderer wave 1). Other kinds remain
// stubs in the dropdown until later waves land their renderers.
export const ENGINE_SUPPORTED_TYPES = new Set([
  'tournament_preliminary',
  'academy_callup_notice',
]);

// Days out of the tournament's start_date used for urgency classification.
export function daysUntil(tournament, now = new Date()) {
  if (!tournament?.start_date) return Infinity;
  const startMs = new Date(`${tournament.start_date}T00:00:00`).getTime();
  return (startMs - now.getTime()) / DAY_MS;
}

// Inbox row urgency dot color.
//   sent   = green check
//   post   = completed tournament, recap not yet sent (no time pressure)
//   red    = within 24h of start, no send yet
//   amber  = 2-5 days out, no send yet
//   normal = >5 days out, no send yet
export function urgencyForRow({ hasSentInferred, daysUntilStart, tournamentState }) {
  if (hasSentInferred) return 'sent';
  if (tournamentState === 'completed') return 'post';
  if (daysUntilStart < 1) return 'red';
  if (daysUntilStart <= 5) return 'amber';
  return 'normal';
}

// Tournament timeline state derived from start/end dates.
//   pending   = upcoming or in-progress (today <= end_date)
//   completed = past (today > end_date)
export function tournamentStateFor(tournament, now = new Date()) {
  if (!tournament?.end_date && !tournament?.start_date) return 'pending';
  const endMs = new Date(`${tournament.end_date || tournament.start_date}T23:59:59`).getTime();
  return now.getTime() > endMs ? 'completed' : 'pending';
}
