// team-feed ICS generation core (Deno mirror).
//
// Per CLAUDE.md anti-pattern #30: this file is the Deno mirror of
// src/lib/icsCore.js (the vitest-covered source of truth). The two are
// byte-near-identical apart from TS annotations. When changing one,
// change both in the same commit. Enforced by
// src/lib/__tests__/edgeFunctionMirrorAudit.test.js (pair activated in
// the P0 lane, 2026-06-12 — was deferred pending this _helpers.ts split).

const pad = (n: number): string => String(n).padStart(2, '0');

const toIcsUtc = (iso: string): string => {
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

const escapeText = (s: string): string => String(s)
  .replace(/\\/g, '\\\\')
  .replace(/\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

// RFC 5545 §3.1 — content lines SHOULD NOT exceed 75 octets.
// Fold at 74 chars: continuation lines start with a single space.
const foldLine = (line: string): string => {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let i = 0;
  parts.push(line.slice(i, i + 74));
  i += 74;
  while (i < line.length) {
    parts.push(' ' + line.slice(i, i + 73));
    i += 73;
  }
  return parts.join('\r\n');
};

export interface EventRow {
  id: string;
  title: string | null;
  event_type: string | null;
  start_at: string;
  end_at: string | null;
  location_name: string | null;
  opponent: string | null;
  updated_at: string | null;
  created_at: string | null;
}

export function generateTeamIcs(teamName: string, events: EventRow[]): string {
  const nowStamp = toIcsUtc(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aster Sports//EN',
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
