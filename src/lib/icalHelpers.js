// ICS calendar export helpers.

const pad = (n) => String(n).padStart(2, '0');

const toIcsUtc = (iso) => {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) + 'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) + 'Z'
  );
};

const escapeText = (s) => String(s)
  .replace(/\\/g, '\\\\')
  .replace(/\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

// RFC 5545 §3.1 — content lines SHOULD NOT exceed 75 octets.
// Fold at 74 chars: continuation lines start with a single space.
const foldLine = (line) => {
  if (line.length <= 74) return line;
  const parts = [];
  let i = 0;
  parts.push(line.slice(i, i + 74));
  i += 74;
  while (i < line.length) {
    parts.push(' ' + line.slice(i, i + 73));
    i += 73;
  }
  return parts.join('\r\n');
};

export function generateTeamIcs(teamName, events) {
  const nowStamp = toIcsUtc(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vela//EN',
    'METHOD:PUBLISH',
    'X-WR-TIMEZONE:America/New_York',
    foldLine(`X-WR-CALNAME:${escapeText(teamName)}`),
  ];
  events.forEach((event) => {
    const dtstamp = event.updated_at
      ? toIcsUtc(event.updated_at)
      : (event.created_at ? toIcsUtc(event.created_at) : nowStamp);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@ember`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${toIcsUtc(event.start_at)}`);
    if (event.end_at) lines.push(`DTEND:${toIcsUtc(event.end_at)}`);
    lines.push(foldLine(`SUMMARY:${escapeText(event.title || event.event_type || 'Event')}`));
    if (event.location_name) lines.push(foldLine(`LOCATION:${escapeText(event.location_name)}`));
    if (event.opponent) lines.push(foldLine(`DESCRIPTION:${escapeText(`vs. ${event.opponent}`)}`));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadTeamIcs(teamName, events) {
  const ics = generateTeamIcs(teamName, events);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${teamName.replace(/\s+/g, '-')}-schedule.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
