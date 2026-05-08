// Pure helpers for the Briefings inbox: timing-based message_type inference,
// human-readable labels, why-strings for the "Sending as: X (why)" UX, and
// row urgency classification. No React or Supabase coupling.

const DAY_MS = 86400000;

// Returns one of the production message_type CHECK values based on
// where "now" sits relative to the tournament window.
export function inferMessageType(tournament, now = new Date()) {
  if (!tournament?.start_date) return 'custom';
  const startMs = new Date(`${tournament.start_date}T00:00:00`).getTime();
  const endMs = new Date(`${tournament.end_date || tournament.start_date}T23:59:59`).getTime();
  const nowMs = now.getTime();
  const daysUntilStart = (startMs - nowMs) / DAY_MS;
  const daysAfterEnd = (nowMs - endMs) / DAY_MS;

  if (daysAfterEnd > 0) return 'weekend_recap';
  if (nowMs >= startMs && nowMs <= endMs) {
    const hour = now.getHours();
    const isMultiDay = endMs - startMs > DAY_MS;
    if (isMultiDay && hour >= 18) return 'day1_recap';
    if (isMultiDay) return 'saturday_scenarios';
    return 'final_schedule';
  }
  if (daysUntilStart < 1) return 'rsvp_lock';
  if (daysUntilStart <= 5) return 'final_schedule';
  return 'preliminary_schedule';
}

export function messageTypeLabel(type) {
  const map = {
    preliminary_schedule: 'Preliminary Schedule',
    final_schedule:       'Final Schedule',
    rsvp_lock:            'RSVP Lock',
    saturday_scenarios:   'Saturday Scenarios',
    day1_recap:           'Day 1 Recap',
    weekend_recap:        'Weekend Recap',
    schedule_change:      'Schedule Change',
    multi_team_notice:    'Multi-Team Notice',
    custom:               'Custom',
  };
  return map[type] || type;
}

// Short rationale for the operator: what the system used to pick this type.
export function whyLabel(type) {
  const map = {
    preliminary_schedule: '5+ days out',
    final_schedule:       '2-5 days out',
    rsvp_lock:            'less than 24 hours',
    saturday_scenarios:   'mid-tournament',
    day1_recap:           'end of day 1',
    weekend_recap:        'after tournament',
    schedule_change:      'manual override',
    multi_team_notice:    'manual override',
    custom:               'manual override',
  };
  return map[type] || 'manual override';
}

// Engine support today: only preliminary_schedule renders. Other types are
// stubs in the dropdown; Send button stays disabled until the engine ships.
export const ENGINE_SUPPORTED_TYPES = new Set(['preliminary_schedule']);

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
