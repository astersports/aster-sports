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
  tournamentId: null, isBracketGame: false, isChampionshipFinal: false, isBonusGame: false,
  recurrence: { pattern: 'once', until: null },
  duties: [],
};

// Builds wizard form state from an existing event row. Splits the
// timestamps back into date + HH:MM strings and detects whether the
// duration matches a preset chip.
export function eventToForm(event) {
  const startAt = new Date(event.start_at);
  const endAt = event.end_at ? new Date(event.end_at) : startAt;
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${startAt.getFullYear()}-${pad(startAt.getMonth() + 1)}-${pad(startAt.getDate())}`;
  const startTime = `${pad(startAt.getHours())}:${pad(startAt.getMinutes())}`;
  const endTime = `${pad(endAt.getHours())}:${pad(endAt.getMinutes())}`;
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
    tournamentId: event.tournament_id || null,
    isBracketGame: event.is_bracket_game || false,
    isChampionshipFinal: event.is_championship_final || false,
    isBonusGame: event.is_bonus_game || false,
    recurrence: { pattern: 'once', until: null },
    duties: [],
  };
}

// Wave 3.8 §5.2: builds the schedule_change diff payload that
// EventDetailPage uses to decide whether to prompt notify-families.
// Returns null when neither time nor location changed (no prompt fires).
export function buildSaveDiff({ editEvent, form, editMode }) {
  if (!editEvent) return null;
  const isInstance = editMode === 'instance' || editMode === 'single';
  const oldStart = editEvent.start_at;
  const oldEnd = editEvent.end_at;
  const oldLoc = editEvent.location || null;
  const newStart = new Date(`${form.date}T${form.startTime}`).toISOString();
  const newEnd = new Date(`${form.date}T${form.endTime}`).toISOString();
  const newLoc = form.location || null;
  const timeChanged = newStart !== oldStart || newEnd !== oldEnd;
  const locChanged = newLoc !== oldLoc;
  if (!timeChanged && !locChanged) return null;
  return {
    eventId: editEvent.id,
    scope: isInstance ? 'instance' : editMode,
    changeKind: timeChanged ? 'time' : 'location',
    before: { start_at: oldStart, end_at: oldEnd, location: oldLoc },
    after: { start_at: newStart, end_at: newEnd, location: newLoc },
  };
}
