// Wave 4.2-A-7 — pure helpers for academyCallupNotice resolver pair.
// Reuses urgency + day formatters from rsvpNudgeHelpers (identical
// semantics across both event-anchored kinds).

import { computeUrgency, formatLongDay, formatTime } from './rsvpNudgeHelpers';

export class EventNotFoundError extends Error { constructor(id) { super(`Event ${id} not found.`); this.name = 'EventNotFoundError'; this.eventId = id; } }
export class PlayerNotFoundError extends Error { constructor(id) { super(`Player ${id} not found.`); this.name = 'PlayerNotFoundError'; this.playerId = id; } }
export class PlayerNotAcademyError extends Error { constructor(id) { super(`Player ${id} is not a futures_academy member.`); this.name = 'PlayerNotAcademyError'; this.playerId = id; } }
export class EventHasNoTeamError extends Error { constructor(id) { super(`Event ${id} has no team_id.`); this.name = 'EventHasNoTeamError'; this.eventId = id; } }
export class EventAlreadyStartedError extends Error { constructor(id) { super(`Event ${id} has already started.`); this.name = 'EventAlreadyStartedError'; this.eventId = id; } }
export class PlayerNotCalledUpError extends Error { constructor(eventId, playerId) { super(`Player ${playerId} is not in event ${eventId} academy_callup_player_ids.`); this.name = 'PlayerNotCalledUpError'; this.eventId = eventId; this.playerId = playerId; } }

export function trim(s) { return (s == null ? '' : String(s)).trim(); }

export function computeResponseWindow(eventStartIso, now) {
  const TWO_H = 2 * 3600000;
  const HALF_H = 30 * 60000;
  const startMs = new Date(eventStartIso).getTime();
  const cap = startMs - HALF_H;
  const proposed = now.getTime() + TWO_H;
  const deadlineMs = Math.min(proposed, cap);
  const deadline_at = new Date(deadlineMs).toISOString();
  const hours_to_respond = (deadlineMs - now.getTime()) / 3600000;
  let window_label;
  if (hours_to_respond <= 4) {
    window_label = `Please respond by ${formatTime(deadline_at)} today.`;
  } else {
    window_label = `Please respond by ${formatLongDay(deadline_at)} at ${formatTime(deadline_at)}.`;
  }
  return { deadline_at, hours_to_respond, window_label };
}

export function buildNarrative({ kid_first_name, home_team_name, receiving_team_name, is_same_team, event_label, day_label, opponent }) {
  const eventLc = (event_label || 'event').toLowerCase();
  const dayPossessive = day_label ? `${day_label}'s` : "this week's";
  const oppSuffix = opponent ? ` vs ${opponent}` : '';
  if (is_same_team) {
    return `${kid_first_name} has been called up from the ${home_team_name} futures roster to the ${home_team_name} active roster for ${dayPossessive} ${eventLc}.${oppSuffix}`.replace(/\.$/, '.');
  }
  return `${kid_first_name} has been called up from ${home_team_name} futures to play with ${receiving_team_name} for ${dayPossessive} ${eventLc}.${oppSuffix}`.replace(/\.$/, '.');
}

export { computeUrgency };
