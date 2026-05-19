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

export function generateTeamIcs(teamName, events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ember//EN',
    `X-WR-CALNAME:${escapeText(teamName)}`,
  ];
  events.forEach((event) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@ember`);
    lines.push(`DTSTART:${toIcsUtc(event.start_at)}`);
    if (event.end_at) lines.push(`DTEND:${toIcsUtc(event.end_at)}`);
    lines.push(`SUMMARY:${escapeText(event.title || event.event_type || 'Event')}`);
    if (event.location_name) lines.push(`LOCATION:${escapeText(event.location_name)}`);
    if (event.opponent) lines.push(`DESCRIPTION:${escapeText(`vs. ${event.opponent}`)}`);
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
