// Compose-from-event deep-link builder (compose-flow friction fix, 2026-06-05).
//
// The event-detail hero "Compose briefing" action should land the admin in a
// PRE-SCOPED composer for the contextually-correct kind — not the cold kind
// picker. This pure helper maps event_type + timing → the
// /admin/briefings/compose?... deep-link the BriefingComposer consumes via
// useBriefingDeepLink + buildInitial.
//
// Mapping (prompt-locked):
//   tournament event, PAST     → anchor=tournament&id=<tournament_id>&kind=tournament_recap
//   tournament event, UPCOMING → anchor=tournament&id=<tournament_id>&kind=tournament_prelim
//   game event, PAST           → anchor=event&id=<eventId>&kind=game_recap
//   game event, UPCOMING       → anchor=event&id=<eventId>   (kind ambiguous —
//                                pre-scope the anchor, show kind chips, let the
//                                admin pick. No wrong kind is forced. FLAGGED.)
//
// buildInitial pre-fills:
//   - anchor=event&id=<id>&kind=game_recap → step 3, GameRecapBody resolves the
//     anchored game from anchorId (no re-selection).
//   - anchor=tournament&id=<tid>&kind=tournament_{prelim,recap} → step 3, the
//     tournament body resolves from the tournament anchor (no re-selection).
//   - anchor=event&id=<id> with no kind → step 1 with the event anchor carried
//     in reducer state; picking a kind via chips honors it.
//
// A tournament event with no tournament_id cannot anchor on the tournament; it
// falls back to the event anchor (kind omitted) so the action still pre-scopes
// to that event rather than dumping the admin on a fully cold picker.
//
// intent='notify' override:
//   The hero "Notify families" action ALWAYS means "tell families about a
//   change to THIS event" — that's the schedule_change kind, regardless of
//   event_type or past/upcoming. So intent='notify' forces
//   anchor=event&id=<eventId>&kind=schedule_change (event anchor, not the
//   tournament anchor — the change is to this event). schedule_change's
//   anchorKind is locked to 'event' (KIND_METADATA), and its resolver
//   self-fetches the before/after diff from event_change_audit by eventId;
//   the deep-link pre-scopes kind + event so the admin lands in the Body
//   step instead of the cold picker. The actual diff is captured when the
//   admin edits + resaves the event (buildSaveDiff / ScheduleChangeBody),
//   so a notify deep-link with no recent edit shows the "open from the
//   EventDetail edit flow" prompt — the best available pre-scope.

const COMPOSE_BASE = '/admin/briefings/compose';

export function composeFromEvent(event, isPast, { intent } = {}) {
  if (!event?.id) return null;
  if (intent === 'notify') {
    return `${COMPOSE_BASE}?anchor=event&id=${event.id}&kind=schedule_change`;
  }
  const isTournament = event.event_type === 'tournament';
  if (isTournament && event.tournament_id) {
    const kind = isPast ? 'tournament_recap' : 'tournament_prelim';
    return `${COMPOSE_BASE}?anchor=tournament&id=${event.tournament_id}&kind=${kind}`;
  }
  // Regular game (or a tournament event lacking a tournament_id): anchor on the
  // event itself.
  if (isPast && event.event_type === 'game') {
    return `${COMPOSE_BASE}?anchor=event&id=${event.id}&kind=game_recap`;
  }
  // Upcoming regular game (kind ambiguous) or tournament-without-tournament_id:
  // pre-scope the event anchor, omit the kind, let the chips drive.
  return `${COMPOSE_BASE}?anchor=event&id=${event.id}`;
}
