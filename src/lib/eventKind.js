import { TYPE_LABELS } from './constants';

// Event KIND label + Badge variant — operator request 2026-06-13:
// "the schedules need to identify if it's a practice, game, training,
// camp, etc. according to the PROGRAM and the EVENTS." The label combines
// events.event_type with the team's PROGRAM type (programs.program_type),
// so a practice under a camp reads "Camp", under a tryout reads "Tryout",
// while a season practice stays "Practice". program_type rides
// event.teams.program.program_type (the useActivities embed); when absent
// (legacy rows / batchless fixtures) it degrades to the event_type label —
// never throws, never blanks.

// A non-game event's program context overrides the bare "Practice" label.
const PROGRAM_PRACTICE_LABEL = {
  camp: 'Camp',
  clinic: 'Clinic',
  tryout: 'Tryout',
  evaluation: 'Evaluation',
};

export function eventKindLabel(event) {
  if (!event) return 'Event';
  if (event.is_scrimmage) return 'Scrimmage';
  const type = event.event_type;
  if (type === 'game') return 'Game';
  if (type === 'tournament') return 'Tournament';
  if (type === 'skills_lab') return 'Training';
  if (type === 'tryout') return 'Tryout';
  if (type === 'practice') {
    const pt = event.teams?.program?.program_type;
    return PROGRAM_PRACTICE_LABEL[pt] || 'Practice';
  }
  return TYPE_LABELS[type] || 'Event';
}

// Badge variant (color family): competitive = accent (cobalt); training =
// academy violet; tryout/evaluation = warning amber; camp/clinic = info
// blue; routine practice/scrimmage = neutral. All map to existing tokens.
export function eventKindVariant(event) {
  if (!event || event.is_scrimmage) return 'neutral';
  const type = event.event_type;
  const pt = event.teams?.program?.program_type;
  if (type === 'game' || type === 'tournament') return 'accent';
  if (type === 'skills_lab') return 'academy';
  if (type === 'tryout' || pt === 'tryout' || pt === 'evaluation') return 'warning';
  if (pt === 'camp' || pt === 'clinic') return 'info';
  return 'neutral';
}
