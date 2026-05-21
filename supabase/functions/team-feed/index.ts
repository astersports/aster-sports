// team-feed edge function.
//
// V-23 iCal subscription URL handler. Renders an ICS calendar feed
// for a given team identified by an opaque team_feed_token (stored
// on the teams table per migration 20260520093701). Anonymous
// access — the token IS the auth (treat as bearer secret).
//
// URL shape: /functions/v1/team-feed?token=<uuid>
// Returns: 200 text/calendar with the team's published events ICS,
//          404 if token doesn't resolve, 400 if token is missing.
//
// Per CLAUDE.md anti-pattern #30: ICS-generation logic mirrored
// from src/lib/icalHelpers.js (cannot import across the function
// bundle boundary). Mirror is byte-near-identical apart from TS
// annotations. When changing one, change both in the same commit.
//
// Per CLAUDE.md anti-pattern #31: verify_jwt=false matches the
// existing token-handler functions (rsvp-token-handler,
// callup-token-handler, unsubscribe-handler) — custom auth via
// URL-param token, not JWT.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

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

interface EventRow {
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

function generateTeamIcs(teamName: string, events: EventRow[]): string {
  const nowStamp = toIcsUtc(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ember//EN',
    'METHOD:PUBLISH',
    'X-WR-TIMEZONE:America/New_York',
    foldLine(`X-WR-CALNAME:${escapeText(teamName)}`),
  ];
  for (const event of events) {
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
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: teamRows, error: teamErr } = await supabase.rpc('get_team_by_feed_token', { p_token: token });
  if (teamErr) {
    console.error('team-feed lookup:', teamErr.message);
    return new Response('Lookup error', { status: 500 });
  }
  const team = teamRows && teamRows.length > 0 ? teamRows[0] : null;
  if (!team) {
    return new Response('Not found', { status: 404 });
  }
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const { data: events, error: eventsErr } = await supabase
    .from('events')
    .select('id, title, event_type, start_at, end_at, location_name, opponent, updated_at, created_at')
    .eq('team_id', team.id)
    .neq('status', 'cancelled')
    .gte('start_at', twoYearsAgo.toISOString())
    .order('start_at', { ascending: true })
    .limit(500);
  if (eventsErr) {
    console.error('team-feed events:', eventsErr.message);
    return new Response('Events error', { status: 500 });
  }
  const ics = generateTeamIcs(team.name, events || []);
  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
});
