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

export function generateEventIcs(event) {
  const descParts = [];
  if (event.arrival_minutes_before > 0) descParts.push(`Arrive ${event.arrival_minutes_before} min early`);
  if (event.jersey) descParts.push(`${event.jersey} jersey`);
  if (event.notes) descParts.push(event.notes);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ember//EN',
    'BEGIN:VEVENT',
    `DTSTART:${toIcsUtc(event.start_at)}`,
    `DTEND:${toIcsUtc(event.end_at)}`,
    `SUMMARY:${escapeText(event.title || '')}`,
  ];
  if (event.location_name) lines.push(`LOCATION:${escapeText(event.location_name)}`);
  if (descParts.length) lines.push(`DESCRIPTION:${escapeText(descParts.join('\n'))}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(event) {
  const ics = generateEventIcs(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title || 'event'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
