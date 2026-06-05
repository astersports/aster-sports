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
// intent='notify' override (changed 2026-06-05):
//   The hero "Notify families" action means "send a heads-up to THIS event's
//   families" — a general event-scoped announcement, NOT a change-notification.
//   schedule_change needs an actual event edit to generate its before/after
//   diff (event_change_audit), which makes it a poor COLD default: a notify
//   tap with no recent edit lands on an empty diff prompt. So intent='notify'
//   now maps to kind=announcement, which works immediately (free-form headline
//   + body, no diff required).
//
//   Audience pre-scope: the families who'd attend THIS event = the event's
//   TEAM families. announcement's valid anchorKinds are ['team','org'] (event
//   is NOT a valid announcement anchor — KIND_METADATA), so we anchor on the
//   event's team: anchor=team&id=<team_id>&kind=announcement. That is exactly
//   the established "Message this team" entry point (#2): buildInitial ->
//   audienceFromAnchor lands audience_type='team' + audience_filter.team_ids
//   pre-set, and reconcileAudienceForKind HONORS that team pre-fill for
//   announcement (it lists 'team' as a real send mode). Net: the composer
//   lands at the Body step pre-scoped to this team's families, NOT org_all
//   (102 families).
//
//   FLAGGED: this deliberately uses anchor=team (the event's team), not
//   anchor=event. announcement cannot carry an event anchor cleanly — 'event'
//   is not in its anchorKinds, so reconcileAnchorForKind would drop it. The
//   team anchor is the closest-correct scope using EXISTING machinery (no
//   parallel path), and announcement is free-form so no event-anchored body
//   content is lost. If the event has no team_id (rare — e.g. a multi-team
//   tournament event), we fall back to kind=announcement with no team anchor;
//   the composer opens on the Kind step pre-selecting announcement and the
//   admin picks the scope (better than silently forcing org_all).

const COMPOSE_BASE = '/admin/briefings/compose';

export function composeFromEvent(event, isPast, { intent } = {}) {
  if (!event?.id) return null;
  if (intent === 'notify') {
    if (event.team_id) {
      return `${COMPOSE_BASE}?anchor=team&id=${event.team_id}&kind=announcement`;
    }
    return `${COMPOSE_BASE}?kind=announcement`;
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
