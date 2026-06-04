// Single source for audience_type → display label.
//
// This map was duplicated in StepSendConfirm + StepAnchorAudience, and the raw
// enum was leaking into the UI in two more places — the sent-history subtitle
// ("Sent 2h ago · org_all") and the Recent/Favorites audience chips (a "team"
// caption under "10U Black"). One canonical map fixes all four (AP #63).
//
// audienceLabel() falls back to the raw type so an unknown value still renders
// something rather than blank.

export const AUDIENCE_LABEL = {
  team: 'Team',
  multi_team: 'Multiple teams',
  tournament_attendees: 'Tournament attendees',
  event_attendees: 'Event attendees',
  player_specific: 'Specific player(s)',
  multi_event_attendees: 'Selected games’ families',
  org_all: 'All families',
  coach_self: 'Coach only',
  family_specific: 'This family',
};

export function audienceLabel(type) {
  return AUDIENCE_LABEL[type] || type || '';
}
