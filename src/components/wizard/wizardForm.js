// Form-state shape helpers for CreateActivityWizard. Kept separate so
// the wizard component stays under the 150-line ceiling.

export const PRESET_DURATIONS = [60, 90, 120];

export const EMPTY_FORM = {
  eventType: null, teamId: null,
  date: '', startTime: '', endTime: '', durationMinutes: null,
  location: '', locationAddress: '', subLocation: '', arrivalMinutes: 5,
  title: '', opponent: '', tournamentName: '', homeAway: 'tbd', jersey: '',
  notes: '', coachNotes: '',
  indoor: true, enableRides: false, isScrimmage: false,
  recurrence: { pattern: 'once', until: null },
  duties: [],
};

// Builds wizard form state from an existing event row. Splits the
// timestamps back into date + HH:MM strings and detects whether the
// duration matches a preset chip.
export function eventToForm(event) {
  const startAt = new Date(event.start_at);
  const endAt = event.end_at ? new Date(event.end_at) : startAt;
  const date = event.start_at.slice(0, 10);
  const startTime = startAt.toTimeString().slice(0, 5);
  const endTime = endAt.toTimeString().slice(0, 5);
  const durationMinutes = Math.round((endAt - startAt) / 60000);
  return {
    eventType: event.event_type,
    teamId: event.team_id,
    date, startTime, endTime,
    durationMinutes: PRESET_DURATIONS.includes(durationMinutes) ? durationMinutes : null,
    location: event.location || '', locationAddress: event.location_address || '',
    subLocation: event.sub_location || '',
    arrivalMinutes: event.arrival_minutes_before ?? 5,
    title: event.title || '',
    opponent: event.opponent || '',
    tournamentName: event.tournament_name || '',
    homeAway: event.home_away || 'tbd',
    jersey: event.jersey || '',
    notes: event.notes || '',
    coachNotes: event.coach_notes || '',
    indoor: event.indoor ?? true,
    enableRides: event.enable_rides || false,
    isScrimmage: event.is_scrimmage || false,
    recurrence: { pattern: 'once', until: null },
    duties: [],
  };
}
