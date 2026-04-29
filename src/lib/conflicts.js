// detectConflicts(activities)
// Pure function. Returns { [event_id]: { teamName, startTime } } for events
// whose [start_at, end_at] window overlaps with another event in the input
// list. When end_at is null, treats the event as start_at + 90min default
// duration so practice-without-explicit-end-time still surfaces collisions.
//
// Sorts events by start_at, walks each pair, and records both sides of every
// detected overlap. Non-conflicting events are absent from the returned map.

const DEFAULT_DURATION_MS = 90 * 60 * 1000;

function endOf(event) {
  if (event.end_at) return new Date(event.end_at).getTime();
  return new Date(event.start_at).getTime() + DEFAULT_DURATION_MS;
}

function teamLabel(event) {
  return event.teams?.name || event.team_name || 'another team';
}

function timeLabel(event) {
  return new Date(event.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function detectConflicts(activities) {
  if (!activities || activities.length < 2) return {};
  const sorted = [...activities]
    .filter((a) => a?.id && a.start_at)
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const out = {};
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    const aEnd = endOf(a);
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      const bStart = new Date(b.start_at).getTime();
      if (bStart >= aEnd) break;
      out[a.id] = { teamName: teamLabel(b), startTime: timeLabel(b) };
      out[b.id] = { teamName: teamLabel(a), startTime: timeLabel(a) };
    }
  }
  return out;
}
